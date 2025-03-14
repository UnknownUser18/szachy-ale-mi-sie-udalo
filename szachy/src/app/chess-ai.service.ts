import { Injectable, forwardRef, Inject } from '@angular/core';
import { ChessService, ChessPiece, MoveAttempt, PieceColor} from './chess.service';
@Injectable({
  providedIn: 'root'
})
export class ChessAiService {
  constructor(
    @Inject(forwardRef(() => ChessService))
    private chessService: ChessService
  ) {}


  public findBestMove(color: PieceColor, depth: number): MoveAttempt | null {
    const board = this.chessService.copyChessBoard(this.chessService.board);
    const legalMoves = this.getAllLegalMoves(board, color);

    if (legalMoves.length === 0) {
      console.warn('No legal moves available.');
      return null;
    }

    const bestMove = this.minimax(board, depth, -Infinity, Infinity, color === 'white', color);
    return bestMove.move;
  }

  private minimax(
    board: (ChessPiece | null)[][],
    depth: number,
    alpha: number,
    beta: number,
    isMaximizingPlayer: boolean,
    color: PieceColor
  ): { score: number, move: MoveAttempt | null } {
    if (depth === 0 || this.chessService.isMate(color)) {
      return { score: this.evaluateBoard(board, color), move: null };
    }

    const legalMoves = this.getAllLegalMoves(board, color);
    let bestMove: MoveAttempt | null = null;

    if (isMaximizingPlayer) {
      let maxEval = -Infinity;
      for (const move of legalMoves) {
        const newBoard = this.simulateMove(move.from, move.to, board);
        const evaluation = this.minimax(newBoard, depth - 1, alpha, beta, false, color === 'white' ? 'black' : 'white').score;
        if (evaluation > maxEval) {
          maxEval = evaluation;
          bestMove = move;
        }
        alpha = Math.max(alpha, evaluation);
        if (beta <= alpha) {
          break;
        }
      }
      return { score: maxEval, move: bestMove };
    } else {
      let minEval = Infinity;
      for (const move of legalMoves) {
        const newBoard = this.simulateMove(move.from, move.to, board);
        const evaluation = this.minimax(newBoard, depth - 1, alpha, beta, true, color === 'white' ? 'black' : 'white').score;
        if (evaluation < minEval) {
          minEval = evaluation;
          bestMove = move;
        }
        beta = Math.min(beta, evaluation);
        if (beta <= alpha) {
          break;
        }
      }
      return { score: minEval, move: bestMove };
    }
  }

  private evaluateBoard(board: (ChessPiece | null)[][], color: PieceColor): number {
    let score = 0;
    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        const piece = board[row][col];
        if (piece) {
          let pieceValue = this.getPieceValue(piece.type);

          // Bonus for central control
          if ((row === 3 || row === 4) && (col === 3 || col === 4)) {
            pieceValue += 0.5;
          }

          // Penalty for isolated pawns
          if (piece.type === 'pawn') {
            if ((col > 0 && !board[row][col - 1]) && (col < 7 && !board[row][col + 1])) {
              pieceValue -= 0.5;
            }
          }

          // Bonus for capturing high-value pieces
          if (piece.type === 'rook' || piece.type === 'queen') {
            pieceValue += 2;
          }

          // Subtract if piece is enemy
          score += piece.color === color ? pieceValue : -pieceValue;
        }
      }
    }
    return score;
  }

  private getPieceValue(type: string): number {
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
          for (let moveRow = 0; moveRow < 8; moveRow++) {
            for (let moveCol = 0; moveCol < 8; moveCol++) {
              if (moves[moveRow][moveCol].isLegal) {
                legalMoves.push({
                  from: { row, col },
                  to: { row: moveRow, col: moveCol }
                });
              }
            }
          }
        }
      }
    }
    return legalMoves;
  }

  private simulateMove(from: { row: number, col: number }, to: { row: number, col: number }, board: (ChessPiece | null)[][]): (ChessPiece | null)[][] {
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
