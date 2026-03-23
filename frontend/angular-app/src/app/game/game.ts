import { Component, OnInit, inject, ViewChild, ChangeDetectorRef, HostListener, Injectable } from '@angular/core'
import { CommonModule } from '@angular/common';
import { Env } from '../logic/Env';
import { Net } from '../logic/Net';
import { PID } from '../logic/PID';
import { Custom } from '../custom/custom';
import { ApiService } from '../auth.service';
import { GameService } from '../game/game.service';
import { Inspect } from "../inspect/inspect";

// add: better AI levels? + service for logged in user name to actually display + audio + thrust pngs? + cosmetic fixes

@Component({
  selector: 'app-game',
  standalone: true,
  imports: [CommonModule, Inspect], // for inspect component routed
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
  private bg2Points: {x:number, y:number, img:any}[] = [];
  private lClick = false;
  private rClick = false;
  private sClick = false;
  private gameEnded = true;
  private thrusts = [[0, 0], [0, 0], [0, 0, 0]]
  
  gServiceHelperHTML: boolean = false; // to make html update with cdr, wouldn't apply to gameservice directrly 

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
  train = false;
  inspect = false;

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
  bgImage = new Image(); // main bg img
  bgPaths = ['public/media/randombg.jpg', 'public/media/randombg1.jpg'];
  private bgImages: HTMLImageElement[] = [];
  audio0 = new Audio();

  sideLength = 1;
  firstSess = true;
  crashed = false;

  private tailsA: any[] = [];
  private tailsC: any[] = [];
  private tailsP: any[] = [];

  constructor(public gameService: GameService, private cdr: ChangeDetectorRef) { // cdr allows variables for html to be updated while canvas running, otherwise blocked
    document.title = "AI Pilots - Game";
    this.frameId = null;

    this.gServiceHelperHTML =  this.gameService.ownController;

    document.addEventListener('keydown', (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) this.isCtrlHeld = true;
      if (e.key === 'ArrowLeft') this.lClick = true;
      if (e.key === 'ArrowRight') this.rClick = true;
      if (e.key === 'ArrowUp') {this.sClick = true}; //; this.audio0.play();};
      if (e.key === ' ') {this.sClick = true};
      if (e.key === 'a') this.lClick = true;
      if (e.key === 'd') this.rClick = true;
      if (e.key === 'w') {this.sClick = true};
    });
    // a, w, d / sounds on thrusts and checkpoints / thrust visualisation!
    document.addEventListener('keyup', (e: KeyboardEvent) => {
      if (e.key === 'Control' || e.key === 'Meta') this.isCtrlHeld = false;
      if (e.key === 'ArrowLeft') this.lClick = false;
      if (e.key === 'ArrowRight') this.rClick = false;
      if (e.key === 'ArrowUp') this.sClick = false;
      if (e.key === ' ') this.sClick = false;
      if (e.key === 'a') this.lClick = false;
      if (e.key === 'd') this.rClick = false;
      if (e.key === 'w') this.sClick = false;
    });
  }

  detectGameService() {
    this.gServiceHelperHTML = this.gameService.ownController;
    this.cdr.detectChanges();
  }

  ngAfterViewInit() { // because constructor would attempt to draw before html starts to render
    this.bgImage.src = 'public/media/bg0.png';
    this.bgImage.onload = () => {
      this.bgPattern = this.context!.createPattern(this.bgImage, 'repeat')!;
    };

    this.bgPaths.forEach(pth => {
      const img = new Image();
      img.src = pth;
      this.bgImages.push(img);
    });


    this.skin0.src = 'public/skins/camera-drone.png';
    this.skin0.onload = () => {} //this.draw();
    this.skin1.src = 'public/skins/camera-drone1.png';
    this.skin1.onload = () => {}
    this.skin2.src = this.gameService.skinPath; //'public/skins/camera-drone2.png';
    this.skin2.onload = () => {}

    this.chp0.src = 'public/media/chp.png';
    this.chp0.onload = () => {}
    this.chp1.src = 'public/media/chp1.png';
    this.chp1.onload = () => {}
    this.chp2.src = 'public/media/chp2.png';
    this.chp2.onload = () => {}

    this.audio0.src = 'public/media/spacesound0.mp3'

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
    this.sideLength = sideLength;
        this.canvasWidth = canvas.width;
        this.canvasHeight = canvas.height;
    //this.canvasWidth = sideLength;
    //this.canvasHeight = sideLength;
    // just found+fixed bug:
    // canvas.width is physical size based on dpr, sideLength is logical, but that is removed when I use resetTransform
    // -> should use restore instead to get last saved(), and then scale with dpr (logical, game related size) is kept
    // -> but only while countdown is running, because of differences rendering logic in countdown / actual game
    // -> made function that does correct one depending on countdown: reset();

    // physics envs
    this.EnvA = new Env(canvas.width * 4, canvas.height * 4);
    this.EnvA.reset(this.EnvA.width / 2, this.EnvA.height / 2)
    this.EnvP = new Env(canvas.width * 4, canvas.height * 4, 0.4, 0.85, 2, 7, 3);
    this.EnvP.reset(this.EnvP.width / 2, this.EnvP.height / 2)
    this.EnvC = new Env(canvas.width * 4, canvas.height * 4);
    this.EnvC.reset(this.EnvC.width / 2, this.EnvC.height / 2)
  }

  onButtonClick(event: Event) {(event.target as HTMLElement).blur();} // removing browser focus to free space bar
  
  // verification for options
  canStart() {
    if (localStorage.getItem('user_id') === null) {alert("NOT LOGGED IN, NOTHING WILL SAVE"); console.log("not logged in")}
    
    let count = 0;
    if (this.aiSelected) count += 1;
    if (this.humanSelected) count += 1;
    if (this.customSelected) count += 1;
    if (this.aiSelected && this.selectedAiLevel === '') return false;
    return (count >= 2 && count <= 2 || this.train);
  }

  reset() {
    if (this.countdown > 0) this.context.restore();
    else this.context.resetTransform();
  }

  // general functions
  startGame() {
    if (!this.canStart()) { // check start conditions
      this.errorMsg = 'select at least two players, please';
      return;
    }

    this.crashed = false;
    this.quit(); // just in case

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
        this.firstSess = false;
        const canvas = this.canvas.nativeElement as HTMLCanvasElement;
        this.canvasWidth = canvas.width;
        this.canvasHeight = canvas.height;

        this.running = true;
        this.lastTime = performance.now();
        if (!this.train) {
          this.api.startMatch().subscribe({
            error: (err) => alert('reject: ' + err.error.error)
          })
        };

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

  protected startSpace() {
    this.sClick = true;
  }

  protected stopSpace() {
    this.sClick = false;
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
    console.log("toggled:", this.humanSelected)
  }

  toggleTrain() {
    this.train = !this.train
    this.aiSelected = false;
    this.customSelected = false;
    this.humanSelected = true;
    //this.toggleHuman(); // because training for human
  }

  toggleCustom() {
    this.customSelected = !this.customSelected;
    console.log("TOGGLED!")
  }

  toggleInspect() {
    this.inspect = !this.inspect;
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
    if (this.gameEnded || this.train) return;
    this.gameEnded = true;

    this.winner = this.scores[-1 + this.scores.indexOf(Math.max(this.scores[1], this.scores[3], this.scores[5]))];
    
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
    console.log('own controller data:', this.gameService.otherControllerData);
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
      this.tailsA = [];
      this.tailsC = [];
      this.tailsP = [];
    }

    this.running = false;
    this.countdown = 0;
    this.timeLeft = 0;
    this.errorMsg = '';
    this.gameEnded = false;

    this.bg2Points = [];

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
    if (this.crashed) return;
    this.cdr.detectChanges();
    const dt = (time - this.lastTime) / 1000;
    this.lastTime = time;

    console.log(this.canvasWidth, this.canvasHeight)


    // bg
    if (this.bgPattern) { // found this online
      const offsetX = -(this.EnvMain.x * this.sRat) % this.bgImage.width; // relative to drone coordinates, negativ for parallax effect
      const offsetY = -(this.EnvMain.y * this.sRat) % this.bgImage.height;
      const tileSize = 200;

      this.context!.save(); // saving to stack 
      this.context!.translate(offsetX, offsetY); // moving bg

      const xStart = -this.bgImage.width; // area to be filled with tileSize
      const yStart = -this.bgImage.height;
      const xEnd = this.canvasWidth + this.bgImage.width;
      const yEnd = this.canvasHeight + this.bgImage.height;

      for (let x = xStart; x < xEnd; x += tileSize) {
        for (let y = yStart; y < yEnd; y += tileSize) {
          this.context!.fillStyle = this.bgPattern; // fillstyle is img // ! in case it is null
          this.context!.fillRect(x, y, tileSize, tileSize);
        }
      }

      this.context!.restore(); // poping most recent, restoring it

      // other bg objects, bgxPoints are random points around drone:
      if (this.countdown <= 0 && (Math.hypot(this.EnvMain.chpX - this.EnvMain.x, this.EnvMain.chpY - this.EnvMain.y) < 70)) { // spawn once when checkpoint is reached
        const count = 2;
        for (let i = 0; i < count; i++) {
          const radiusX = this.canvasWidth * 2;
          const radiusY = this.canvasHeight * 2;
          let img = this.bgImages[Math.floor(Math.random() * this.bgImages.length)];
          this.bg2Points.push({
            x: this.EnvMain.x + (Math.random() - 0.5) * radiusX,
            y: this.EnvMain.y + (Math.random() - 0.5) * radiusY,
            img: img // random img assigned
          });
        }
      }

      // drawing other bg imgs
      const size = 48; // new size, different from tiling
      this.bg2Points.forEach((p) => { // place at each random point
        const screenX = this.canvasWidth / 2 + (p.x - this.EnvMain.x) * this.sRat;
        const screenY = this.canvasHeight / 2 + (p.y - this.EnvMain.y) * this.sRat;
        this.context!.drawImage(p.img, screenX - size / 2, screenY - size / 2, size, size);
      });
      
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
      let k = this.firstSess ? this.sideLength : this.canvasWidth;
      this.context.fillText(this.countdown.toString(), k / 2, k / 2);
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
    if (this.aiSelected && this.Net0 && !this.train) {
      outputNet0 = this.Net0.compute(this.stateN0, false);
    }

    let outputPID: any = [false, false];
    if (this.customSelected && this.gameService.ownController && !this.train) {
      outputPID = this.customData.compileController(this.statePID);
    } else if (this.customSelected && !this.train) {
      outputPID = this.customData.compileController(this.statePID, this.gameService.otherControllerData); // specify other controller, not mine (which would be default)
    }

    let outputPlayer: number[] = [0, 0];
    let thrustVisuals = [0, 0, 0];
    if (this.humanSelected) {
      const r = this.rClick ? .5 : 0;
      const l = this.lClick ? .5 : 0;
      const min = (this.rClick || this.lClick) ? 1 : 0;
      let thrustFactor = 1;
      if (this.EnvP.vy <= 0) {
        thrustFactor = Math.max((Math.tanh(Math.abs((this.EnvP.vy)))+2)**1.1, 1);
      } else {
        thrustFactor = Math.min(1 / (Math.tanh(this.EnvP.vy/5)/2+.5)**(1/2), 1);
      }
      const thrust = this.sClick ? (3 / thrustFactor)/1.5 : 0; // typescript safety thing
      outputPlayer = [thrust + l, thrust + r];
      thrustVisuals = [l, r, thrust]
      // this is basically an adjustment for the player, to make controls easier, I noticed later that it was too hard without this
    }

    this.thrusts = [outputNet0, outputPID, thrustVisuals]; // to use in visualisation
    let nextStates = this.step([outputNet0, outputPID, outputPlayer]);
    let nextStateN0 = nextStates[0];
    let nextStatePID = nextStates[1];
    let nextStatePl = nextStates[2];
    // onbly render computed ones
    if (this.aiSelected && !this.train) this.render(this.EnvA, time, this.skin0, this.chp0, "A");
    if (this.customSelected && !this.train) this.render(this.EnvC, time, this.skin1, this.chp1, "C");
    if (this.humanSelected) this.render(this.EnvP, time, this.skin2, this.chp2, "P");
    
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
    
    // step in physics states based on computed inputs/outputs
    let stateN0 = this.EnvA.step(thrusts[0])
    let statePID = this.EnvC.step(thrusts[1])
    let statePl = this.EnvP.step(thrusts[2])

    return [stateN0, statePID, statePl];
  } 
  
  // render everything from above
  render(droneEnv: any, t: number, skin: HTMLImageElement, chp: HTMLImageElement, mode: string) {
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

    if (this.humanSelected && mode==="P") {
      this.context.beginPath();
      this.context.moveTo(this.canvasWidth / 2, this.canvasHeight / 2);
      this.context.lineTo(relChPX, relChPY);
      this.context.strokeStyle = "#005854ff";
      this.context.lineWidth = 2.5;
      this.context.stroke();
    }
    
    this.context.drawImage(chp, relChPX-offset, relChPY-offset, 200*this.sRat, 200*this.sRat)


    if (Math.sqrt((chpX - this.EnvMain.x)**2 + (chpY - this.EnvMain.y)**2) > 4000) {this.crashMessage();}

    // bg
    // note: make multiple space background, sonme with objects in them already, randomly select in background processing!

    const relX = this.canvasWidth / 2 + (x - this.EnvMain.x) * this.sRat; // again relative to mainframe (frame of reference)
    const relY = this.canvasHeight / 2 + (y - this.EnvMain.y) * this.sRat;

    // visual thrust values, not actual power for physics:
    let thrustL: number;
    let thrustR: number;
    let thrustM: number;
    let centerX = relX;
    let centerY = relY;

    // update tails
    let toPush = {
      x: relX,
      y: relY,
      angle: this.EnvMain.angle,
      vx: this.EnvMain.vx,
      vy: this.EnvMain.vy,
    };
    let ta: any[] = [];
    if (mode==="P") {
      thrustL = this.thrusts[2][0] != 0 ? 2 : 0;
      thrustR = this.thrusts[2][1] != 0 ? 2 : 0;
      thrustM = this.thrusts[2][2] != 0 ? 1 : 0;
      centerX = this.canvasWidth / 2;
      centerY = this.canvasHeight / 2;

      if (droneEnv.x == this.EnvMain.x) {this.tailsP.push(toPush); ta = this.tailsP;}
      
    } else if (mode==="C") {
      thrustL = Math.tanh(this.thrusts[1][0])+1;
      thrustR = Math.tanh(this.thrusts[1][1])+1;
      thrustM = 0;
      if (droneEnv.x == this.EnvMain.x) {this.tailsC.push(toPush); ta = this.tailsC;}
    } else { //A
      thrustL = Math.tanh(this.thrusts[0][0])+1;
      thrustR = Math.tanh(this.thrusts[0][1])+1;
      thrustM = 0;
      if (droneEnv.x == this.EnvMain.x) {this.tailsA.push(toPush); ta = this.tailsA;}
    }

    if (ta.length > 20) ta.shift(); // remove first element if too long
    let n = 4;

    // tails:
    ta.forEach((data, i) => {
      const alpha = 1 / (i + 1) / 2;
      this.context.save();
      this.context.globalAlpha = alpha;
      this.context.fillStyle = 'blue';
      this.context.translate(data.x-(data.vx/n)*i, data.y-(data.vy/n)*i);
      //this.context.rotate(data.angle);
      this.context.beginPath();
      this.context.arc(0, 0, 20, 0, 2 * Math.PI);
      this.context.fillStyle = '#00ffffff';
      this.context.fill();   
      //this.context.fillRect(-75, -37.5, 150, 75); // match drone size
      this.context.restore();
    });

    this.context.beginPath();
    this.context.moveTo(centerX - 50 * Math.cos(angle), centerY - Math.sin(angle)*50);
    this.context.lineTo(centerX - 50 * Math.cos(angle), centerY - Math.sin(angle)*50 + thrustR * (10+15*(1-thrustM)) + thrustM*70);
    this.setStyle();

    this.context.beginPath();
    this.context.moveTo(centerX + 50 * Math.cos(angle), centerY + Math.sin(angle)*50);
    this.context.lineTo(centerX + 50 * Math.cos(angle), centerY + Math.sin(angle)*50 + thrustL * (10+15*(1-thrustM)) + thrustM*70);
    this.setStyle();

    this.context.beginPath();
    this.context.moveTo(centerX, centerY);
    this.context.lineTo(centerX, centerY + thrustM * 0);
    this.setStyle("blue");

    this.context.translate(relX, relY);
    this.context.rotate(angle);
    this.context.drawImage(skin, -75*this.sRat, -37.5*this.sRat, 150*this.sRat, 75*this.sRat);
    this.reset(); //restore when countdown running, else resetTransform //this.context.restore(); //resetTransform();
  }

  setStyle(color: string="white") {
    this.context.strokeStyle = 'rgba(255, 0, 255, 0.18)';
    this.context.lineWidth = 10;
    this.context.stroke();
    this.context.strokeStyle = 'rgba(212, 0, 255, 0.45)';
    this.context.lineWidth = 2.5;
    this.context.stroke();
    this.context.strokeStyle = color;
    this.context.lineWidth = 1;
    this.context.stroke();
  } // 3 layers for glow effect (best I could find for glowing, shadowblur not so good)
  
  crashMessage() {
      if (!this.humanSelected) return;
      this.running = false;
      this.crashed = true;
      // fiexd because before message would not stop to appear.
      if (this.frameId !== null) {
        cancelAnimationFrame(this.frameId);
        this.frameId = null;
      }
      this.context.save();
      this.context.fillStyle = 'white';
      this.context.font = 'bold 50px sans-serif';
      this.context.textAlign = 'center';
      this.context.textBaseline = 'middle';
      this.context.fillText("your drone lost navigation :/", this.canvasWidth / 2, this.canvasHeight * .75);
      this.context.fillText("if this was a technical error - sorry", this.canvasWidth / 2, this.canvasHeight * .825);
      this.context.restore();
      // this.frameId = requestAnimationFrame(t => this.draw(t));
      this.quit();
  }
}


// note: static private prop of construcotr, then getter function for
// getting the class instance of itself in the constructor, to prevent multiple instance,
// only config for example
// -> done by service, in angular not writing manually