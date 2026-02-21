import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Info } from "../info/info";
import { Game } from "../game/game";
import { AuthService } from '../auth.service';

@Component({
  selector: 'app-home',
  imports: [CommonModule, Info, Game],
  templateUrl: './home.html',
  styleUrl: './home.css',
})

export class Home {
  data: any[] = [] // indicate type (number, string, ...)
  user: {name: string, id: number, level: number, passwd: string}[] = []
  userName: string = "undefined";
  leaderboard: any[] = [];

  constructor(private auth: AuthService) {
    console.log("entered home");

    this.data = [
      {
        ind: 5,
        idk: "somedata"
      }
    ]

    this.user = [
      {
        name: "kaito",
        id: 238423,
        level: 7,
        passwd: "idk"
      }
    ]

    this.userName = this.user[0].name

    setInterval(() => {
      console.log("still in home")
    },
    5000)
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

  send70() {
    this.auth.submitScore(80).subscribe({
      next: (res) => {
        console.log('Score updated! New top score:', res.top_score);
        // Refresh the leaderboard to see your new score
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




