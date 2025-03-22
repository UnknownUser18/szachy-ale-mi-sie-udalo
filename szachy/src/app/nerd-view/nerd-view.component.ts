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
  constructor(private chessService: ChessService) {}
  ngOnInit() : void {
    this.chessService.currentTurnColor.subscribe((color : PieceColor) : PieceColor => this.currentTurnColor = color);
  }
}
