import { Component } from '@angular/core';
import { ChessService } from '../chess.service';
import { ChessAiService } from '../chess-ai.service';

@Component({
  selector: 'app-position-evaluator',
  templateUrl: './position-evaluator.component.html',
  styleUrls: ['./position-evaluator.component.css']
})
export class PositionEvaluatorComponent {
  evaluation: number = 0;

  constructor(
    private chessService: ChessService,
    private chessAiService: ChessAiService
  ) {}

  evaluatePosition(): void {
    this.evaluation = this.chessAiService.evaluatePosition(this.chessService.board, 'white');
  }

}
