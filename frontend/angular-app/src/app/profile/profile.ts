import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../auth.service';
import { GameService } from '../game/game.service';
import { ChangeDetectorRef } from '@angular/core';
@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './profile.html',
  styleUrl: './profile.css',
})


// Where needed: 
// Home: -
// done/ game: startmatch indication, submitScore on game end
// inspect: -
// done/ custom: submit to saved controllers, or load saved ones
// done/ leaderboard: load top 10, allow loading custom controllers and make them option in game.ts
// skin: just based on users score, or let user pick any skin? 
// done/ profile: login / register


export class Profile {
  api = inject(ApiService); // from service component
  
  username = '';
  password = '';
  displayName = '';
  displayNameLogged = '';
  testScore = 0;
  
  leaderboard: any[] = [];
  isPaused = false;
  pauseStartTime: number = 0;
  totalPausedTime: number = 0;

  userId = "";

  constructor(private gameService: GameService, private cdr: ChangeDetectorRef) {
    document.title = "AI Pilots - Profile";
  }

  // testing all functions of the backend, the api service + subscribe https://angular.dev/guide/http/making-requests

  onRegister() {
    this.gameService.ownController = true; 
    const newUser = {
      username: this.username,
      password: this.password,
      name: this.displayName,
    };
    this.api.register(newUser).subscribe({ // either new value next or error
      next: (res) => { // res is http response from backend
        localStorage.setItem('token', res.token);
        localStorage.setItem('user_id', res.user_id);
        this.userId = res.user_id;
        alert('Registered and Logged in as ' + res.name);
        this.displayNameLogged = res.name;
        this.cdr.detectChanges();
      },
      error: (err) => alert(err.error.error)
    });
  }

  onLogin() {
    this.gameService.ownController = true;
    const creds = {
      username: this.username,
      password: this.password
    };
    this.api.login(creds).subscribe({
      next: (res) => {
        localStorage.setItem('token', res.token); // should be new token I think
        localStorage.setItem('user_id', res.user_id);
        this.userId = res.user_id;
        alert('Logged in!');
        this.displayNameLogged = res.name;
        this.cdr.detectChanges();
      },
      error: (err) => alert(err.error.error)
    });
  }

  onLogout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user_id');
    alert('Logged out');
  }

  loggedIn() {
    return !!localStorage.getItem('user_id'); // I learnt that !! converts to boolean
  }


// just testing:  

  togglePause() {
    this.isPaused = !this.isPaused;
    if (this.isPaused) {
      this.pauseStartTime = Date.now();
      console.log("Paused...");
    } else {
      this.totalPausedTime += (Date.now() - this.pauseStartTime) / 1000;
      console.log("Resumed. Total paused time:", this.totalPausedTime);
    }
  }

  onGameStart() {
    this.totalPausedTime = 0;
    this.api.startMatch().subscribe(() => { 
      console.log("gamestarted");
    });
  }

  onGameEnd() {
    this.api.submitScore(this.testScore, 'human', this.totalPausedTime, [["sigmoid(5)"], []]).subscribe({
      next: (res) => alert('tscore: ' + res.top_score),
      error: (err) => alert('reject: ' + err.error.error)
    });
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

  getMyController(userId: string) {
    this.api.getSavedController(userId).subscribe(res => {
      console.log("currently saved: ", res.code, res.name)
    })
  }

  submitController(code: string[][]) {
    this.api.submitController(code).subscribe(res => {
      console.log(res);
    })
  }
}