import { Component, inject, ViewChild } from '@angular/core'
import { HostListener } from '@angular/core';

import { Env } from '../logic/Env';
import { Net } from '../logic/Net';
import { PID } from '../logic/PID';
import { Inject } from '@angular/core';
import { Home } from '../home/home';
import { stringify } from 'querystring';
import { stat } from 'fs';

@Component({
  selector: 'app-game',
  imports: [],
  templateUrl: './game.html',
  styleUrl: './game.css',
})





export class Game {
  @ViewChild('canvas') canvas: any; // saved the canvas here

  //homeData = inject(Home); // then use, i.e., homeData.
  // can also edit instance config here!

  text: string = "a";

  private isCtrlHeld = false; // for canvas resizing on scroll/zoom
  private lastHeld = false;
  private lClick = false;
  private rClick = false;

  constructor() {
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

  get context(): CanvasRenderingContext2D { // virtual property 
    return this.canvas.nativeElement.getContext('2d') || new CanvasRenderingContext2D(); // to avoid '?'
  }

  stateN0 = null;
  statePID = null;
  statePl = null;
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

  Pid = new PID();
  Net0 = new Net();

  EnvP: any; // player
  EnvA: any; // AI
  EnvC: any; // Custom Controller (PID)
  EnvMain: any;

  private canvasWidth = 0;
  private canvasHeight = 0;

  ngAfterViewInit() { // because constructor would attempt to draw before html starts to render
    this.skin0.src = 'media/camera-drone.png';
    this.skin0.onload = () => {} //this.draw();

    this.skin1.src = 'media/camera-drone1.png';
    this.skin1.onload = () => {} //this.draw();

    this.skin2.src = 'media/camera-drone2.png';
    this.skin2.onload = () => {} //this.draw();

    this.chp0.src = 'media/chp.png';
    this.chp0.onload = () => {} // this.draw();

    this.chp1.src = 'media/chp1.png';
    this.chp1.onload = () => {} // this.draw();

    this.chp2.src = 'media/chp2.png';
    this.chp2.onload = () => {} // this.draw();

    this.objects = [];
    
    for (let name of ['astronaut', 'cometthin', 'cometthick', 'debris', 
                    'earth', 'moon', 'moon1', 'ppstardust', 
                    'redgalaxy', 'robot', 'saturn', 'telescope']) {
      
      //let obj = new Image();
      //obj.src = `media/${name}.png`;
      //obj.onload = () => this.draw();
      //
      //this.objects.push(obj)

      //inefficient ... ?

    }

    let vw = Math.max(document.documentElement.clientWidth || 0, window.innerWidth || 0) / window.devicePixelRatio;
    let vh = Math.max(document.documentElement.clientHeight || 0, window.innerHeight || 0) / window.devicePixelRatio;
    this.sRat = Math.min(vw, vh) / 900;
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

    this.EnvA = new Env(canvas.width * 4, canvas.height * 4);
    this.EnvA.reset(this.EnvA.width / 2, this.EnvA.height / 2)
    this.EnvP = new Env(canvas.width * 4, canvas.height * 4);
    this.EnvP.reset(this.EnvP.width / 2, this.EnvP.height / 2)
    this.EnvC = new Env(canvas.width * 4, canvas.height * 4);
    this.EnvC.reset(this.EnvC.width / 2, this.EnvC.height / 2)

    this.EnvMain = this.EnvP;

  }


  // functions
  startGame() {
    this.draw();
    console.log("start game function")
  }

  protected leftThrust() {

  }

  protected rightThrust() {

  }

  selectL(mode: string) {
    this.level = mode;
    this.loadNet0();
  }

  selectS(mode: string) {

  }

  loadNet0() {
    this.Net0.load(`models/drone_AI_weights-${this.level}.json`)
  }


  // computing

  sideRatio() {
    return Math.max((window.innerWidth / window.innerHeight), 
                    (window.innerHeight / window.innerWidth))
  }

  lastTime = 0;
  draw(time = 0) {
    const dt = (time - this.lastTime) / 1000;
    this.lastTime = time;

    const canvas = this.canvas.nativeElement as HTMLCanvasElement;
    this.context.clearRect(0, 0, this.canvasWidth, this.canvasHeight);
    let dummy = [[0, 0], [0, 0], [0, 0]]
    if (this.stateN0 == null) {this.stateN0 = this.step(dummy)[0]}
    if (this.statePID == null) {this.statePID = this.step(dummy)[1]}
    if (this.statePl == null) {this.statePl = this.step(dummy)[2]}

    let outputNet0 = this.Net0.compute(this.stateN0);
    let outputPID = this.Pid.compute(this.statePID)
    let outputPlayer = [this.lClick, this.rClick]
    let nextStates = this.step([outputNet0, outputPID, outputPlayer])
    let nextStateN0 = nextStates[0] // this.step(outputNet0)[0];
    let nextStatePID = nextStates[1] // this.step(outputPID)[1];
    let nextStatePl = nextStates[2] // this.step(outputPlayer)[2];

    //this.EnvMain = this.EnvP
    this.render(this.EnvC, time, this.skin1, this.chp1, false); // is main reference frame for render
    this.render(this.EnvP, time, this.skin2, this.chp2, true); // is not
    this.render(this.EnvA, time, this.skin0, this.chp0, false); // only one true, otherwise weird outputs
    this.stateN0 = nextStateN0;
    this.statePID = nextStatePID;
    this.statePl = nextStatePl;
    
    requestAnimationFrame(t => this.draw(t));
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


  render(droneEnv: any, t: number, skin: HTMLImageElement, chp: HTMLImageElement, main: boolean) {
    let visualOffsetX = 0;
    let visualOffsetY = 0;
    let x = droneEnv.x + visualOffsetX;
    let y = droneEnv.y - visualOffsetY;
    let angle = droneEnv.a * Math.PI / 180;
    let chpX = droneEnv.chpX;
    let chpY = droneEnv.chpY;
  
    // this.context.clearRect(0, 0, 10000, 10000); // -> make large enough for bigger screens, i.e., bigger canvases

    //if (!this.skin0.complete) return
    //if (!this.skin1.complete) return
    //if (!this.skin2.complete) return

    //console.log(this.sRat, window.devicePixelRatio)
    //let dSize = Math.abs((this.lastDpr - window.devicePixelRatio))
    
    /*
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

    let resize = false;
    if (t - this.reTiInt > 16*5) {
      this.reTiInt = t;
      resize = true;
    }

    let ratio = this.sideRatio();
    if (resize) {this.ratio = ratio}
    */ //efficiency prolems here?

    //const canvas = this.canvas.nativeElement as HTMLCanvasElement;
    //const dpr = window.devicePixelRatio || 1
    //const rect = canvas.getBoundingClientRect();

    //const sL = Math.max(rect.width, rect.height)
    //canvas.width = sL * dpr;
    //canvas.height = sL * dpr;

    // Draw checkpoint offset from drone's world position
    const relChPX = this.canvasWidth / 2 + (chpX - this.EnvMain.x) * this.sRat;
    const relChPY = this.canvasHeight / 2 + (chpY - this.EnvMain.y) * this.sRat;
    let offset = 200*this.sRat / 2
    this.context.drawImage(chp, relChPX-offset, relChPY-offset, 200*this.sRat, 200*this.sRat)
    /*this.context.beginPath();
    this.context.arc(relX, relY, 40*this.sRat, 0, Math.PI * 2);
    this.context.strokeStyle = "green";
    this.context.stroke();*/

    // Backdound:
    //this.context.drawImage(this.objects[Math.round(Math.random()*11)], relX+Math.round(Math.random()*11), relY+Math.round(Math.random()*11))
  
    const relX = this.canvasWidth / 2 + (x - this.EnvMain.x) * this.sRat;
    const relY = this.canvasHeight / 2 + (y - this.EnvMain.y) * this.sRat;

    //this.context.save();
    this.context.translate(relX, relY);
    this.context.rotate(angle);
    this.context.drawImage(skin, -75*this.sRat, -37.5*this.sRat, 150*this.sRat, 75*this.sRat);
    this.context.resetTransform();
    //this.context.restore();
    //this.context.translate(0, 0);
    //this.context.rotate(-angle);  
    //this.context.resetTransform();
  }


  protected onClicked() {
    this.text = "changed";
  }

}





// note: static private prop of construcotr, then getter function for
// getting the class instance of itself in the constructor, to prevent multiple instance,
// only config for example
// -> done by service, in angular not writing manually