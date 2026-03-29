import { Component, Input } from '@angular/core';
import { Net } from '../logic/Net';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ChangeDetectorRef } from '@angular/core';

@Component({
  selector: 'app-inspect',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './inspect.html',
  styleUrl: './inspect.css',
})
export class Inspect {
  @Input() aiSelected: boolean = false;
  @Input() stateN0: any = null;
  
  manualState = { // input state for AI as fallback
    opt: [0, 0],
    vel: [0, 0],
    acc: [0, 0],
    ang: 0,
    ang_vel: 0
  };

  net = new Net();

  activations: any;
  input: any;

  constructor(private cdr: ChangeDetectorRef) {
    document.title = "AI Pilots - Inspect";
  }

  getData() {
    let state = this.aiSelected ? this.stateN0 : this.manualState;
    if (!state) return;
    //console.log(state)
    this.activations = this.net.compute(state, true); // true for getting each layer activations
    this.activations[this.activations.length-1][0] = Math.tanh((this.activations[this.activations.length-1][0]-0.5)*10); // only to strenthen visual effect, not quantitatively correct, but qualitativ, not linear
    this.activations[this.activations.length-1][1] = Math.tanh((this.activations[this.activations.length-1][1]-0.5)*10);
    this.input = [
            ...state.opt,
            ...state.vel,
            ...state.acc,
            state.ang,
            state.ang_vel,
        ];
    this.cdr.detectChanges();
  }

  fl() {}

  ngOnInit() {
    this.getData();
    setInterval(() => this.getData(), 50); //update every 50ms for ai changes
  }

  onStateChange() { //listener for manual changes
    this.getData();
  }

  neuronColor(v: number): string {
    const c = ((v)/2+0.5)*255; //Math.round(Math.max(0, Math.min(1, v)) * 255);
    return `rgb(${c*.1},${c*.45},${c*.9})`;
  }
}
