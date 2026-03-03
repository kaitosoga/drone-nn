import { Component } from '@angular/core';

@Component({
  selector: 'app-leaderboard',
  imports: [],
  templateUrl: './leaderboard.html',
  styleUrl: './leaderboard.css',
})
export class Leaderboard {
  constructor() {
    document.title = "AI Pilots - Leaderboard";
  }
}
