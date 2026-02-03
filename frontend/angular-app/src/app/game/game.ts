import { Component, inject, ViewChild } from '@angular/core'
import { Env } from '../logic/Env';
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
  width = 1400;
  height = 1000;

  get context(): CanvasRenderingContext2D { // virtual property 
    return this.canvas.nativeElement.getContext('2d') || new CanvasRenderingContext2D(); // to avoid '?'
  }

  // skin = new Image();
  env: any;

  ngAfterViewInit() { // because constructor would attempt to draw before html starts to render
    this.env = new Env(this.width, this.height, 10);

    const canvas = this.canvas.nativeElement as HTMLCanvasElement;
    const dpr = window.devicePixelRatio || 1
    const rect = canvas.getBoundingClientRect();

    canvas.width  = rect.width * dpr;
    canvas.height = rect.height * dpr;
    this.context.scale(dpr, dpr);

    //this.skin.src = 'media/camera-drone.png';
    //this.skin.onload = () => this.draw();
    
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

    let state = this.step();
    //let outputAI = Net(state);

    this.render(this.env);
    
    requestAnimationFrame(t => this.draw(t));
  }

  step() {
    // this.env.update(this.x, ...)
    // const rightend = idk * 0.75 - 50

    let state = this.env.step([0, 1])

    return state;
  }

  render(drone: any) {
    let x = drone.x;
    let y = drone.y;
    let angle = drone.a;
  
    this.context.clearRect(0, 0, 3000, 2000);
    this.context.fillStyle = 'white';
    this.context.fillRect(x, y, 100, 30);
    //if (!this.skin.complete) return;
    //this.context.drawImage(this.skin, this.x, 200, 40, 40);
  }


  protected onClicked() {
    this.text = "changed";
  }

}





// note: static private prop of construcotr, then getter function for
// getting the class instance of itself in the constructor, to prevent multiple instance,
// only config for example
// -> done by service, in angular not writing manually