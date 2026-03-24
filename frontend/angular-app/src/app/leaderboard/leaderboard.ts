import { Component, inject } from '@angular/core';
import { ApiService } from '../auth.service';
import { Game } from '../game/game';
import { Router } from '@angular/router';
import { GameService } from '../game/game.service';
import { CommonModule } from '@angular/common';
import { ChangeDetectorRef } from '@angular/core';

@Component({
  selector: 'app-leaderboard',
  imports: [CommonModule],
  templateUrl: './leaderboard.html',
  styleUrl: './leaderboard.css',
})
export class Leaderboard {
  game = inject(Game);
  api = inject(ApiService);

  leaderboard: any;
  mode = "human";
  
  constructor(private router: Router, private gameService: GameService, private cdr: ChangeDetectorRef) {
    document.title = "AI Pilots - Leaderboard";
    this.loadLeaders('human'); // just from beginning
  }

  loadLeaders(mode: 'human' | 'custom') {
    this.mode = mode;
    this.api.getLeaderboard(mode).subscribe(list => {
      this.leaderboard = list;
      this.cdr.detectChanges(); // trigger when res arrived
    });
  }

  toggleMode() {
    this.loadLeaders(this.mode === 'human' ? 'custom' : 'human');
  }

  challengePlayer(userId: string) {
    this.api.getController(userId).subscribe(res => {
      console.log('Fetched custom: ' + res.name);
      console.log('code:', res.code);
      this.gameService.ownController = false;
      this.gameService.otherControllerData = res.code;
      this.router.navigate(['/game']);
    });
  }
}
