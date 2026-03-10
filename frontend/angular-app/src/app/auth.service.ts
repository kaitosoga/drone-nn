import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class ApiService {
  private apiUrl = 'https://api.aipilots.space';

  constructor(private http: HttpClient) {}

  private getHeaders() { // is for jwt tokens
    const token = localStorage.getItem('token');
    return {
      headers: new HttpHeaders({
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      })
    };
  }

  register(data: any): Observable<any> { // better than promise, data at any time
    return this.http.post(`${this.apiUrl}/register`, data);
  }

  login(data: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/login`, data);
  }

  startMatch(): Observable<any> {
    return this.http.post(`${this.apiUrl}/start`, {}, this.getHeaders());
  }

  submitScore(score: number, mode: string, pausedTime: number, controllerCode: string = ''): Observable<any> {
    const body = {
      score,
      mode,
      paused_time: pausedTime,
      controller_code: controllerCode
    };
    return this.http.post(`${this.apiUrl}/score`, body, this.getHeaders());
  }

  submitController(controllerCode: string = ''): Observable<any> {
    const body = {
      controller_code: controllerCode
    }
    return this.http.post(`${this.apiUrl}/submit-controller`, body, this.getHeaders());
  }

  getLeaderboard(mode: 'human' | 'custom'): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/leaderboard/${mode}`);
  }

  getController(userId: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/get-controller/${userId}`);
  }

  getSavedController(userId: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/get-saved-controller/${userId}`);
  }
}



// Note: using submit score to submit custom controller only when topscore, and submitcontroller to save anytime
// getController only gets the topscore controller publicly on leaderboard, getSavedController gets the private one.
// when leaderboard ts, private one also update, when private one update leaderboard ts controller not affected












/*import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private base = 'https://api.aipilots.space'; // later api.aipilots.space //'http://knsserver3.gotdns.ch:5001'; // then nginx /api -> actually did cloudflare

  constructor(private http: HttpClient) {}

  login(username: string, password: string) {
    return this.http.post<any>(`${this.base}/login`, {username, password});
  }

  register(username: string, password: string, name: string) {
    return this.http.post<any>(`${this.base}/register`, {username, password, name});
  }

  submitScore(score: number | any, extra?: any) { // found extra in documentation for score or options
    let data: any;
    if (typeof score === 'number') {
      data = {score};
      if (extra) {
        Object.assign(data, extra);
      }
    } else {
      data = score;
    }
    return this.http.post<any>(`${this.base}/score`, data, {headers: this.authHeaders()});
  }

  leaderboard() {
    return this.http.get<any[]>(`${this.base}/leaderboard`);
  }

  saveSession(token: string, name: string, userId: string) {
    sessionStorage.setItem('token', token);
    sessionStorage.setItem('name', name);
    sessionStorage.setItem('userId', userId);
  }

  getToken() {return sessionStorage.getItem('token');}
  getName() {return sessionStorage.getItem('name');}
  isLoggedIn() {return !!this.getToken();}
  logout() {sessionStorage.clear();}

  private authHeaders() {
    return new HttpHeaders({Authorization: `Bearer ${this.getToken()}`});
  }
}
*/