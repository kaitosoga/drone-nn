import { Component } from '@angular/core';
import { GameService } from '../game/game.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-skins',
  imports: [CommonModule],
  templateUrl: './skins.html',
  styleUrl: './skins.css',
})
export class Skins {
  constructor(public gameService: GameService) {
    document.title = "AI Pilots - Skins";
  }

  skin() {return this.gameService.skinPath};

  setSkin(path: string) {
    this.gameService.skinPath = path;
  }
}
