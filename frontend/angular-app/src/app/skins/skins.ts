import {Component, inject} from '@angular/core';
import {Game} from '../game/game';
import { GameService } from '../game/game.service';

@Component({
  selector: 'app-skins',
  imports: [],
  templateUrl: './skins.html',
  styleUrl: './skins.css',
})
export class Skins {
  game = inject(Game);

  constructor(public gameService: GameService) {
    document.title = "AI Pilots - Skins";
  }

  setSkin(path: string) {
    this.gameService.skinPath = path;
  }
}
