import { Injectable, forwardRef, Inject } from '@angular/core';
import { ChessService, ChessPiece, PieceColor } from './chess.service';

@Injectable({
  providedIn: 'root'
})
export class ChessEvaluationService {
  constructor(
    @Inject(forwardRef(() => ChessService))
    private chessService: ChessService
  ) {
  }

  public evaluateBoard(board: (ChessPiece | null)[][], color: PieceColor): number {
    let score = 0;
    const gamePhase = this.determineGamePhase(board);

    let whiteDevelopedPieces = 0;
    let blackDevelopedPieces = 0;
    let whiteCenterControl = 0;
    let blackCenterControl = 0;

    const enemyAttackMap = this.buildEnemyAttackMap(board, color);

    const pawnFiles = {white: Array(8).fill(0), black: Array(8).fill(0)};
    const pawnCounts = {white: 0, black: 0};

    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        const piece = board[row][col];
        if (!piece) continue;

        if (piece.type === 'pawn') {
          pawnFiles[piece.color][col]++;
          pawnCounts[piece.color]++;
        }

        const baseValue = this.getBaseImportance(piece.type);
        let posValue = this.getPositionalValue(piece, row, col, gamePhase);

        if (gamePhase === 'opening') {
          if (piece.color === 'white') {
            if (this.isPieceDeveloped(piece, row, col, 'white')) {
              whiteDevelopedPieces++;
            }
          } else {
            if (this.isPieceDeveloped(piece, row, col, 'black')) {
              blackDevelopedPieces++;
            }
          }
        }

        if (piece.color === 'white') {
          whiteCenterControl += this.evaluateCenterControl(piece, board, row, col);
        } else {
          blackCenterControl += this.evaluateCenterControl(piece, board, row, col);
        }

        let safetyPenalty = 0;
        if (enemyAttackMap[row][col]) {
          const phaseMultiplier = gamePhase === 'endgame' ? 0.3 : 0.6;
          safetyPenalty = baseValue * phaseMultiplier;
          if (!this.isSquareDefended(board, row, col, piece.color)) {
            safetyPenalty *= 1.5;
          }
        }
        if (enemyAttackMap[row][col] && !this.isSquareDefended(board, row, col, piece.color)) {
          safetyPenalty += baseValue * 2;
        }

        const mobilityBonus = this.calculateMobilityBonus(board, piece, gamePhase);
        const totalValue = baseValue * 100 + posValue - safetyPenalty + mobilityBonus;
        const factor = piece.color === 'white' ? 1 : -1;
        score += totalValue * factor;
      }
    }

    if (gamePhase === 'opening') {
      score += (whiteDevelopedPieces - blackDevelopedPieces) * 25;
      score += (whiteCenterControl - blackCenterControl) * 30;
      score += this.evaluateCastlingOpportunities(board);
      score += this.penalizeEarlyQueenMoves(board);
    }

    if (gamePhase === 'middlegame') {
      score += this.evaluateKingSafety(board);
      score += this.evaluateRooksOnOpenFiles(board, pawnFiles);
    }
    if (gamePhase === 'endgame') {
      if (pawnCounts.white + pawnCounts.black < 8) {
        score += this.endgameAdjustments(board, color);
      }
    }

    return score;
  }

  private buildEnemyAttackMap(board: (ChessPiece | null)[][], color: PieceColor): boolean[][] {
    const attackMap: boolean[][] = Array(8).fill(null).map(() => Array(8).fill(false));
    const enemyColor = color === 'white' ? 'black' : 'white';

    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        const piece = board[row][col];
        if (piece && piece.color === enemyColor) {
          const moves = this.chessService.calculateLegalMoves(piece, board);
          for (let r = 0; r < 8; r++) {
            for (let c = 0; c < 8; c++) {
              if (moves[r][c] && moves[r][c].isLegal) {
                attackMap[r][c] = true;
              }
            }
          }
        }
      }
    }
    return attackMap;
  }

  private getBaseImportance(type: string): number {
    switch (type) {
      case 'pawn':
        return 1;
      case 'knight':
        return 3;
      case 'bishop':
        return 3;
      case 'rook':
        return 5;
      case 'queen':
        return 9;
      case 'king':
        return 100;
      default:
        return 0;
    }
  }

  private calculateMobilityBonus(board: (ChessPiece | null)[][], piece: ChessPiece, gamePhase: string): number {
    const moves = this.chessService.calculateLegalMoves(piece, board);
    let mobilityCount = 0;

    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        if (moves[r][c] && moves[r][c].isLegal) {
          mobilityCount++;
        }
      }
    }

    const mobilityMultiplier = {
      'pawn': 0.5,
      'knight': 1,
      'bishop': 1.2,
      'rook': 0.7,
      'queen': 0.5,
      'king': 0.2
    }[piece.type] || 0.5;

    const phaseMultiplier = gamePhase === 'opening' ? 0.7 : (gamePhase === 'middlegame' ? 1.0 : 0.8);

    return mobilityCount * mobilityMultiplier * 5 * phaseMultiplier;
  }
  private determineGamePhase(board: (ChessPiece | null)[][]): 'opening' | 'middlegame' | 'endgame' {
    let pieceCount = 0;
    let developedPieceCount = 0;

    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        const piece = board[row][col];
        if (!piece) continue;

        if (piece.type !== 'pawn' && piece.type !== 'king') {
          pieceCount++;
        }

        if (piece.color === 'white' && row < 6 && piece.type !== 'pawn') {
          developedPieceCount++;
        }
        if (piece.color === 'black' && row > 1 && piece.type !== 'pawn') {
          developedPieceCount++;
        }
      }
    }

    if (pieceCount >= 12 && developedPieceCount <= 8) {
      return 'opening';
    } else if (pieceCount >= 6) {
      return 'middlegame';
    } else {
      return 'endgame';
    }
  }

  private getPositionalValue(piece: ChessPiece, row: number, col: number, gamePhase: string): number {
    const r = piece.color === 'white' ? row : 7 - row;
    let posValue = 0;

    if (gamePhase === 'opening') {
      switch (piece.type) {
        case 'pawn':
          posValue = [
            [0, 0, 0, 0, 0, 0, 0, 0],
            [50, 50, 50, 50, 50, 50, 50, 50],
            [10, 10, 20, 30, 30, 20, 10, 10],
            [5, 5, 10, 35, 35, 10, 5, 5],
            [0, 0, 0, 25, 25, 0, 0, 0],
            [5, -5, -10, 0, 0, -10, -5, 5],
            [5, 10, 10, -20, -20, 10, 10, 5],
            [0, 0, 0, 0, 0, 0, 0, 0]
          ][r][col];
          break;
        case 'knight':
          posValue = [
            [-50, -40, -30, -30, -30, -30, -40, -50],
            [-40, -20, 0, 5, 5, 0, -20, -40],
            [-30, 5, 15, 15, 15, 15, 5, -30],
            [-30, 0, 15, 20, 20, 15, 0, -30],
            [-30, 0, 15, 20, 20, 15, 0, -30],
            [-30, 5, 15, 15, 15, 15, 5, -30],
            [-40, -20, 0, 0, 0, 0, -20, -40],
            [-50, -40, -30, -30, -30, -30, -40, -50]
          ][r][col];
          break;
        case 'bishop':
          posValue = [
            [-20, -10, -10, -10, -10, -10, -10, -20],
            [-10, 5, 0, 0, 0, 0, 5, -10],
            [-10, 10, 10, 10, 10, 10, 10, -10],
            [-10, 0, 10, 15, 15, 10, 0, -10],
            [-10, 5, 5, 15, 15, 5, 5, -10],
            [-10, 0, 10, 10, 10, 10, 0, -10],
            [-10, 0, 0, 0, 0, 0, 0, -10],
            [-20, -10, -10, -10, -10, -10, -10, -20]
          ][r][col];
          break;
      }
    } else if (gamePhase == "middlegame") {
      switch (piece.type) {
        case 'pawn':

      }
    }

    return posValue;
  }

  private isPieceDeveloped(piece: ChessPiece, row: number, col: number, color: PieceColor): boolean {
    if (color === 'white') {
      if (piece.type === 'knight' && row < 6) return true;
      if (piece.type === 'bishop' && row < 6) return true;
      if (piece.type === 'rook' && row === 7 && (col === 3 || col === 4)) return true;
      return false;
    } else {
      if (piece.type === 'knight' && row > 1) return true;
      if (piece.type === 'bishop' && row > 1) return true;
      if (piece.type === 'rook' && row === 0 && (col === 3 || col === 4)) return true;
      return false;
    }
  }

  private evaluateCenterControl(piece: ChessPiece, board: (ChessPiece | null)[][], row: number, col: number): number {
    const centerSquares = [{row: 3, col: 3}, {row: 3, col: 4}, {row: 4, col: 3}, {row: 4, col: 4}];
    let centerControl = 0;

    if (centerSquares.some(sq => sq.row === row && sq.col === col)) {
      centerControl += piece.type === 'pawn' ? 2 : 1;
    }

    const moves = this.chessService.calculateLegalMoves(piece, board);
    for (const square of centerSquares) {
      if (moves[square.row] && moves[square.row][square.col] && moves[square.row][square.col].isLegal) {
        centerControl += 1;
      }
    }

    return centerControl;
  }

  private evaluateCastlingOpportunities(board: (ChessPiece | null)[][]): number {
    let score = 0;

    const whiteKingMoved = !this.isPieceInOriginalPosition(board, 7, 4, 'king', 'white');
    const whiteKRookMoved = !this.isPieceInOriginalPosition(board, 7, 7, 'rook', 'white');
    const whiteQRookMoved = !this.isPieceInOriginalPosition(board, 7, 0, 'rook', 'white');

    const blackKingMoved = !this.isPieceInOriginalPosition(board, 0, 4, 'king', 'black');
    const blackKRookMoved = !this.isPieceInOriginalPosition(board, 0, 7, 'rook', 'black');
    const blackQRookMoved = !this.isPieceInOriginalPosition(board, 0, 0, 'rook', 'black');

    if (!whiteKingMoved) {
      if (!whiteKRookMoved) score += 15;
      if (!whiteQRookMoved) score += 10;
    }

    if (!blackKingMoved) {
      if (!blackKRookMoved) score -= 15;
      if (!blackQRookMoved) score -= 10;
    }

    return score;
  }

  private isPieceInOriginalPosition(board: (ChessPiece | null)[][], row: number, col: number, type: string, color: PieceColor): boolean {
    const piece = board[row][col];
    return !!piece && piece.type === type && piece.color === color;
  }

  private penalizeEarlyQueenMoves(board: (ChessPiece | null)[][]): number {
    let score = 0;

    const whiteQueenMoved = !this.isPieceInOriginalPosition(board, 7, 3, 'queen', 'white');
    if (whiteQueenMoved) score -= 20;

    const blackQueenMoved = !this.isPieceInOriginalPosition(board, 0, 3, 'queen', 'black');
    if (blackQueenMoved) score += 20;

    return score;
  }

  private isSquareDefended(board: (ChessPiece | null)[][], row: number, col: number, color: PieceColor): boolean {
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const defender = board[r][c];
        if (!defender || defender.color !== color) continue;

        const moves = this.chessService.calculateLegalMoves(defender, board);
        if (moves[row][col] && moves[row][col].isLegal) {
          return true;
        }
      }
    }
    return false;
  }



  private evaluateKingSafety(board: (ChessPiece | null)[][]): number {
    let score = 0;
    for (const color of ['white', 'black'] as PieceColor[]) {
      let kingRow = -1;
      let kingCol = -1;
      for (let r = 0; r < 8; r++) {
        for (let c = 0; c < 8; c++) {
          const piece = board[r][c];
          if (piece && piece.type === 'king' && piece.color === color) {
            kingRow = r;
            kingCol = c;
            break;
          }
        }
        if (kingRow !== -1) break;
      }

      let kingProtection = 0;
      if (kingRow !== -1 && kingCol !== -1) {
        const direction = color === 'white' ? -1 : 1;
        for (let c = Math.max(0, kingCol - 1); c <= Math.min(7, kingCol + 1); c++) {
          const shieldRow = kingRow + direction;
          if (shieldRow >= 0 && shieldRow < 8) {
            const piece = board[shieldRow][c];
            if (piece && piece.type === 'pawn' && piece.color === color) {
              kingProtection += 5;
            }
          }
        }

        // Piece defenders
        const defenders = this.countDefenders(board, kingRow, kingCol, color);
        kingProtection += defenders * 5;
      }

      // Apply score
      score += color === 'white' ? kingProtection : -kingProtection;
    }
    return score;
  }

  private countDefenders(board: (ChessPiece | null)[][], kingRow: number, kingCol: number, color: PieceColor): number {
    let defenders = 0;
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const piece = board[r][c];
        if (piece && piece.color === color && piece.type !== 'king') {
          const moves = this.chessService.calculateLegalMoves(piece, board);
          if (moves[kingRow][kingCol] && moves[kingRow][kingCol].isLegal) {
            defenders++;
          }
        }
      }
    }
    return defenders;
  }

  private evaluateRooksOnOpenFiles(board: (ChessPiece | null)[][], pawnFiles: {
    white: number[],
    black: number[]
  }): number {
    let score = 0;

    for (let col = 0; col < 8; col++) {
      const isOpen = pawnFiles.white[col] === 0 && pawnFiles.black[col] === 0;
      const isSemiOpenWhite = pawnFiles.white[col] === 0 && pawnFiles.black[col] > 0;
      const isSemiOpenBlack = pawnFiles.black[col] === 0 && pawnFiles.white[col] > 0;

      for (let row = 0; row < 8; row++) {
        const piece = board[row][col];
        if (piece && piece.type === 'rook') {
          if (piece.color === 'white') {
            if (isOpen) {
              score += 20;
            } else if (isSemiOpenWhite) {
              score += 10;
            }
          } else {
            if (isOpen) {
              score -= 20;
            } else if (isSemiOpenBlack) {
              score -= 10;
            }
          }
        }
      }
    }

    return score;
  }

  private endgameAdjustments(board: (ChessPiece | null)[][], color: PieceColor): number {
    let score = 0;

    let whiteKing: { row: number, col: number } | null = null;
    let blackKing: { row: number, col: number } | null = null;

    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        const piece = board[row][col];
        if (piece && piece.type === 'king') {
          if (piece.color === 'white') {
            whiteKing = {row, col};
          } else {
            blackKing = {row, col};
          }
        }
      }
    }

    if (whiteKing && blackKing) {
      const whiteKingCentralization = 7 - Math.max(
        Math.abs(3.5 - whiteKing.row),
        Math.abs(3.5 - whiteKing.col)
      );

      const blackKingCentralization = 7 - Math.max(
        Math.abs(3.5 - blackKing.row),
        Math.abs(3.5 - blackKing.col)
      );

      score = (whiteKingCentralization - blackKingCentralization) * 10;
    }

    return score;
  }
}
