import { Component } from '@angular/core';

@Component({
  selector: 'app-inspect',
  imports: [],
  templateUrl: './inspect.html',
  styleUrl: './inspect.css',
})
export class Inspect {
  constructor() {
    document.title = "AI Pilots - Inspect";
  }
}
