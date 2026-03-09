import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../auth.service';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './profile.html',
  styleUrl: './profile.css',
})
export class Profile {
  api = inject(ApiService); // from service component
  
  username = '';
  password = '';
  displayName = '';
  testScore = 0;
  
  leaderboard: any[] = [];
  isPaused = false;
  pauseStartTime: number = 0;
  totalPausedTime: number = 0;

  constructor() {
    document.title = "AI Pilots - Profile";
  }

  // testing all functions of the backend, the api service + subscribe https://angular.dev/guide/http/making-requests

  onRegister() {
    const newUser = {
      username: this.username,
      password: this.password,
      name: this.displayName
    };
    this.api.register(newUser).subscribe({ // either new value next or error
      next: (res) => { // res is http response from backend
        localStorage.setItem('token', res.token);
        alert('Registered and Logged in as ' + res.name);
      },
      error: (err) => alert(err.error.error)
    });
  }

  onLogin() {
    const creds = {
      username: this.username,
      password: this.password
    };
    this.api.login(creds).subscribe({
      next: (res) => {
        localStorage.setItem('token', res.token); // should be new token I think
        alert('Logged in!');
      },
      error: (err) => alert(err.error.error)
    });
  }

  onLogout() {
    localStorage.removeItem('token');
    alert('Logged out');
  }

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
    this.api.submitScore(this.testScore, 'custom', this.totalPausedTime, "sigmoid(5)").subscribe({
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
}