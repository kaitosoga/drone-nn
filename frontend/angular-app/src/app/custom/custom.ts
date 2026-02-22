import { Component } from '@angular/core';
import {CdkDrag, CdkDragDrop, CdkDropList, moveItemInArray} from '@angular/cdk/drag-drop';

@Component({
  selector: 'app-custom',
  imports: [CdkDropList, CdkDrag],
  templateUrl: './custom.html',
  styleUrl: './custom.css',
})

export class Custom {

  static initialized = false;

  static charsL: string[] = [];
  static charsR: string[] = [];
  static availableChars: string[] = [];

  n = 0;

  stringCharsL = Custom.charsL;
  stringCharsR = Custom.charsR;
  availableChars = Custom.availableChars;

  constructor() {
    if (!Custom.initialized) {
      Custom.charsL = ['X','-','K','*','10','+','Y','^','4'];
      Custom.charsR = ['X','-','K','*','10','+','Y','^','4'];
      Custom.availableChars = ['0', '+', '-', '*', '/', '^'];
      Custom.initialized = true;
      this.availableChars = Custom.availableChars
      this.stringCharsL = Custom.charsL;
      this.stringCharsR = Custom.charsR;
    }
  }

  editN(event: Event) {
    const value = (event.target as HTMLInputElement).value;
    this.n = Number(value);
    Custom.availableChars[0] = this.n.toString();
    this.availableChars = Custom.availableChars
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
  }

  drop(event: CdkDragDrop<string[]>, side: 'L' | 'R') {
    moveItemInArray(side === 'L' ? Custom.charsL : Custom.charsR, event.previousIndex, event.currentIndex);
  }
}
