import { Component, OnInit, inject, ViewChild, ChangeDetectorRef, HostListener, Injectable } from '@angular/core'
import { CommonModule } from '@angular/common';
import { Env } from '../logic/Env';
import { Net } from '../logic/Net';
import { PID } from '../logic/PID';
import { Custom } from '../custom/custom';
import { ApiService } from '../auth.service';
import { GameService } from '../game/game.service';

// not done yet: fix custom loading, fix game loading after changing accounts
// crash logic, visualisations
// quick guide to make user be able use game controls more esily inspect

@Component({
  selector: 'app-game',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './game.html',
  styleUrl: './game.css',
})

@Injectable({ providedIn: 'root' })
export class Game implements OnInit{
  ngOnInit() {}

  @ViewChild('canvas') canvas: any; // saved the canvas here

  get context(): CanvasRenderingContext2D { // virtual property 
    return this.canvas.nativeElement.getContext('2d') || new CanvasRenderingContext2D(); // to avoid '?'
  }
  
  private isCtrlHeld = false; // for canvas resizing on scroll/zoom
  private lastHeld = false;
  private canvasWidth = 0;
  private canvasHeight = 0;
  private bgPattern: CanvasPattern | null = null;
  private lClick = false;
  private rClick = false;
  private gameEnded = true;

  customData = inject(Custom); // can also edit instance config here!
  api = inject(ApiService);

  menuHidden = false;
  phoneMode = true;
  winner = '';

  frameId: any;
  referenceModes: boolean[] = [];
  running = false;
  static scores: number[] = [];

  showAI = false;
  
  Pid = new PID();
  Net0 = new Net();

  stateN0 = null;
  statePID = null;
  statePl = null;

  EnvP: any; // player
  EnvA: any; // AI
  EnvC: any; // Custom Controller (PID)
  EnvMain: any;

  // states for menu (to only have two players)
  aiSelected = false;
  humanSelected = false;
  customSelected = false;
  selectedAiLevel = '';
  selectedSkin = '';

  level = "";
  sRat: any; // screen size ratio to fixed number
  ratio: any;
  reTiInt: any // resizing time interval

  // countdown at beinning+ game time
  countdown = 0;
  timeLeft = 0;
  ptime = 0;
  isPaused = false;
  pauseStartTime = 0;
  private lastTimerUpdate = 0;
  errorMsg = '';

  skin0 = new Image();
  skin1 = new Image();
  skin2 = new Image();
  chp0 = new Image();
  chp1 = new Image();
  chp2 = new Image();
  bgImage = new Image();

  constructor(public gameService: GameService, private cdr: ChangeDetectorRef) { // cdr allows variables for html to be updated while canvas running, otherwise blocked
    document.title = "AI Pilots - Game";
    this.frameId = null;

    document.addEventListener('keydown', (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) this.isCtrlHeld = true;
      if (e.key === 'ArrowLeft') this.lClick = true;
      if (e.key === 'ArrowRight') this.rClick = true;
    });

    document.addEventListener('keyup', (e: KeyboardEvent) => {
      if (e.key === 'Control' || e.key === 'Meta') this.isCtrlHeld = false;
      if (e.key === 'ArrowLeft') this.lClick = false;
      if (e.key === 'ArrowRight') this.rClick = false;
    });
  }

  ngAfterViewInit() { // because constructor would attempt to draw before html starts to render
    this.bgImage.src = 'public/media/bg0.png';
    this.bgImage.onload = () => {
      this.bgPattern = this.context!.createPattern(this.bgImage, 'repeat')!;
    };

    this.skin0.src = 'public/skins/camera-drone.png';
    this.skin0.onload = () => {} //this.draw();
    this.skin1.src = 'public/skins/camera-drone1.png';
    this.skin1.onload = () => {}
    this.skin2.src = 'public/skins/camera-drone2.png';
    this.skin2.onload = () => {}

    this.chp0.src = 'public/media/chp.png';
    this.chp0.onload = () => {}
    this.chp1.src = 'public/media/chp1.png';
    this.chp1.onload = () => {}
    this.chp2.src = 'public/media/chp2.png';
    this.chp2.onload = () => {}

    const absoluteWidth = window.outerWidth * window.devicePixelRatio;
    const absoluteHeight = window.outerHeight * window.devicePixelRatio;
    this.sRat = absoluteWidth / 1900 * Math.max(1, absoluteHeight / absoluteWidth);

    const canvas = this.canvas.nativeElement as HTMLCanvasElement;
    const dpr = window.devicePixelRatio || 1
    const rect = canvas.getBoundingClientRect();
    const sideLength = Math.max(rect.width, rect.height)
    canvas.width  = sideLength * dpr;
    canvas.height = sideLength * dpr;
    this.context.scale(dpr, dpr);
    this.canvasWidth  = canvas.width;
    this.canvasHeight = canvas.height;

    // physics envs
    this.EnvA = new Env(canvas.width * 4, canvas.height * 4);
    this.EnvA.reset(this.EnvA.width / 2, this.EnvA.height / 2)
    this.EnvP = new Env(canvas.width * 4, canvas.height * 4, 0.4, 0.85, 2, 7, 3);
    this.EnvP.reset(this.EnvP.width / 2, this.EnvP.height / 2)
    this.EnvC = new Env(canvas.width * 4, canvas.height * 4);
    this.EnvC.reset(this.EnvC.width / 2, this.EnvC.height / 2)
  }
  
  // verification for options
  canStart() {
    let count = 0;
    if (this.aiSelected) count += 1;
    if (this.humanSelected) count += 1;
    if (this.customSelected) count += 1;
    if (this.aiSelected && this.selectedAiLevel === '') return false;
    return count >= 2 && count <= 2;
  }

  // general functions
  startGame() {
    if (!this.canStart()) { // check start conditions
      this.errorMsg = 'select at least two players, please';
      return;
    }

    if (this.humanSelected) {
          this.EnvMain = this.EnvP; // main frame (like camera), others are reference
    } else if (this.showAI) {
          this.EnvMain = this.EnvA;
    } else {
          this.EnvMain = this.EnvC;
    }

    this.isPaused = false;
    this.pauseStartTime = 0;
    this.ptime = 0;
    this.errorMsg = '';
    this.gameEnded = false;

    // timer init
    this.countdown = 3;
    this.timeLeft = 60;
    this.lastTimerUpdate = performance.now();
    this.running = false;
    this.draw();
    console.log('start game function');
    // countdown
    const tick = () => {
      if (this.countdown > 0) {
        this.countdown -= 1;
        setTimeout(tick, 1000); // ms
      } else {
        this.running = true;
        this.lastTime = performance.now();
        this.api.startMatch().subscribe(() => {});

      }
    };
    tick();
  }

  get scores() {
    return ["Human", this.EnvP?.score ?? 0, 
            "AI", this.EnvA?.score ?? 0, 
            "Custom", this.EnvC?.score ?? 0]
  }

  protected leftThrust() {
  }

  protected rightThrust() {
  }

  // more functions for button controls on phone
  protected startLeft() {
    this.lClick = true;
  }

  protected stopLeft() {
    this.lClick = false;
  }

  protected startRight() {
    this.rClick = true;
  }

  protected stopRight() {
    this.rClick = false;
  }

  // options:
  toggleAi() {
    this.aiSelected = !this.aiSelected;
    if (!this.aiSelected) {
      this.selectedAiLevel = ''; // has to clear i think
    }
  }

  selectAiLevel(level: string) {
    this.aiSelected = true;
    this.selectedAiLevel = level;
    this.level = level; // because loadnet uses this.leve
    this.loadNet0();
  }

  toggleHuman() {
    this.humanSelected = !this.humanSelected;
  }

  toggleCustom() {
    this.customSelected = !this.customSelected;
  }

  selectS(skin: string) { // will probably not do this, but based on score, idk yet
    this.selectedSkin = skin;
  }

  // string to display
  formatTime(seconds: number) {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = Math.floor(seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  }

  // game end
  private onGameEnd() {
    if (this.gameEnded) return;
    this.gameEnded = true;

    this.winner = this.scores[-1 + this.scores.indexOf(Math.max(this.scores[1], this.scores[3], this.scores[5]))];

    if (false) { // (!this.auth.isLoggedIn()) {
      console.log('not logged in, skipping score submission');
      this.quit();
      return;
    }
    
    const score = this.EnvP?.score ?? 0;
    const options: any = {};
    if (this.aiSelected) options.ai = this.selectedAiLevel;
    if (this.humanSelected) options.human = true;
    if (this.customSelected) options.custom = true;

    console.log(this.scores[0]);
    if (this.humanSelected) {
      this.api.submitScore(this.scores[1], 'human', this.ptime, [["willbeignored"], []]).subscribe({
        next: (res) => alert('tscore: ' + res.top_score),
        error: (err) => alert('reject: ' + err.error.error)
      });
    }

    if (this.gameService.ownController && this.customSelected) { // only submit if the players own controller
      this.api.submitScore(this.scores[5], 'custom', this.ptime, [this.customData.stringCharsL, this.customData.stringCharsR]).subscribe({
        next: (res) => alert('tscore: ' + res.top_score),
        error: (err) => alert('reject: ' + err.error.error)
      });
    } // if using controller from someone else, score should not be submitted

    this.quit();
  }

  logCont() {
    console.log('own controller:', this.gameService.ownController);
    console.log('own controller data:', this.gameService.ownControllerData);
  }

  // more options
  selectL(level: string) { // select level
    this.level = level;
    this.loadNet0();
  }

  loadNet0() {
    this.Net0.load(`public/models/drone_AI_weights-${this.level}.json`)
  }

  togglePause() {
    this.isPaused = !this.isPaused;
    if (this.isPaused) {
      this.pauseStartTime = Date.now();
      console.log("Paused...");
    } else {
      this.ptime += (Date.now() - this.pauseStartTime) / 1000;
      console.log("Resumed. Total paused time:", this.ptime);
    }
  }

  pause() {
    if (this.frameId !== null && this.running) {
      this.running = false;
      cancelAnimationFrame(this.frameId);
      this.frameId = null;
      this.togglePause();
    }
  }

  resume() {
    if (this.frameId === null && !this.running) {
      this.running = true;
      this.lastTime = performance.now(); // to prevent big dt in timer
      this.draw();
      this.togglePause();
    }
  }

  quit() {
    // stop animation + reset
    if (this.frameId !== null) {
      cancelAnimationFrame(this.frameId);
      this.frameId = null;
    }

    this.running = false;
    this.countdown = 0;
    this.timeLeft = 0;
    this.errorMsg = '';
    this.gameEnded = false;


    this.EnvA?.reset(this.EnvA.width / 2, this.EnvA.height / 2); // ? is in case smth is undefined, could be here
    this.EnvP?.reset(this.EnvP.width / 2, this.EnvP.height / 2);
    this.EnvC?.reset(this.EnvC.width / 2, this.EnvC.height / 2);
  }

  setMain(name: string) {
    if (name === "player") {this.EnvMain = this.EnvP;} else {this.EnvMain = this.EnvC;}
  }

  @HostListener('window:resize', ['$event'])
  onResize(event: any) {
    const absoluteWidth = window.outerWidth * window.devicePixelRatio;
    const absoluteHeight = window.outerHeight * window.devicePixelRatio;
    this.sRat = absoluteWidth / 1900 * Math.max(1, absoluteHeight / absoluteWidth);
    console.log("ONRESIZE", window.outerWidth * window.devicePixelRatio);
  }

  // computing controls + rendering canvas
  lastTime = 0;
  draw(time = 0) {
    this.cdr.detectChanges()
    const dt = (time - this.lastTime) / 1000;
    this.lastTime = time;


    // bg
    if (this.bgPattern) {
      const offsetX = -(this.EnvMain.x * this.sRat) % this.bgImage.width;
      const offsetY = -(this.EnvMain.y * this.sRat) % this.bgImage.height;
      // note: found this online for bg patterns:
      this.context!.save();
      this.context!.translate(offsetX, offsetY);
      this.context!.fillStyle = this.bgPattern;
      this.context!.fillRect(-this.bgImage.width, -this.bgImage.height, 
                          this.canvasWidth + this.bgImage.width * 2, 
                          this.canvasHeight + this.bgImage.height * 2);
      this.context!.restore();
    } else {
      this.context!.clearRect(0, 0, this.canvasWidth, this.canvasHeight);
    }

    // if countdown running
    if (this.countdown > 0) {
      this.context.save();
      this.context.fillStyle = 'white';
      this.context.font = 'bold 120px sans-serif';
      this.context.textAlign = 'center';
      this.context.textBaseline = 'middle';
      this.context.fillText(this.countdown.toString(), this.canvasWidth / 2, this.canvasHeight / 2);
      this.context.restore();
      this.frameId = requestAnimationFrame(t => this.draw(t));
      return;
    }

    // if playing
    if (this.running) {
      this.timeLeft -= dt;
      if (this.timeLeft <= 0) {
        this.running = false;
        this.onGameEnd();
      }
    }

    // envMain for cam frame of reference
    if (this.showAI && !this.humanSelected) {
          this.EnvMain = this.EnvA;
    } else if (!this.showAI && !this.humanSelected) {
          this.EnvMain = this.EnvC;
    }
    
    // computation
    let dummy = [[0, 0], [0, 0], [0, 0]] // to initialise
    if (this.stateN0 == null) {this.stateN0 = this.step(dummy)[0]}
    if (this.statePID == null) {this.statePID = this.step(dummy)[1]}
    if (this.statePl == null) {this.statePl = this.step(dummy)[2]}

    // conditions for which output computed, otherwise inefficient
    let outputNet0: any = [false, false];
    if (this.aiSelected && this.Net0) {
      outputNet0 = this.Net0.compute(this.stateN0);
    }

    let outputPID: any = [false, false];
    if (this.customSelected && this.gameService.ownController) {
      outputPID = this.customData.compileController(this.statePID);
    } else if (this.customSelected) {
      outputPID = this.customData.compileController(this.statePID, this.gameService.ownControllerData); // specify other controller, not mine (which would be default)
    }

    let outputPlayer: any = [false, false];
    if (this.humanSelected) {
      outputPlayer = [this.lClick, this.rClick];
    }

    let nextStates = this.step([outputNet0, outputPID, outputPlayer]);
    let nextStateN0 = nextStates[0];
    let nextStatePID = nextStates[1];
    let nextStatePl = nextStates[2];
    // onbly render computed ones
    if (this.aiSelected) this.render(this.EnvA, time, this.skin0, this.chp0);
    if (this.customSelected) this.render(this.EnvC, time, this.skin1, this.chp1);
    if (this.humanSelected) this.render(this.EnvP, time, this.skin2, this.chp2);
    
    this.stateN0 = nextStateN0;
    this.statePID = nextStatePID;
    this.statePl = nextStatePl;
    
    // animation frame + save frameId
    this.frameId = requestAnimationFrame(t => this.draw(t));
  }

  step(thrusts: any) {
    this.EnvA.spawnCheckpoints(); // spawns if found hit, otherwise not
    this.EnvC.spawnCheckpoints();
    this.EnvP.spawnCheckpoints();
    
    // step in physics states baased on computed inputs/outputs
    let stateN0 = this.EnvA.step(thrusts[0])
    let statePID = this.EnvC.step(thrusts[1])
    let statePl = this.EnvP.step(thrusts[2])

    return [stateN0, statePID, statePl];
  } 
  
  // render everything from above
  render(droneEnv: any, t: number, skin: HTMLImageElement, chp: HTMLImageElement) {
    let x = droneEnv.x;
    let y = droneEnv.y;
    let vx = droneEnv.vx;
    let vy = droneEnv.vy;
    let angle = droneEnv.a * Math.PI / 180;
    let chpX = droneEnv.chpX;
    let chpY = droneEnv.chpY;

    // draw checkpoint offset from drone's world position
    const relChPX = this.canvasWidth / 2 + (chpX - this.EnvMain.x) * this.sRat; // relative to mainframe from EnvMain
    const relChPY = this.canvasHeight / 2 + (chpY - this.EnvMain.y) * this.sRat;
    let offset = 200*this.sRat / 2
    this.context.drawImage(chp, relChPX-offset, relChPY-offset, 200*this.sRat, 200*this.sRat)

    if (vx > 50 || vy > 50) {this.crashMessage();}

    // bg
    // ...
  
    const relX = this.canvasWidth / 2 + (x - this.EnvMain.x) * this.sRat; // again relative to mainframe (frame of reference)
    const relY = this.canvasHeight / 2 + (y - this.EnvMain.y) * this.sRat;

    this.context.translate(relX, relY);
    this.context.rotate(angle);
    this.context.drawImage(skin, -75*this.sRat, -37.5*this.sRat, 150*this.sRat, 75*this.sRat);
    this.context.resetTransform();
  }

  crashMessage() {
      this.context.save();
      this.context.fillStyle = 'white';
      this.context.font = 'bold 120px sans-serif';
      this.context.textAlign = 'center';
      this.context.textBaseline = 'middle';
      this.context.fillText("you'r drone lost navigation :/", this.canvasWidth / 2, this.canvasHeight / 2);
      this.context.restore();
      this.frameId = requestAnimationFrame(t => this.draw(t));
      this.quit();
  }
}

//update: game visualisation, crash logic, rest of design

// --------------
// note to self, todo:
// game full logic + controls + full menu options! (timers, controls, scores, countdowns, trail traces, thrust visualisation, sounds!)
// -> calls to store data (top scores) locally / server (post, get)

// then: set up cloudflare for pi

// -> profile (name, id, passwd, score data): basic login page (post, get) -> display data
// leaderboard, skins, custom (just get)

// inspect: some explanation texts + neurons visualised live + canvas component for live view
// end: design everything, finish texts, check 




// note: static private prop of construcotr, then getter function for
// getting the class instance of itself in the constructor, to prevent multiple instance,
// only config for example
// -> done by service, in angular not writing manually