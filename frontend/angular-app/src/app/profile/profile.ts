import { Component, inject} from '@angular/core';
import { ApiService } from '../auth.service';

@Component({
  selector: 'app-profile',
  imports: [],
  templateUrl: './profile.html',
  styleUrl: './profile.css',
})
export class Profile {
  api = inject(ApiService);

  constructor() {
    document.title = "AI Pilots - Profile";
  }



  // temp:

  onRegister() {
    const newUser = { username: 'test', password: '123', name: 'Test Pilot' };
    this.api.register(newUser).subscribe(res => {
      localStorage.setItem('token', res.token);
      alert('Welcome ' + res.name);
    });
  }





  pauseStartTime: number = 0;
totalPausedTime: number = 0; // In seconds

/*togglePause() {
  this.isPaused = !this.isPaused;
  if (this.isPaused) {
    this.pauseStartTime = Date.now();
  } else {
    this.totalPausedTime += (Date.now() - this.pauseStartTime) / 1000;
  }
}

onGameStart() {
  this.totalPausedTime = 0;
  this.api.startMatch().subscribe(() => { //game loop });
}

onGameEnd(finalScore: number) {
  this.api.submitScore(finalScore, 'human', this.totalPausedTime).subscribe({
    next: (res) => console.log('Saved!', res),
    error: (err) => console.error('Rejected:', err.error.error)
  });
}


loadLeaders() {
  this.api.getLeaderboard('custom').subscribe(list => {
    this.leaderboard = list;
  });
}

challengePlayer(userId: string) {
  this.api.getController(userId).subscribe(res => {
    // res.code is the string you'll pass into new Function()
    console.log('Now playing against: ' + res.name);
    this.setupOpponentAI(res.code);
  });
}*/

}
