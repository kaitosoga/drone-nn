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
  //gameEnv: Env;

  @ViewChild('canvas') canvas: any; // saved the canvas here

  //homeData = inject(Home); // then use, i.e., homeData.
  // can also edit instance config here!

  text: string = "a";

  get context(): CanvasRenderingContext2D { // virtual property 
    return this.canvas.nativeElement.getContext('2d') || new CanvasRenderingContext2D(); // to avoid '?'
  }
  skin: any;
  Pid: any;
  Net: any;
  Env: any;
  state: any;
  sRat: any; // screen size ratio to fixed number
  ratio: any;
  reTiInt: any // resizing time interval

  ngAfterViewInit() { // because constructor would attempt to draw before html starts to render
    this.state = null;

    this.sRat = 1 //Math.max(screen.width, screen.height) / 900;
    this.ratio = window.innerWidth / window.innerHeight;

    this.Pid = new PID();
    this.Net = new Net();
    this.skin = new Image();
    this.skin.src = 'media/camera-drone.png';
    this.skin.onload = () => this.draw();

    const canvas = this.canvas.nativeElement as HTMLCanvasElement;
    const dpr = window.devicePixelRatio || 1
    const rect = canvas.getBoundingClientRect();

    const sideLength = Math.max(rect.width, rect.height)
    canvas.width  = sideLength * dpr;
    canvas.height = sideLength * dpr;
    this.context.scale(dpr, dpr);

    this.Env = new Env(canvas.width * 4, canvas.height * 4);
    // canvas.style.width = canvas.width + "px";
    // canvas.style.height = canvas.height + "px";
    console.log(canvas.width, canvas.clientWidth)
    this.Env.reset(this.Env.width / 2, this.Env.height / 2)

    this.draw();
  }

  /*idk() {
    this.context.beginPath();
    this.context.moveTo(50, 50);
    this.context.lineTo(100, 120);
    this.context.strokeStyle = "white"; // to assign check presence
    this.context?.stroke();
  }*/

  lastTime = 0;

  draw(time = 0) {
    const dt = (time - this.lastTime) / 1000;
    this.lastTime = time;
    
    
    if (this.state == null) {this.state = this.step([0, 0])}

    let outputPID = this.Pid.compute(this.state)
    //let outputAI = Net(state);
    let nextState = this.step(outputPID);

    this.render(this.Env, time);

    this.state = nextState;
    
    requestAnimationFrame(t => this.draw(t));
  }

  step(thrust: any) {
    // this.Env.update(this.x, ...)
    // const rightend = idk * 0.75 - 50

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
  
    this.context.clearRect(0, 0, 10000, 10000); // -> make large enough for bigger screens, i.e., canvases

    if (!this.skin.complete) return

    const canvas = this.canvas.nativeElement as HTMLCanvasElement;
    const dpr = window.devicePixelRatio || 1
    const rect = canvas.getBoundingClientRect();

    const sL = Math.max(rect.width, rect.height)
    canvas.width  = sL * dpr;
    canvas.height = sL * dpr;

    //console.log(this.sRat, window.devicePixelRatio, "fuck")
    

    //let dSize = Math.abs((this.lastDpr - window.devicePixelRatio))

    let currentRatio = window.innerWidth / window.innerHeight
    let dSize = Math.abs(currentRatio-this.ratio)

    if (dSize > 0.1) { // improvised approximation
      let vw = Math.max(document.documentElement.clientWidth || 0, window.innerWidth || 0) / window.devicePixelRatio;
      let vh = Math.max(document.documentElement.clientHeight || 0, window.innerHeight || 0) / window.devicePixelRatio;
      this.sRat = Math.min(vw, vh) / 900;
      console.log("resized")
    } else {
      console.log("zoomed")
      //this.sRat = 1;
    }

    let resize = false;
    if (t - this.reTiInt > 16*5) {
      this.reTiInt = t;
      resize = true;
    }

    console.log(this.sRat)

    if (resize) {this.ratio = window.innerWidth / window.innerHeight}
    
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


  protected onClicked() {
    this.text = "changed";
  }

}





// note: static private prop of construcotr, then getter function for
// getting the class instance of itself in the constructor, to prevent multiple instance,
// only config for example
// -> done by service, in angular not writing manually