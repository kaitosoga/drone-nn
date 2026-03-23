import { Component, inject } from '@angular/core';
import { ApiService } from '../auth.service';
import { Game } from '../game/game';
import { Router } from '@angular/router';
import { GameService } from '../game/game.service';
import { NgIf } from "../../../node_modules/@angular/common/types/_common_module-chunk";
import { ChangeDetectorRef } from '@angular/core'; // when subscribing for res, html doesn't update on response

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
  mode = "";
  
  constructor(private router: Router, private gameService: GameService, private cdr: ChangeDetectorRef) {
    document.title = "AI Pilots - Leaderboard";
  }

  loadLeaders(mode: 'human' | 'custom') {
    this.mode = mode;
    this.api.getLeaderboard(mode).subscribe(list => {
      this.leaderboard = list;
      this.cdr.detectChanges(); // trigger when res arrived
    });
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
