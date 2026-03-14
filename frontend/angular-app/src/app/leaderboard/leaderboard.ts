import { Component, inject } from '@angular/core';
import { ApiService } from '../auth.service';
import { Game } from '../game/game';
import { Router } from '@angular/router';
import { GameService } from '../game/game.service';

@Component({
  selector: 'app-leaderboard',
  imports: [],
  templateUrl: './leaderboard.html',
  styleUrl: './leaderboard.css',
})
export class Leaderboard {
  game = inject(Game);
  api = inject(ApiService)

  leaderboard: any;
  
  constructor(private router: Router, private gameService: GameService) {
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
      this.gameService.ownController = false; 
      this.gameService.ownControllerData = res.code;
      this.router.navigate(['/game']);
    });
  }
}
