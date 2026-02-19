import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Info } from "../info/info";
import { Game } from "../game/game";

@Component({
  selector: 'app-home',
  imports: [CommonModule, Info, Game],
  templateUrl: './home.html',
  styleUrl: './home.css',
})

export class Home {
  data: any[] = [] // indicate type (number, string, ...)
  user: {name: string, id: number, level: number, passwd: string}[] = []

  userName: string = "undefined"

  constructor() {
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



  

}




