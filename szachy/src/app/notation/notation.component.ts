import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ChessService, MoveAttempt, SpecialMove } from '../chess.service';

@Component({
  selector: 'app-notation',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './notation.component.html',
  styleUrls: ['./notation.component.css']
})
export class NotationComponent {
  @Input() moves: string[] = [];

  constructor(private chessService: ChessService) {}

  addMove(move: MoveAttempt): void {
    const from = this.convertPositionToNotation(move.from);
    const to = this.convertPositionToNotation(move.to);
    const piece = this.chessService.getPieceFromPosition(move.from);

    let moveNotation = '';


    if (move.specialMove) {
      moveNotation = this.handleSpecialMove(move.specialMove, from, to);
    } else {
      
      moveNotation = `${piece?.type.toUpperCase() || ''}${from}${this.isCapture(move) ? 'x' : '-'}${to}`;
    }

    if (this.chessService.isCheck()) {
      moveNotation += '+';
    } else if (this.chessService.isCheckmate()) {
      moveNotation += '#';
    }

    this.moves.push(moveNotation);
  }

  private handleSpecialMove(specialMove: SpecialMove, from: string, to: string): string {
    switch (specialMove) {
      case 'O-O':
        return '0-0'; 
      case 'O-O-O':
        return '0-0-0'; 
      case 'enpassant':
        return `${from}x${to}`; 
      default:
        return `${from}:${to}`; 
    }
  }


  private isCapture(move: MoveAttempt): boolean {
    const targetPiece = this.chessService.getPieceFromPosition(move.to);
    return !!targetPiece; 
  }


  private convertPositionToNotation(position: { row: number, col: number }): string {
    const column = String.fromCharCode(97 + position.col); 
    const row =  (position.row)+1; 
    return `${column}${row}`;
  }
}