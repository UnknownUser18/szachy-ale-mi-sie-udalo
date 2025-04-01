import {Component, Input, OnInit} from '@angular/core';
import {Game} from '../szachownica/szachownica.component';
import {ChessService, PieceColor} from '../chess.service';

@Component({
  selector: 'app-nerd-view',
  imports: [],
  templateUrl: './nerd-view.component.html',
  styleUrl: './nerd-view.component.css'
})
export class NerdViewComponent implements OnInit {
  @Input() game!: Game | null;
  currentTurnColor! : PieceColor;
  @Input() moves!: any;
  constructor(private chessService: ChessService) {}


  /**
   * @method ngOnInit
   * @description Wyświetlanie i zmiana koloru gracza, który teraz wykonuje ruch
   * @returns {void}
   */
  ngOnInit() : void {
    this.chessService.currentTurnColor.subscribe((color : PieceColor) : PieceColor => this.currentTurnColor = color);
    if(!this.moves) {
      this.moves = {player: '', grandmaster: ''};
    }
  }
}
