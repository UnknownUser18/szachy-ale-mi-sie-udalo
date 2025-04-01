import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import {
  ChessService,
  MoveAttempt,
  SpecialMove,
  PieceType,
  Position,
  PieceColor,
  ChessPiece,
  legalMove
} from '../chess.service';
import { Game } from '../szachownica/szachownica.component';

@Component({
  selector: 'app-notation',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './notation.component.html',
  styleUrls: ['./notation.component.css']
})
export class NotationComponent implements OnInit, OnDestroy {
  @Input() moves: string[] = [];
  @Input() longmoves: string[] = [];
  private pawnPromotionSub?: Subscription;
  private gameStartSub: Subscription = new Subscription();
  private aiMoveSub?: Subscription;
  private lastPromotion : PieceType = 'pawn';
  constructor(private chessService: ChessService) { }

  public notationType: 'short' | 'long' = 'long';

  onNotationTypeChange(event: Event): void {
    const select = event.target as HTMLSelectElement;
    this.notationType = select.value === 'notacja_prosta' ? 'short' : 'long';
  }


  ngOnInit() {
    this.gameStartSub = this.chessService.gameStart.subscribe((game: Game) => {
      this.resetNotation();
    });

    this.aiMoveSub = this.chessService.aiMoveExecuted.subscribe(({ from, to, color }) => {
      const board = this.chessService.board; // UĹĽyj aktualnej szachownicy
      this.addSimulatedMove(from, to, board, color);
    });

    this.pawnPromotionSub = this.chessService.pawnPromoted.subscribe(
      ({ position, promotedTo, color }) => {
        this.updateNotationAfterPromotion(position, promotedTo, color);
      }
    );
  }

  private updateNotationAfterPromotion(
    position: Position,
    promotedTo: PieceType,
    color: PieceColor
  ) {
    if (this.moves.length === 0) return;
  
    // Ostatni ruch danego koloru to ten, który wymagał promocji
    const lastMoveIndex = color === 'white' ? this.moves.length - 1 : this.moves.length - 1;
    const lastLongMoveIndex = color === 'white' ? this.longmoves.length - 1 : this.longmoves.length - 1;
  
    // Dodaj oznaczenie promocji (np. "e8=Q")
    const gameState = this.chessService.isMate('black') || this.chessService.isMate('white');
    const promotionSymbol = this.PieceName({ type: promotedTo, color } as ChessPiece);

    this.moves[lastMoveIndex] += `=${promotionSymbol}`;
    this.longmoves[lastLongMoveIndex] += `=${promotionSymbol}`;

    if (gameState === 'mate') {
      this.longmoves[lastLongMoveIndex] += "#";
      this.moves[lastMoveIndex] += "#";
    } else if (gameState === 'check' || this.chessService.isKingInCheck("white") || this.chessService.isKingInCheck("black")) {
      this.longmoves[lastLongMoveIndex] += "+";
      this.moves[lastMoveIndex] += "+";
    }

  }

  ngOnDestroy() {
    if (this.gameStartSub) {
      this.gameStartSub.unsubscribe();
    }

    if (this.aiMoveSub) {
      this.aiMoveSub.unsubscribe();
    }
  }

  resetNotation(): void {
    this.moves = [];
    this.longmoves = [];
    console.log('Notacja wyzerowana');
  }

  PieceName(piece: ChessPiece): string | null {
    switch (piece?.type) {
      case 'king':
        return 'K';
      case 'rook':
        return 'R';
      case 'knight':
        return `N`;
      case 'bishop':
        return `B`;
      case 'queen':
        return `Q`;
      case 'pawn':
        return '';
      default:
        return null;
    }
  }

  addMove(move: MoveAttempt): void {
   

    const from = this.convertPositionToNotation(move.from);
    const to = this.convertPositionToNotation(move.to);
    const piece = this.chessService.getPieceFromPosition(move.to);
    const from_col = from[0]
    // alert(this.chessService.executeEnpassant(piece!));
    let moveNotation = '';
    let longmoveNotation = '';
    const legalMoves = this.chessService.getLegalMovesForColor(piece?.color!).find((item: {piece: ChessPiece, legalMoves: legalMove[][]}) => item.piece === piece)?.legalMoves
    if(!legalMoves) return;
    const legalToPosition = legalMoves[move.to.row][move.to.col];

    if (legalToPosition.special) {
      moveNotation = this.handleSpecialMove(legalToPosition.special, from, to);
      longmoveNotation = moveNotation;
    } else {
      if (this.isCapture(move)) {
        moveNotation = `${this.PieceName(piece!) || ''}${from_col}x${to}`;
        longmoveNotation = `${this.PieceName(piece!) || ''}${from}x${to}`
      } else {
        moveNotation = `${this.PieceName(piece!) || ''}${to}`;
        longmoveNotation = `${this.PieceName(piece!) || ''}${from}-${to}`
      }


      if (this.chessService.currentSpecialForNotationOnly != "" ) {
        moveNotation = this.handleSpecialMove(this.chessService.currentSpecialForNotationOnly, from, to);
        longmoveNotation = this.handleSpecialMove(this.chessService.currentSpecialForNotationOnly, from, to);
        this.chessService.currentSpecialForNotationOnly = "";
      } else {
        if (this.isCapture(move)) {
          moveNotation = `${this.PieceName(piece!) || ''}${from}x${to}`;
        } else {
          moveNotation = `${this.PieceName(piece!) || ''}${to}`;

        }
      }




      const movingColor = piece?.color;
      const opponentColor = movingColor === 'white' ? 'black' : 'white';

      const gameState = this.chessService.isMate('black') || this.chessService.isMate('white');

      if (gameState === 'mate') {

        longmoveNotation += "#";
        moveNotation += '#';
      } else if (gameState === 'check' || this.chessService.isKingInCheck(opponentColor)) {

        longmoveNotation += "+";
        moveNotation += '+';
      }
      // const isPromotionMove = piece?.type === 'pawn' && 
      // (move.to.row === 0 || move.to.row === 7);

      // if (isPromotionMove) {
      //   // Domyślnie zakładamy, że promocja jest na hetmana (standard w szachach)
      //   const promotedSymbol = 'Q'; // Możesz też pobrać rzeczywisty typ z `piece.type`, jeśli już został zmieniony
      //   moveNotation += `=${promotedSymbol}`;
      //   longmoveNotation += `=${promotedSymbol}`;
      // }

      this.moves.push(moveNotation);
      this.longmoves.push(longmoveNotation);
    }


 
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



  getLongMovePairs(): string[][] {
    const pairs: string[][] = [];
    for (let i = 0; i < this.longmoves.length; i += 2) {
      const whiteMove = this.longmoves[i];
      const blackMove = i + 1 < this.longmoves.length ? this.longmoves[i + 1] : '';
      pairs.push([whiteMove, blackMove]);
    }
    return pairs;
  }

  private handleSpecialMove(specialMove: string, from: string, to: string): string {
    switch (specialMove) {
      case 'O-O':
        return 'O-O';
      case 'O-O-O':
        return 'O-O-O';
      case 'enpassant':
        return `${from}x${to}`;
        
      default:
        return `${from}-${to}`;
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


  /* ------   Implementacja notacji dla rozgrywek z AI ------   */

  private addSimulatedMove(
    from: { row: number, col: number },
    to: { row: number, col: number },
    board: (ChessPiece | null)[][],
    color: PieceColor
  ) {
    const fromNotation = this.convertPositionToNotation(from);
    const toNotation = this.convertPositionToNotation(to);
    const piece = board[to.row][to.col];
    const from_col = fromNotation[0];
    let moveNotation = (board[to.row][to.col] ? `${from_col}x${toNotation}` : toNotation);
    let longmoveNotation = (board[to.row][to.col] ? `${fromNotation}x${toNotation}` : `${fromNotation}-${toNotation}`);
  
    // Sprawdź stan gry po ruchu
    const opponentColor = color === 'white' ? 'black' : 'white';
    let isMate = this.chessService.isMate("white") || this.chessService.isMate("black");
    let isCheck = this.chessService.isKingInCheck("white") || this.chessService.isKingInCheck("black");

  
    const gameState = this.chessService.isMate('black') || this.chessService.isMate('white');

    if (gameState === 'mate') {

      longmoveNotation += "#";
      moveNotation += '#';
    } else if (gameState === 'check' || this.chessService.isKingInCheck("white") ||  this.chessService.isKingInCheck("black")) {
      longmoveNotation += "+";
      moveNotation += '+';
  
    this.moves.push(moveNotation);
    this.longmoves.push(longmoveNotation);
  }
  }
}


