import { Component } from '@angular/core';

@Component({
  selector: 'app-root',
  template: `
    <h1>Hello Angular</h1>
    <p>2 + 3 = {{ 2 + 3 }}</p>
    <button (click)="increment()">Clicked {{ count }} times</button>
  `
})
export class AppComponent {
  count = 0;

  increment() {
    this.count++;
  }
}
