import { Component, inject, ViewChild, ChangeDetectorRef } from '@angular/core'

import { Env } from '../logic/Env';
import { Net } from '../logic/Net';
import { PID } from '../logic/PID';
import { Inject } from '@angular/core';
import { Home } from '../home/home';
import { stringify } from 'querystring';
import { stat } from 'fs';
import { Custom } from '../custom/custom';

@Component({
  selector: 'app-game',
  imports: [],
  templateUrl: './game.html',
  styleUrl: './game.css',
})

export class Game {
  @ViewChild('canvas') canvas: any; // saved the canvas here
  customData = inject(Custom); // can also edit instance config here!

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

  frameId: any;
  referenceModes: boolean[] = [];
  running = false;
  static scores: number[] = [];
  
  Pid = new PID();
  Net0 = new Net();

  stateN0 = null;
  statePID = null;
  statePl = null;

  EnvP: any; // player
  EnvA: any; // AI
  EnvC: any; // Custom Controller (PID)
  EnvMain: any;

  level = "";
  sRat: any; // screen size ratio to fixed number
  ratio: any;
  reTiInt: any // resizing time interval

  skin0 = new Image();
  skin1 = new Image();
  skin2 = new Image();
  chp0 = new Image();
  chp1 = new Image();
  chp2 = new Image();
  objects: any;
  bgImage = new Image();

  constructor(private cdr: ChangeDetectorRef) { // cdr allows variables for html to be updated while canvas running
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
    // media:
    this.bgImage.src = 'media/bg0.png';
    this.bgImage.onload = () => {
      this.bgPattern = this.context!.createPattern(this.bgImage, 'repeat')!;
    };

    this.skin0.src = 'skins/camera-drone.png';
    this.skin0.onload = () => {} //this.draw();
    this.skin1.src = 'skins/camera-drone1.png';
    this.skin1.onload = () => {}
    this.skin2.src = 'skins/camera-drone2.png';
    this.skin2.onload = () => {}

    this.chp0.src = 'media/chp.png';
    this.chp0.onload = () => {}
    this.chp1.src = 'media/chp1.png';
    this.chp1.onload = () => {}
    this.chp2.src = 'media/chp2.png';
    this.chp2.onload = () => {}

    this.objects = [];
    
    for (let name of ['astronaut', 'cometthin', 'cometthick', 'debris', 
                    'earth', 'moon', 'moon1', 'ppstardust', 
                    'redgalaxy', 'robot', 'saturn', 'telescope']) {
      
      //let obj = new Image();
      //obj.src = `media/${name}.png`;
      //obj.onload = () => this.draw();
      //this.objects.push(obj)

      //inefficient ... ?

    }

    // canvas sizing:
    let vw = Math.max(document.documentElement.clientWidth || 0, window.innerWidth || 0) / window.devicePixelRatio;
    let vh = Math.max(document.documentElement.clientHeight || 0, window.innerHeight || 0) / window.devicePixelRatio;
    this.sRat = Math.min(vw, vh) / 1500;
    this.ratio = this.sideRatio();

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
    this.EnvP = new Env(canvas.width * 4, canvas.height * 4, 0.4, 0.85, 2, 6, 2.5);
    this.EnvP.reset(this.EnvP.width / 2, this.EnvP.height / 2)
    this.EnvC = new Env(canvas.width * 4, canvas.height * 4);
    this.EnvC.reset(this.EnvC.width / 2, this.EnvC.height / 2)

    this.EnvMain = this.EnvP; // main frame (like camera), others are reference
  }

  // general functions
  startGame() {
    this.draw();
    console.log("start game function")
    this.running = true;
  }

  get scores() {
    return ["You: ", this.EnvP?.score ?? 0,
            "AI: ", this.EnvA?.score ?? 0, 
            "Custom: ", this.EnvC?.score ?? 0] //, this.EnvC.score, this.EnvP.score];
  }

  protected leftThrust() {

  }

  protected rightThrust() {
    
  }

  selectL(level: string) { // select level
    this.level = level;
    this.loadNet0();
  }

  selectS(skin: string) { // select skin

  }

  loadNet0() {
    this.Net0.load(`models/drone_AI_weights-${this.level}.json`)
  }

  pause() {
    if (this.frameId !== null && this.running) {
      cancelAnimationFrame(this.frameId);
      this.frameId = null;
      this.running = false;
    }
  }

  resume() {
    if (this.frameId === null && this.running) {
      this.draw();
      this.running = true;
    }
  }

  setMain(name: string) {
    if (name === "player") {this.EnvMain = this.EnvP;} else {this.EnvMain = this.EnvC;}
  }

  sideRatio() { // to size canvas
    return Math.max((window.innerWidth / window.innerHeight), 
                    (window.innerHeight / window.innerWidth))
  }

  resizeC() {
    let currentRatio = this.sideRatio();
    let dSize = Math.abs(currentRatio-this.ratio)

    if (!this.isCtrlHeld && dSize > 0.1 && !this.lastHeld) { // improvised approximation, if zooming, ctrl may be held
      let vw = Math.max(document.documentElement.clientWidth || 0, window.innerWidth || 0) / window.devicePixelRatio;
      let vh = Math.max(document.documentElement.clientHeight || 0, window.innerHeight || 0) / window.devicePixelRatio;
      this.sRat = Math.min(vw, vh) / (900);
      //console.log("resized")
    } else {
      //console.log("zoomed")
    }

    this.lastHeld = this.isCtrlHeld;    
 
    let ratio = this.sideRatio();
    this.ratio = ratio
    //efficiency prolems here?

    const canvas = this.canvas.nativeElement as HTMLCanvasElement;
    const dpr = window.devicePixelRatio || 1
    const rect = canvas.getBoundingClientRect()
    const sL = Math.max(rect.width, rect.height)
    canvas.width = sL * dpr;
    canvas.height = sL * dpr;
  }

  // computing controls + rendering canvas
  lastTime = 0;
  draw(time = 0) {
    this.cdr.detectChanges()

    const dt = (time - this.lastTime) / 1000;
    this.lastTime = time;

    if (this.bgPattern) {
      const offsetX = -(this.EnvMain.x * this.sRat) % this.bgImage.width;
      const offsetY = -(this.EnvMain.y * this.sRat) % this.bgImage.height;

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

    //this.context.clearRect(0, 0, this.canvasWidth, this.canvasHeight);

    //if (t - this.reTiInt > 16*5) {resizeC();}

    let dummy = [[0, 0], [0, 0], [0, 0]] // to initialise
    if (this.stateN0 == null) {this.stateN0 = this.step(dummy)[0]}
    if (this.statePID == null) {this.statePID = this.step(dummy)[1]}
    if (this.statePl == null) {this.statePl = this.step(dummy)[2]}

    let outputNet0 = this.Net0.compute(this.stateN0);
    let outputPID = this.customData.compileController(this.statePID); // this.Pid.compute(this.statePID)
    let outputPlayer = [this.lClick, this.rClick]

    let nextStates = this.step([outputNet0, outputPID, outputPlayer])
    let nextStateN0 = nextStates[0]
    let nextStatePID = nextStates[1]
    let nextStatePl = nextStates[2]

    this.render(this.EnvA, time, this.skin0, this.chp0);
    this.render(this.EnvC, time, this.skin1, this.chp1);
    this.render(this.EnvP, time, this.skin2, this.chp2);
    
    this.stateN0 = nextStateN0;
    this.statePID = nextStatePID;
    this.statePl = nextStatePl;

    console.log(this.EnvP.a);
    
    this.frameId = requestAnimationFrame(t => this.draw(t));
  }

  step(thrusts: any) {
    this.EnvA.spawnCheckpoints(); // spawns if found hit, otherwise not
    this.EnvC.spawnCheckpoints();
    this.EnvP.spawnCheckpoints();

    let stateN0 = this.EnvA.step(thrusts[0])
    let statePID = this.EnvC.step(thrusts[1])
    let statePl = this.EnvP.step(thrusts[2])

    return [stateN0, statePID, statePl];
  } 

  render(droneEnv: any, t: number, skin: HTMLImageElement, chp: HTMLImageElement) {
    let x = droneEnv.x;
    let y = droneEnv.y;
    let angle = droneEnv.a * Math.PI / 180;
    let chpX = droneEnv.chpX;
    let chpY = droneEnv.chpY;

    // Draw checkpoint offset from drone's world position
    const relChPX = this.canvasWidth / 2 + (chpX - this.EnvMain.x) * this.sRat; // relative to mainframe from EnvMain
    const relChPY = this.canvasHeight / 2 + (chpY - this.EnvMain.y) * this.sRat;
    let offset = 200*this.sRat / 2
    this.context.drawImage(chp, relChPX-offset, relChPY-offset, 200*this.sRat, 200*this.sRat)

    // Background:
    //this.context.drawImage(this.objects[Math.round(Math.random()*11)], relX+Math.round(Math.random()*11), relY+Math.round(Math.random()*11))
  
    const relX = this.canvasWidth / 2 + (x - this.EnvMain.x) * this.sRat; // again relative to mainframe (frame of reference)
    const relY = this.canvasHeight / 2 + (y - this.EnvMain.y) * this.sRat;

    this.context.translate(relX, relY);
    this.context.rotate(angle);
    this.context.drawImage(skin, -75*this.sRat, -37.5*this.sRat, 150*this.sRat, 75*this.sRat);
    this.context.resetTransform();
  }


  protected onClicked() {

  }

}





// note: static private prop of construcotr, then getter function for
// getting the class instance of itself in the constructor, to prevent multiple instance,
// only config for example
// -> done by service, in angular not writing manually