import { Component, inject, Injectable } from '@angular/core';
import {CdkDrag, CdkDragDrop, CdkDropList, moveItemInArray} from '@angular/cdk/drag-drop';
import { CommonModule } from '@angular/common';
import { throwDeprecation } from 'process';
import { stat } from 'fs';
import { ApiService } from '../auth.service';
import { ChangeDetectorRef } from '@angular/core'; // when subscribing for res, html doesn't update on response
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-custom',
  imports: [CdkDropList, CdkDrag, CommonModule, RouterLink], // angular imports for drag and drop
  templateUrl: './custom.html',
  styleUrl: './custom.css',
})

@Injectable({ providedIn: 'root' })
export class Custom {

  static initialized = false;
  api = inject(ApiService);
  id = localStorage.getItem('user_id') || null;
  userId = this.id ? this.id : "";

  static charsL: string[] = [];
  static charsR: string[] = [];
  static availableChars: string[] = [];

  n = 0;

  stringCharsL = Custom.charsL;
  stringCharsR = Custom.charsR;
  availableChars = Custom.availableChars;

  error = "";

  sampleState = { // to test function validity / errors
    "opt": [1, 1],
    "vel": [1, 1],
    "acc": [1, 1],
    "ang": 1,
    "ang_vel": 1,
    // "reached": reached
}

  constructor(private cdr: ChangeDetectorRef) {
    document.title = "AI Pilots - Custom";
    if (!Custom.initialized) {
      const savedL = localStorage.getItem('charsL');
      const savedR = localStorage.getItem('charsR');

      Custom.charsL = (savedL || '0.5').split(',');
      Custom.charsR = (savedR || '0.5').split(',');
      this.onLocalSave();
      Custom.availableChars = ['0', '+', '-', '*', '/', '^', '(', ')', 'sigmoid(', 'tanh(', 'max(', ',', 'optX', 'optY', 'velX', 'velY', 'accX', 'accY', 'Angle', 'velAngle'];
      Custom.initialized = true;
      this.availableChars = Custom.availableChars
      this.stringCharsL = Custom.charsL;
      this.stringCharsR = Custom.charsR;
    }
  }

  onLocalSave() {
    localStorage.setItem('charsL', Custom.charsL.join(',')); // join because cna only be string I think
    localStorage.setItem('charsR', Custom.charsR.join(','));
  }
 
  onLocalGet() {

    const gotL = localStorage.getItem('charsL')
    const gotR = localStorage.getItem('charsR')
    Custom.charsL = (gotL || '').split(',');
    Custom.charsR = (gotR || '').split(',');
    this.add('', 'L'); // to trigger update
    this.add('', 'R');
    this.remove(Custom.charsL.length-1, "L")
    this.remove(Custom.charsR.length-1, "R")
    this.onLocalSave();
  }

  editN(event: Event) {
    const value = (event.target as HTMLInputElement).value;
    this.n = Number(value);
    Custom.availableChars[0] = this.n.toString();
    this.availableChars = Custom.availableChars;
  }

  add(char: string, side: 'L' | 'R') {
    if (side === 'L') {
      Custom.charsL.push(char);
      this.stringCharsL = Custom.charsL;
    }
    else {
      Custom.charsR.push(char);
      this.stringCharsR = Custom.charsR
    };
    this.onLocalSave();
  }

  log() {
    console.log(Custom.availableChars)
  }

  remove(ind: number, side: 'L' | 'R') {
    console.log("remov")
    if (side === 'L') {
      Custom.charsL.splice(ind, 1);
      this.stringCharsL = Custom.charsL;
    } else {
      Custom.charsR.splice(ind, 1);
      this.stringCharsR = Custom.charsR;
    }
    this.onLocalSave();
  }

  drop(event: CdkDragDrop<string[]>, side: 'L' | 'R') {
    moveItemInArray(side === 'L' ? Custom.charsL : Custom.charsR, event.previousIndex, event.currentIndex); // note:from doc angular doc
    this.stringCharsL = Custom.charsL;
    this.stringCharsR = Custom.charsR;
    this.onLocalSave();
  }

  compileController(stateFull: any, chars=[Custom.charsL, Custom.charsR]){

    const state: Record<string, any> = { // weird js or ts types to make index work later
        'optX': stateFull['opt'][0],
        'optY': stateFull['opt'][1],
        'velX': stateFull['vel'][0],
        'velY': stateFull['vel'][1],
        'accX': stateFull['acc'][0],
        'accY': stateFull['acc'][1],
        'Angle': stateFull['ang'],
        'velAngle': stateFull['ang_vel']
    }

    const variables = ['optX', 'optY', 'velX', 'velY', 'accX', 'accY', 'Angle', 'velAngle'];
    let left;
    let right;

    // left thrust equation
    try {
      const equationL = chars[0].map((el: string) => {
        if (variables.includes(el)) return state[el];
        if (el === '^') return '**';
        if (el === 'tanh(') return 'Math.tanh('; // sigmoid is not a Math function, but tanh works in new Function
        if (el === 'max(') return 'Math.max(';
        return el;
      }).join(' '); // without commas like an equation

      const sigmoid = (x: number) => 1 / (1 + Math.exp(-x)); // allows sigmiod to go into function as param
      const resultL = new Function('sigmoid', `return ${equationL}`)(sigmoid); // to convert strings into actual function

      if (!isFinite(resultL)) throw new Error('not finite, would crash') // to prevent crashing
      //console.log(resultL)
      left = resultL; // take out of scope of try 
      this.error = "";

    } catch {
      this.error = 'invalid operation created, please fix';
    }

    // right thrust equation
    try {
      const equationR = chars[1].map((el: string) => {
        if (variables.includes(el)) return state[el];
        if (el === '^') return '**';
        if (el === 'tanh(') return 'Math.tanh(';
        if (el === 'max(') return 'Math.max(';
        return el;
      }).join(' ');

      const sigmoid = (x: number) => 1 / (1 + Math.exp(-x));
      const resultR = new Function('sigmoid', `return ${equationR}`)(sigmoid);

      // save to json file to load later, after reload!

      if (!isFinite(resultR)) throw new Error('not finite, would crash')
      //console.log(resultR)
      right = resultR;

    } catch {
      this.error = 'invalid operation created, please fix';
      return 0;
    }
    
    return [left, right]

  }

  onSave() {
      if (localStorage.getItem('user_id') === null) {alert("NOT LOGGED IN, NOTHING WILL SAVE")}

      this.api.submitController([this.stringCharsL, this.stringCharsR]).subscribe(res => {
      console.log(res);
    })
  }

  onLoad() {
    if (localStorage.getItem('user_id') === null) {alert("NOT LOGGED IN, NOTHING TO GET")}

    this.api.getSavedController(this.userId).subscribe(res => {
      console.log("currently saved: ", res.code, res.name)
      Custom.charsL.length = 0; // found out that i have to clear it instead of replacing it, so that address remains same and ng drag&drop can autoupdate
      Custom.charsR.length = 0;

      // I learnt that I need to spread array because it is pushed to existing one
      Custom.charsL.push(...res.code[0]);
      Custom.charsR.push(...res.code[1]);
      console.log(Custom.charsL)
    
      this.stringCharsL = [...Custom.charsL];
      this.stringCharsR = [...Custom.charsR];
      this.onLocalSave();
      
      this.cdr.detectChanges();
    })
  }


}
