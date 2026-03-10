import { Component, inject } from '@angular/core';
import { ApiService } from '../auth.service';

@Component({
  selector: 'app-leaderboard',
  imports: [],
  templateUrl: './leaderboard.html',
  styleUrl: './leaderboard.css',
})
export class Leaderboard {
  api = inject(ApiService)
  leaderboard: any;
  constructor() {
    document.title = "AI Pilots - Leaderboard";
  }



    loadLeaders(mode: 'human' | 'custom') {
    this.api.getLeaderboard(mode).subscribe(list => {
      this.leaderboard = list;
    });
  }

  challengePlayer(userId: string) {
    this.api.getController(userId).subscribe(res => {
      console.log('Fetched custom: ' + res.name);
      console.log('code:', res.code);
    });
  }
}
