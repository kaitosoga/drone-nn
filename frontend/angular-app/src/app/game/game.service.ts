import { Component, Injectable } from '@angular/core'
// found solution to not chaning ownCobntroller boolean when redirecting from leaderboard to game component
@Injectable({ providedIn: 'root' }) // root makes it load once when website loads
export class GameService {
  public ownController: boolean = true; 
  public ownControllerData: string[][] = [];

  constructor() {}
}
