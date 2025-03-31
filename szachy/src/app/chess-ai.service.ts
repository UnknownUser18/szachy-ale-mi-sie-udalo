import { Injectable, forwardRef, Inject } from '@angular/core';
import {ChessService, ChessPiece, MoveAttempt, PieceColor, Position} from './chess.service';
import { NotationComponent } from './notation/notation.component';
import { TimerService } from './timer.service';
import { Game } from './szachownica/szachownica.component';

@Injectable({
  providedIn: 'root'
})
export class ChessAiService {
  constructor(
    @Inject(forwardRef(() => ChessService))
    private chessService: ChessService,
    public timerService: TimerService

  ) {}

  private memo: Map<string, number> = new Map();
  public findBestMove(color: PieceColor, depth: number): MoveAttempt | null {
    this.memo.clear();
    const board = this.chessService.copyChessBoard(this.chessService.board);
    const legalMoves = this.getAllLegalMoves(board, color);

    if (legalMoves.length === 0) {
      console.warn('Brak legalnych ruchów.');
      return null;
    }

    let bestMove: MoveAttempt | null = null;
    let bestScore = -Infinity; // Szukamy najlepszego ruchu (maksymalizacja)

    for (const move of legalMoves) {
      // Sprawdź czy ruch jest poprawny
      if (!this.isValidMove(move, board)) continue;

      const newBoard = this.simulateMove(move.from, move.to, board);

      // Sprawdź czy królowie istnieją po symulacji
      if (!this.kingExists(newBoard, 'white') || !this.kingExists(newBoard, 'black')) {
        continue;
      }

      const moveScore = this.minimax(
        newBoard,
        depth - 1,
        -Infinity,
        Infinity,
        false,
        color === 'white' ? 'black' : 'white'
      );

      if (moveScore > bestScore) {
        bestScore = moveScore;
        bestMove = move;
      }
    }

    if (bestMove) {
      this.chessService.aiMoveExecuted.emit({
        from: { row: bestMove.from.row, col: bestMove.from.col },
        to: { row: bestMove.to.row, col: bestMove.to.col },
        color: color
      });
    }

    return bestMove;
  }
  public evaluatePosition(board: (ChessPiece | null)[][], color: PieceColor): number {
    if (!this.kingExists(board, 'white') || !this.kingExists(board, 'black')) {
      return color === 'white' ? -10000 : 10000;
    }
    const score = this.evaluateBoard(board, color);
    return color === 'white' ? score : -score;
  }

  private minimax(
    board: (ChessPiece | null)[][],
    depth: number,
    alpha: number,
    beta: number,
    isMaximizingPlayer: boolean,
    currentColor: PieceColor
  ): number {
    const key = this.generateBoardKey(board, depth, isMaximizingPlayer, currentColor);
    if (this.memo.has(key)) {
      return this.memo.get(key)!;
    }

    // Sprawdź czy obaj królowie są na szachownicy
    if (!this.kingExists(board, 'white') || !this.kingExists(board, 'black')) {
      return isMaximizingPlayer ? -Infinity : Infinity;  // Niedozwolona pozycja
    }

    if (depth === 0) {
      const evalScore = this.evaluatePosition(board, currentColor);
      this.memo.set(key, evalScore);
      return evalScore;
    }


    const legalMoves = this.getAllLegalMoves(board, currentColor);
    if (legalMoves.length === 0) {
      const evalScore = this.evaluatePosition(board, currentColor);
      this.memo.set(key, evalScore);
      return evalScore;
    }

    const nextColor = currentColor === 'white' ? 'black' : 'white';
    let bestValue = isMaximizingPlayer ? -Infinity : Infinity;

    for (const move of legalMoves) {
      if (!this.isValidMove(move, board)) continue;

      const newBoard = this.simulateMove(move.from, move.to, board);

      if (!this.kingExists(newBoard, 'white') || !this.kingExists(newBoard, 'black')) {
        continue;
      }

      const evalScore = this.minimax(newBoard, depth - 1, alpha, beta, !isMaximizingPlayer, nextColor);

      if (isMaximizingPlayer) {
        bestValue = Math.max(bestValue, evalScore);
        alpha = Math.max(alpha, evalScore);
      } else {
        bestValue = Math.min(bestValue, evalScore);
        beta = Math.min(beta, evalScore);
      }

      if (beta <= alpha) break;
    }

    this.memo.set(key, bestValue);
    return bestValue;
  }
  private kingExists(board: (ChessPiece | null)[][], color: PieceColor): boolean {
    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        const piece = board[row][col];
        if (piece?.type === 'king' && piece.color === color) {
          return true;
        }
      }
    }
    return false;
  }

  private isValidMove(move: MoveAttempt, board: (ChessPiece | null)[][]): boolean {
    if (!move || !move.from || !move.to) return false;

    if (!this.isValidPosition(move.from) || !this.isValidPosition(move.to)) return false;

    const piece = board[move.from.row][move.from.col];
    if (!piece) return false;

    return true;
  }



  private isValidPosition(pos: Position): boolean {
    return pos.row >= 0 && pos.row < 8 && pos.col >= 0 && pos.col < 8;
  }

  private generateBoardKey(
    board: (ChessPiece | null)[][],
    depth: number,
    isMaximizingPlayer: boolean,
    currentColor: PieceColor
  ): string {
    return JSON.stringify(board) + '_' + depth + '_' + isMaximizingPlayer + '_' + currentColor;
  }

  private evaluateBoard(board: (ChessPiece | null)[][], color: PieceColor): number {
    let materialScore = 0;
    let positionalScore = 0;

    const gamePhase = this.determineGamePhase(board);

    let whiteDevelopedPieces = 0;
    let blackDevelopedPieces = 0;
    let whiteCenterControl = 0;
    let blackCenterControl = 0;

    const enemyAttackMap = this.buildEnemyAttackMap(board, color);

    const pawnFiles = { white: Array(8).fill(0), black: Array(8).fill(0) };
    const pawnCounts = { white: 0, black: 0 };

    const pieceValues = {
      pawn: 100,
      knight: 320,
      bishop: 330,
      rook: 500,
      queen: 900,
      king: 20000
    };

    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        const piece = board[row][col];
        if (!piece) continue;

        if (piece.type === 'pawn') {
          pawnFiles[piece.color][col]++;
          pawnCounts[piece.color]++;
        }

        // Uwzględnij wartość materialną
        const materialValue = pieceValues[piece.type];
        const factor = piece.color === 'white' ? 1 : -1;
        materialScore += materialValue * factor;

        // Uwzględnij wartości pozycyjne
        let posValue = this.getPositionalValue(piece, row, col, gamePhase);

        if (gamePhase === 'opening') {
          if (piece.color === 'white' && this.isPieceDeveloped(piece, row, col, 'white')) {
            whiteDevelopedPieces++;
          } else if (piece.color === 'black' && this.isPieceDeveloped(piece, row, col, 'black')) {
            blackDevelopedPieces++;
          }
        }

        if (piece.color === 'white') {
          whiteCenterControl += this.evaluateCenterControl(piece, board, row, col);
        } else {
          blackCenterControl += this.evaluateCenterControl(piece, board, row, col);
        }

        let safetyPenalty = 0;
        if (enemyAttackMap[row][col]) {
          if (!this.isSquareDefended(board, row, col, piece.color)) {
            // Duża kara za niezabezpieczone figury
            if (piece.type === 'queen') {
              safetyPenalty = 400; // Dodatkowa kara za niezabezpieczonego hetmana
            } else if (piece.type === 'rook') {
              safetyPenalty = 150;
            } else if (piece.type === 'bishop' || piece.type === 'knight') {
              safetyPenalty = 100;
            } else if (piece.type === 'pawn') {
              safetyPenalty = 30;
            }
          }
        }

        const mobilityBonus = this.calculateMobilityBonus(board, piece, gamePhase);
        const totalPositionalValue = posValue - safetyPenalty + mobilityBonus;
        positionalScore += totalPositionalValue * factor;
      }
    }

    // Dodatkowe oceny dla różnych faz gry
    if (gamePhase === 'opening') {
      positionalScore += (whiteDevelopedPieces - blackDevelopedPieces) * 15;
      positionalScore += (whiteCenterControl - blackCenterControl) * 20;
      positionalScore += this.evaluateCastlingOpportunities(board);
      positionalScore += this.penalizeEarlyQueenMoves(board);
    }

    if (gamePhase === 'middlegame') {
      positionalScore += this.evaluateKingSafety(board);
      positionalScore += this.evaluateRooksOnOpenFiles(board, pawnFiles);
    }

    if (gamePhase === 'endgame') {
      if (pawnCounts.white + pawnCounts.black < 8) {
        positionalScore += this.endgameAdjustments(board, color);
      }
    }

    // Materiał ma większe znaczenie niż pozycja
    return materialScore + (positionalScore * 0.5);
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
    const positionalValues: { [key: string]: { [key: string]: number[][] } } = {
      'opening': {
        'pawn': [
          [0, 0, 0, 0, 0, 0, 0, 0],
          [50, 50, 50, 50, 50, 50, 50, 50],
          [10, 10, 20, 30, 30, 20, 10, 10],
          [5, 5, 10, 35, 35, 10, 5, 5],
          [0, 0, 0, 25, 25, 0, 0, 0],
          [5, -5, -10, 0, 0, -10, -5, 5],
          [5, 10, 10, -20, -20, 10, 10, 5],
          [0, 0, 0, 0, 0, 0, 0, 0]
        ],
        'knight': [
          [-50, -40, -30, -30, -30, -30, -40, -50],
          [-40, -20, 0, 5, 5, 0, -20, -40],
          [-30, 5, 15, 15, 15, 15, 5, -30],
          [-30, 0, 15, 20, 20, 15, 0, -30],
          [-30, 0, 15, 20, 20, 15, 0, -30],
          [-30, 5, 15, 15, 15, 15, 5, -30],
          [-40, -20, 0, 0, 0, 0, -20, -40],
          [-50, -40, -30, -30, -30, -30, -40, -50]
        ],
        'bishop': [
          [-20, -10, -10, -10, -10, -10, -10, -20],
          [-10, 5, 0, 0, 0, 0, 5, -10],
          [-10, 10, 10, 10, 10, 10, 10, -10],
          [-10, 0, 10, 15, 15, 10, 0, -10],
          [-10, 5, 5, 15, 15, 5, 5, -10],
          [-10, 0, 10, 10, 10, 10, 0, -10],
          [-10, 0, 0, 0, 0, 0, 0, -10],
          [-20, -10, -10, -10, -10, -10, -10, -20]
        ],
        'rook': [
          [0, 0, 0, 0, 0, 0, 0, 0],
          [5, 10, 10, 10, 10, 10, 10, 5],
          [-5, 0, 0, 0, 0, 0, 0, -5],
          [-5, 0, 0, 0, 0, 0, 0, -5],
          [-5, 0, 0, 0, 0, 0, 0, -5],
          [-5, 0, 0, 0, 0, 0, 0, -5],
          [-5, 0, 0, 0, 0, 0, 0, -5],
          [0, 0, 0, 5, 5, 0, 0, 0]
        ],
        'queen': [
          [-20, -10, -10, -5, -5, -10, -10, -20],
          [-10, 0, 0, 0, 0, 0, 0, -10],
          [-10, 0, 5, 5, 5, 5, 0, -10],
          [-5, 0, 5, 5, 5, 5, 0, -5],
          [0, 0, 5, 5, 5, 5, 0, -5],
          [-10, 5, 5, 5, 5, 5, 0, -10],
          [-10, 0, 5, 0, 0, 0, 0, -10],
          [-20, -10, -10, -5, -5, -10, -10, -20]
        ],
        'king': [
          [-30, -40, -40, -50, -50, -40, -40, -30],
          [-30, -40, -40, -50, -50, -40, -40, -30],
          [-30, -40, -40, -50, -50, -40, -40, -30],
          [-30, -40, -40, -50, -50, -40, -40, -30],
          [-20, -30, -30, -40, -40, -30, -30, -20],
          [-10, -20, -20, -20, -20, -20, -20, -10],
          [20, 20, 0, 0, 0, 0, 20, 20],
          [20, 30, 10, 0, 0, 10, 30, 20]
        ]
      },
      'middlegame': {
        'pawn': [
          [0, 0, 0, 0, 0, 0, 0, 0],
          [5, 10, 10, -20, -20, 10, 10, 5],
          [5, -5, -10, 0, 0, -10, -5, 5],
          [0, 0, 0, 25, 25, 0, 0, 0],
          [5, 5, 10, 35, 35, 10, 5, 5],
          [10, 10, 20, 30, 30, 20, 10, 10],
          [50, 50, 50, 50, 50, 50, 50, 50],
          [0, 0, 0, 0, 0, 0, 0, 0]
        ],
      },
      'endgame': {
        'pawn': [
          [0, 0, 0, 0, 0, 0, 0, 0],
          [5, 10, 10, 20, 20, 10, 10, 5],
          [5, -5, -10, 0, 0, -10, -5, 5],
          [0, 0, 0, 25, 25, 0, 0, 0],
          [5, 5, 10, 35, 35, 10, 5, 5],
          [10, 10, 20, 30, 30, 20, 10, 10],
          [50, 50, 50, 50, 50, 50, 50, 50],
          [0, 0, 0, 0, 0, 0, 0, 0]
        ]
      }
    };

    return positionalValues[gamePhase]?.[piece.type]?.[r]?.[col] || 0;
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

  private buildEnemyAttackMap(board: (ChessPiece | null)[][], color: PieceColor): boolean[][] {
    const attackMap: boolean[][] = Array(8).fill(0).map(() => Array(8).fill(false));
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

  private evaluateRooksOnOpenFiles(board: (ChessPiece | null)[][], pawnFiles: { white: number[], black: number[] }): number {
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

    let whiteKing: {row: number, col: number} | null = null;
    let blackKing: {row: number, col: number} | null = null;

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
    const currentGame = this.chessService.gameStart.value.type;
    if(currentGame!='GraczVsGracz'){
      this.timerService.currentTimer = "white";
    }

    // this.timerService.currentTimer = this.timerService.currentTimer === 'white' ? 'black' : 'white';
    return newBoard;
  }
}
