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
  width = 2000;
  height = 1500;

  get context(): CanvasRenderingContext2D { // virtual property 
    return this.canvas.nativeElement.getContext('2d') || new CanvasRenderingContext2D(); // to avoid '?'
  }
  skin: any;
  Pid: any;
  Net: any;
  Env: any;

  ngAfterViewInit() { // because constructor would attempt to draw before html starts to render
    this.Env = new Env(this.width, this.height, 10);
    this.Pid = new PID();
    this.Net = new Net();
    this.skin = new Image();
    this.skin.src = 'media/camera-drone.png';
    this.skin.onload = () => this.draw();

    const canvas = this.canvas.nativeElement as HTMLCanvasElement;
    const dpr = window.devicePixelRatio || 1
    const rect = canvas.getBoundingClientRect();

    canvas.width  = rect.width * dpr;
    canvas.height = rect.height * dpr;
    this.context.scale(dpr, dpr);


    
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
    
    let state = null;
    if (state == null) {state = this.step([0, 0])}

    let outputPID = this.Pid.compute(state)
    //let outputAI = Net(state);
    state = this.step(outputPID);

    this.render(this.Env);
    
    requestAnimationFrame(t => this.draw(t));
  }

  step(thrust: any) {
    // this.Env.update(this.x, ...)
    // const rightend = idk * 0.75 - 50

    this.Env.spawnCheckpoints(this.width / 2, this.height / 3);
    let state = this.Env.step(thrust)

    return state;
  }

  render(droneEnv: any) {
    let visualOffset = 100;
    let x = droneEnv.x + visualOffset;
    let y = droneEnv.y + visualOffset;
    let angle = droneEnv.a * Math.PI / 180;
    let chpX = droneEnv.chpX;
    let chpY = droneEnv.chpY;
  
    this.context.clearRect(0, 0, 10000, 10000); // -> make large enough for bigger screens, i.e., canvasas


    let cx = this.canvas.width / 2;
    let cy = this.canvas.height / 2;

    if (!this.skin.complete) return

    this.context.save();
    this.context.translate(x, y);
    this.context.rotate(angle);
    this.context.drawImage(this.skin, -100, 50, 100, 50);
    this.context.translate(0, 0);
    this.context.rotate(-angle);
    this.context.resetTransform()

    this.context.beginPath();
    this.context.arc(chpX, chpY, 50, 0, Math.PI * 2)
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