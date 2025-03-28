import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { ChessService, MoveAttempt, SpecialMove, PieceType, Position, ChessPiece} from '../chess.service';
import {Game} from '../szachownica/szachownica.component';

@Component({
  selector: 'app-notation',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './notation.component.html',
  styleUrls: ['./notation.component.css']
})
export class NotationComponent implements OnInit, OnDestroy {
  @Input() moves: string[] = [];
  private gameStartSub: Subscription = new Subscription(); 
  constructor(private chessService: ChessService) {}

  ngOnInit() {
    this.gameStartSub = this.chessService.gameStart.subscribe((game: Game) => {
      this.resetNotation();
    });
  }

  ngOnDestroy() {
    if (this.gameStartSub) {
      this.gameStartSub.unsubscribe();
    }
  }

  resetNotation(): void {
    this.moves = [];
    console.log('Notacja wyzerowana');
  }

  addMove(move: MoveAttempt): void {
    const from = this.convertPositionToNotation(move.from);
    const to = this.convertPositionToNotation(move.to);
    const piece = this.chessService.getPieceFromPosition(move.from);
  
    let moveNotation = '';
    


    if (move.specialMove) {
      moveNotation = this.handleSpecialMove(move.specialMove, from, to);
    } else {
      if (this.isCapture(move)) {
        moveNotation = `${piece?.type.toUpperCase() || ''}${from}x${to}`;
      } else {
        moveNotation = `${piece?.type.toUpperCase() || ''}${to}`;

      }
    }


  
    const movingColor = piece?.color;
    const opponentColor = movingColor === 'white' ? 'black' : 'white';
    
    const gameState = this.chessService.isMate('black') || this.chessService.isMate('white');
  
    if (gameState === 'mate') {
      
      moveNotation += '#';
    } else if (gameState === 'check' || this.chessService.isKingInCheck(opponentColor)) {
      
      moveNotation += '+';
    }
  
    this.moves.push(moveNotation);
  }

  getMovePairs(): string[][] {
    const pairs: string[][] = [];
    for (let i = 0; i < this.moves.length; i += 2) {
      const whiteMove = this.moves[i];
      const blackMove = i + 1 < this.moves.length ? this.moves[i + 1] : '';
      pairs.push([whiteMove, blackMove]);
    }
    return pairs;
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
    const previousPiece = this.chessService.previousBoard[move.to.row][move.to.col];
    return !!previousPiece && previousPiece.color !== this.chessService.getPieceFromPosition(move.from)?.color;
  }

  private convertPositionToNotation(position: { row: number, col: number }): string {
    const column = String.fromCharCode(97 + position.col);
    const row = (position.row) + 1;
    return `${column}${row}`;
  }
}