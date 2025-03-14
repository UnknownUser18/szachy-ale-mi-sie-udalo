import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import {SzachownicaComponent} from './szachownica/szachownica.component';
import { ChessService } from './chess.service';
import { ChessAiService } from './chess-ai.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, SzachownicaComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
  constructor(
    private chessService: ChessService,
    private chessAiService: ChessAiService
  ) {
    this.chessService.setAiService(this.chessAiService);
  }
}
