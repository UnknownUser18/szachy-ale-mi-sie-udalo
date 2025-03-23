import { Injectable, forwardRef, Inject } from '@angular/core';
import { ChessService, ChessPiece, MoveAttempt, PieceColor } from './chess.service';
import { ChessEvaluationService } from './chess-evaluation.service';

@Injectable({
  providedIn: 'root'
})
export class ChessAiService {
  constructor(
    @Inject(forwardRef(() => ChessService))
    private chessService: ChessService,
    private evaluationService: ChessEvaluationService
  ) {}

  private memo: Map<string, number> = new Map();

  public findBestMove(color: PieceColor, depth: number): MoveAttempt | null {
    // Clear memo between moves.
    this.memo.clear();
    const board = this.chessService.copyChessBoard(this.chessService.board);
    const legalMoves = this.getAllLegalMoves(board, color);
    if (legalMoves.length === 0) {
      console.warn('No legal moves available.');
      return null;
    }
    let bestMove: MoveAttempt | null = null;
    const isMaximizing = color === 'white';
    let bestEval = isMaximizing ? -Infinity : Infinity;
    for (const move of legalMoves) {
      const newBoard = this.simulateMove(move.from, move.to, board);
      const evalScore = this.minimax(newBoard, depth - 1, -Infinity, Infinity, !isMaximizing, color);
      if (isMaximizing && evalScore > bestEval) {
        bestEval = evalScore;
        bestMove = move;
      } else if (!isMaximizing && evalScore < bestEval) {
        bestEval = evalScore;
        bestMove = move;
      }
    }
    return bestMove;
  }

  private minimax(
    board: (ChessPiece | null)[][],
    depth: number,
    alpha: number,
    beta: number,
    isMaximizingPlayer: boolean,
    currentColor: PieceColor
  ): number {
    const key = this.generateBoardKey(board, depth, alpha, beta, isMaximizingPlayer, currentColor);
    if (this.memo.has(key)) {
      return this.memo.get(key)!;
    }
    if (depth === 0 || this.chessService.isMate(currentColor) === 'mate') {
      const evalScore = this.evaluationService.evaluateBoard(board, currentColor);
      this.memo.set(key, evalScore);
      return evalScore;
    }
    const legalMoves = this.getAllLegalMoves(board, currentColor);
    if (legalMoves.length === 0) {
      const evalScore = this.evaluationService.evaluateBoard(board, currentColor);
      this.memo.set(key, evalScore);
      return evalScore;
    }
    let value: number;
    if (isMaximizingPlayer) {
      value = -Infinity;
      for (const move of legalMoves) {
        const newBoard = this.simulateMove(move.from, move.to, board);
        value = Math.max(
          value,
          this.minimax(
            newBoard,
            depth - 1,
            alpha,
            beta,
            false,
            currentColor === 'white' ? 'black' : 'white'
          )
        );
        alpha = Math.max(alpha, value);
        if (beta <= alpha) break;
      }
    } else {
      value = Infinity;
      for (const move of legalMoves) {
        const newBoard = this.simulateMove(move.from, move.to, board);
        value = Math.min(
          value,
          this.minimax(
            newBoard,
            depth - 1,
            alpha,
            beta,
            true,
            currentColor === 'white' ? 'black' : 'white'
          )
        );
        beta = Math.min(beta, value);
        if (beta <= alpha) break;
      }
    }
    this.memo.set(key, value);
    return value;
  }

  private generateBoardKey(
    board: (ChessPiece | null)[][],
    depth: number,
    alpha: number,
    beta: number,
    isMaximizingPlayer: boolean,
    currentColor: PieceColor
  ): string {
    return JSON.stringify(board) + '_' + depth + '_' + isMaximizingPlayer + '_' + currentColor;
  }


  private getBaseImportance(type: string): number {
    switch (type) {
      case 'pawn': return 1;
      case 'knight': return 3;
      case 'bishop': return 3;
      case 'rook': return 5;
      case 'queen': return 9;
      case 'king': return 100;
      default: return 0;
    }
  }


  private getAllLegalMoves(board: (ChessPiece | null)[][], color: PieceColor): MoveAttempt[] {
    const legalMoves: MoveAttempt[] = [];
    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        const piece = board[row][col];
        if (piece && piece.color === color) {
          const moves = this.chessService.calculateLegalMoves(piece, board);
          for (let targetRow = 0; targetRow < moves.length; targetRow++) {
            for (let targetCol = 0; targetCol < moves[targetRow].length; targetCol++) {
              const target = moves[targetRow][targetCol];
              if (target.isLegal) {
                const simulatedBoard = this.simulateMove({ row, col }, { row: targetRow, col: targetCol }, board);
                if (!this.chessService.isKingInCheck(color, simulatedBoard)) {
                  legalMoves.push({
                    from: { row, col },
                    to: { row: targetRow, col: targetCol }
                  });
                }
              }
            }
          }
        }
      }
    }
    return legalMoves;
  }

  private simulateMove(
    from: { row: number, col: number },
    to: { row: number, col: number },
    board: (ChessPiece | null)[][]
  ): (ChessPiece | null)[][] {
    const newBoard = this.chessService.copyChessBoard(board);
    const piece = newBoard[from.row][from.col];
    newBoard[to.row][to.col] = piece;
    newBoard[from.row][from.col] = null;
    if (piece) {
      piece.position = { row: to.row, col: to.col };
    }
    return newBoard;
  }
}
