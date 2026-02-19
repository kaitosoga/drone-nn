import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private base = 'http://knsserver3.gotdns.ch:5001'; // then nginx /api

  constructor(private http: HttpClient) {}

  login(username: string, password: string) {
    return this.http.post<any>(`${this.base}/login`, {username, password});
  }

  register(username: string, password: string, name: string) {
    return this.http.post<any>(`${this.base}/register`, {username, password, name});
  }

  submitScore(score: number) {
    return this.http.post<any>(`${this.base}/score`, {score}, {headers: this.authHeaders()});
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