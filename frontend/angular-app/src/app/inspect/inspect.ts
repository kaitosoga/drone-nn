import { Component, inject } from '@angular/core';
import { Net } from '../logic/Net';
import { Game } from '../game/game';
import { CommonModule } from '@angular/common'; // ngif stuff in html
import { FormsModule } from '@angular/forms'; // forms in html

@Component({
  selector: 'app-inspect',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './inspect.html',
  styleUrl: './inspect.css',
})
export class Inspect {
  net = new Net();
  game = inject(Game);

  manualState = {
    opt: [0, 0],
    vel: [0, 0],
    acc: [0, 0],
    ang: 0,
    ang_vel: 0
  };

  activations: any;

  constructor() {
    document.title = "AI Pilots - Inspect";
  }

  getData() {
    const state = this.game.aiSelected ? this.game.stateN0 : this.manualState;
    if (!state) return;

    this.activations = this.net.compute(state, true); // true for getting each layer activations
  }

  ngOnInit() {
    this.getData();
    setInterval(() => this.getData(), 50); //update every 50ms for ai changes
  }

  onStateChange() { //listener for manual changes
    this.getData();
  }
}
