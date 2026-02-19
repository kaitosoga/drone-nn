import { Component, inject, ViewChild } from '@angular/core'

import { Env } from '../logic/Env';
import { Net } from '../logic/Net';
import { PID } from '../logic/PID';
import { Inject } from '@angular/core';
import { Home } from '../home/home';
import { stringify } from 'querystring';

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

  private isCtrlHeld = false;
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

  skin: any;

  astronaut: any
  cometthin: any
  cometthick: any
  debris: any
  earth: any
  moon: any
  moon1: any
  ppstardust: any
  redgalaxy: any
  robot: any
  saturn: any
  telescope: any

  Pid: any;
  Net0: any;
  Env: any;
  state: any;
  sRat: any; // screen size ratio to fixed number
  ratio: any;
  reTiInt: any // resizing time interval

  ngAfterViewInit() { // because constructor would attempt to draw before html starts to render
    this.state = null;

    this.Pid = new PID();

    this.Net0 = new Net();
    this.Net0.load('models/drone_AI_weights.json')

    this.skin = new Image();
    this.skin.src = 'media/camera-drone.png';
    this.skin.onload = () => this.draw();

    this.skin.src = 'media/camera-drone.png';
    this.skin.onload = () => this.draw();

  this.astronaut = new Image();
  this.astronaut.src = 'media/';
  this.astronaut.onload = () => this.draw();
  this.cometthin = new Image();
  this.cometthin.src = 'media/';
  this.cometthin.onload = () => this.draw();
  this.cometthick = new Image();
  this.cometthick.src = 'media/';
  this.cometthick.onload = () => this.draw();
  this.debris = new Image();
  this.debris.src = 'media/';
  this.debris.onload = () => this.draw();
  this.earth = new Image();
  this.earth.src = 'media/';
  this.earth.onload = () => this.draw();
  this.moon = new Image();
  this.moon.src = 'media/';
  this.moon.onload = () => this.draw();
  this.moon1 = new Image();
  this.moon1.src = 'media/';
  this.moon1.onload = () => this.draw();
  this.ppstardust = new Image();
  this.ppstardust.src = 'media/';
  this.ppstardust.onload = () => this.draw();
  this.redgalaxy = new Image();
  this.redgalaxy.src = 'media/';
  this.redgalaxy.onload = () => this.draw();
  this.robot = new Image();
  this.robot.src = 'media/';
  this.robot.onload = () => this.draw();
  this.saturn = new Image();
  this.saturn.src = 'media/';
  this.saturn.onload = () => this.draw();
  this.telescope = new Image();
  this.telescope.src = 'media/';
  this.telescope.onload = () => this.draw();

    for (let obj of [this.astronaut, this.cometthin, this.cometthick, this.debris, 
                 this.earth, this.moon, this.moon1, this.ppstardust, 
                 this.redgalaxy, this.robot, this.saturn, this.telescope]) {
      
      obj = new Image();
      obj.src = 'media/`media/${toString(obj)}`'
      obj.onload = () => this.draw();
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

    this.Env = new Env(canvas.width * 4, canvas.height * 4);
    this.Env.reset(this.Env.width / 2, this.Env.height / 2)

    this.draw();
  }

  sideRatio() {
    return Math.max((window.innerWidth / window.innerHeight), 
                    (window.innerHeight / window.innerWidth))
  }

  lastTime = 0;
  draw(time = 0) {
    const dt = (time - this.lastTime) / 1000;
    this.lastTime = time;
    
    if (this.state == null) {this.state = this.step([0, 0])}

    let outputPID = this.Pid.compute(this.state)
    
    let outputNet0 = this.Net0.compute(this.state);
    
    let nextState = this.step(outputNet0);
    this.render(this.Env, time);
    this.state = nextState;
    
    requestAnimationFrame(t => this.draw(t));
  }

  step(thrust: any) {
    this.Env.spawnCheckpoints(); // spawns if found hit, otherwise not
    let state = this.Env.step(thrust)

    return state;
  } 

  render(droneEnv: any, t: number) {
    let visualOffsetX = 0;
    let visualOffsetY = 0;
    let x = droneEnv.x + visualOffsetX;
    let y = droneEnv.y - visualOffsetY;
    let angle = droneEnv.a * Math.PI / 180;
    let chpX = droneEnv.chpX;
    let chpY = droneEnv.chpY;
  
    this.context.clearRect(0, 0, 10000, 10000); // -> make large enough for bigger screens, i.e., bigger canvases

    if (!this.skin.complete) return

    //console.log(this.sRat, window.devicePixelRatio)
    //let dSize = Math.abs((this.lastDpr - window.devicePixelRatio))
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
    

    const canvas = this.canvas.nativeElement as HTMLCanvasElement;
    const dpr = window.devicePixelRatio || 1
    const rect = canvas.getBoundingClientRect();

    const sL = Math.max(rect.width, rect.height)
    canvas.width  = sL * dpr;
    canvas.height = sL * dpr;

    this.context.save();
    this.context.translate(canvas.width / 2, canvas.height / 2);
    this.context.rotate(angle);
    this.context.drawImage(this.skin, -75*this.sRat, -37.5*this.sRat, 150*this.sRat, 75*this.sRat);
    this.context.translate(0, 0);
    this.context.rotate(-angle);  
    this.context.resetTransform();

    // Draw checkpoint offset from drone's world position
    const relX = canvas.width / 2 + (chpX - x) * this.sRat;
    const relY = canvas.height / 2 + (chpY - y) * this.sRat;
    this.context.beginPath();
    this.context.arc(relX, relY, 40*this.sRat, 0, Math.PI * 2);
    this.context.strokeStyle = "green";
    this.context.stroke();
  }

  protected leftThrust() {

  }

  protected rightThrust() {

  }


  protected onClicked() {
    this.text = "changed";
  }

}





// note: static private prop of construcotr, then getter function for
// getting the class instance of itself in the constructor, to prevent multiple instance,
// only config for example
// -> done by service, in angular not writing manually