import { Component } from '@angular/core';
import { RouterOutlet, RouterLink } from '@angular/router';
import { Home } from "./home/home";

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterLink],  // Add these
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})

export class AppComponent {}
