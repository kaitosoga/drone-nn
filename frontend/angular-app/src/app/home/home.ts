import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Info } from "../info/info";
import { Game } from "../game/game";
import { AuthService } from '../auth.service';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-home',
  imports: [CommonModule, Info, Game, RouterLink],
  templateUrl: './home.html',
  styleUrl: './home.css',
})

export class Home {
  data: any[] = [] // indicate type (number, string, ...)
  user: {name: string, id: number, level: number, passwd: string}[] = []
  userName: string = "undefined";
  leaderboard: any[] = [];

  constructor(private auth: AuthService) {
    this.user = [ // this.userName = this.user[0].name
      {
        name: "kaito",
        id: 238423,
        level: 7,
        passwd: "idk"
      }
    ]
  }

  getLedInd() {
    this.auth.leaderboard().subscribe(data => {
      console.log('leaderboard:', data);
      this.leaderboard = data;
    });
  }

  testLogin() {
    this.auth.login('testuser', 'test123').subscribe({
      next: res => {
        this.auth.saveSession(res.token, res.name, res.user_id);
        console.log('logged in as', res.name);
      },
      error: e => console.error(e)
    });
  }

  sendTopscore(ts: number) {
    this.auth.submitScore(ts).subscribe({
      next: (res) => {
        console.log('Score updated! New top score:', res.top_score);
        this.getLedInd(); 
      },
      error: (e) => {
        if (e.status === 401) {
          console.error('Not logged in or token expired');
        } else {
          console.error('Error sending score:', e);
        }
      }
    });
  }
}




