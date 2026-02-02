import { Component, ViewChild } from '@angular/core'
import { Env } from '../logic/Env';

@Component({
  selector: 'app-game',
  imports: [],
  templateUrl: './game.html',
  styleUrl: './game.css',
})

export class Game {
  //gameEnv: Env;

  @ViewChild('canvas') canvas: any; // saved the canvas here

  get context(): CanvasRenderingContext2D { // virtual property 
    return this.canvas.nativeElement.getContext('2d') || new CanvasRenderingContext2D(); // to avoid '?'
  }

  skin = new Image();

  ngAfterViewInit() { // because constructor would attempt to draw before html starts to render
    const env = new Env();

    const canvas = this.canvas.nativeElement as HTMLCanvasElement;
    const dpr = window.devicePixelRatio || 1
    const rect = canvas.getBoundingClientRect();

    canvas.width  = rect.width * dpr;
    canvas.height = rect.height * dpr;
    this.context.scale(dpr, dpr);

    this.skin.src = 'media/camera-drone.png';
    this.skin.onload = () => this.draw();
    
    this.draw();
  }

  idk() {
    this.context.beginPath();
    this.context.moveTo(50, 50);
    this.context.lineTo(100, 120);
    this.context.strokeStyle = "white"; // to assign check presence
    this.context?.stroke();
  }

  x = 50;
  vx = 300;
  lastTime = 0;

  draw(time = 0) {
    const dt = (time - this.lastTime) / 1000;
    this.lastTime = time;

    this.step(dt);
    requestAnimationFrame(t => this.draw(t));
  }

  step(dt: number) {
    this.x += this.vx * dt;
    // this.env.update(this.x, ...)

    const rightend = window.outerWidth * 0.75 - 50
    if (this.x > rightend || this.x < 50) this.vx *= -1;

    this.context.clearRect(0, 0, 800, 500);
    this.context.fillStyle = 'white';
    this.context.fillRect(this.x, 200, 40, 40);
    if (!this.skin.complete) return;
    this.context.drawImage(this.skin, this.x, 200, 40, 40);


  }






}

