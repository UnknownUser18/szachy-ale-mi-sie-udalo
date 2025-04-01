import {forwardRef, Inject, Injectable} from '@angular/core';
import {ChessPiece, ChessService, MoveAttempt, PieceColor, Position} from './chess.service';
import {TimerService} from './timer.service';

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
  /**
 * Znajduje najlepszy ruch dla gracza AI.
 *
 * @method findBestMove
 * @param {(ChessPiece | null)[][]} board - Aktualna plansza
 * @param {number} depth - Maksymalna głębokość przeszukiwania
 * @param {PieceColor} color - Kolor gracza AI
 * @returns {MoveAttempt | null} Najlepszy ruch lub null, jeśli brak ruchów
 *
 * @description
 * Funkcja wykorzystuje algorytm minimax z optymalizacją alfa-beta, aby znaleźć
 * najlepszy możliwy ruch dla gracza AI. Uwzględnia ocenę planszy i legalność ruchów.
 *
 * @example
 * const bestMove = this.findBestMove(board, 3, 'white');
 */
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
      const currentGame = this.chessService.gameStart.value.type;
      const cGextra = this.chessService.gameStart.value;
      if(currentGame=='GraczVsGrandmaster'){
        if(this.timerService.currentTimer == "white"){
          this.timerService.currentTimer = "black";
        }else if(this.timerService.currentTimer == "black"){
          this.timerService.currentTimer = "white";
        }
          
      }
     
    }
   

    return bestMove;
  }
  /**
 * Ocena pozycji na planszy dla danego gracza.
 *
 * @method evaluatePosition
 * @param {(ChessPiece | null)[][]} board - Aktualna plansza
 * @param {PieceColor} color - Kolor gracza, dla którego oceniamy pozycję
 * @returns {number} Wynik oceny pozycji
 *
 * @description
 * Funkcja ocenia pozycję na planszy, uwzględniając wartość materiału, kontrolę centrum,
 * bezpieczeństwo króla i inne czynniki strategiczne.
 *
 * @example
 * const score = this.evaluatePosition(board, 'black');
 */
  public evaluatePosition(board: (ChessPiece | null)[][], color: PieceColor): number {
    if (!this.kingExists(board, 'white') || !this.kingExists(board, 'black')) {
      return color === 'white' ? -10000 : 10000;
    }
    const score = this.evaluateBoard(board, color);
    return color === 'white' ? score : -score;
  }
/**
 * Implementacja algorytmu minimax z optymalizacją alfa-beta.
 *
 * @method minimax
 * @param {(ChessPiece | null)[][]} board - Aktualna plansza
 * @param {number} depth - Pozostała głębokość przeszukiwania
 * @param {boolean} isMaximizingPlayer - Czy obecny gracz maksymalizuje wynik
 * @param {PieceColor} color - Kolor gracza, dla którego obliczamy wynik
 * @param {number} alpha - Wartość alfa dla optymalizacji alfa-beta
 * @param {number} beta - Wartość beta dla optymalizacji alfa-beta
 * @returns {number} Najlepszy wynik oceny planszy
 *
 * @description
 * Funkcja rekurencyjnie przeszukuje drzewo ruchów, aby znaleźć najlepszy wynik
 * dla gracza maksymalizującego lub minimalizującego. Wykorzystuje optymalizację
 * alfa-beta, aby ograniczyć liczbę przeszukiwanych gałęzi.
 *
 * @example
 * const score = this.minimax(board, 3, true, 'white', -Infinity, Infinity);
 */
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

/**
 * Sprawdza, czy król danego koloru istnieje na planszy.
 *
 * @method kingExists
 * @param {(ChessPiece | null)[][]} board - Aktualna plansza
 * @param {PieceColor} color - Kolor króla, którego szukamy
 * @returns {boolean} True, jeśli król istnieje, False w przeciwnym razie
 *
 * @description
 * Funkcja iteruje przez planszę, aby sprawdzić, czy król danego koloru
 * znajduje się na planszy. Używana do sprawdzania stanu gry.
 *
 * @example
 * const exists = this.kingExists(board, 'black');
 */
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
/**
 * Sprawdza, czy dany ruch jest poprawny.
 *
 * @method isValidMove
 * @param {MoveAttempt} move - Ruch do sprawdzenia
 * @param {(ChessPiece | null)[][]} board - Aktualna plansza
 * @returns {boolean} True, jeśli ruch jest poprawny, False w przeciwnym razie
 *
 * @description
 * Funkcja sprawdza, czy ruch jest poprawny, uwzględniając granice planszy
 * oraz obecność bierki na pozycji początkowej.
 *
 * @example
 * const valid = this.isValidMove(move, board);
 */
  private isValidMove(move: MoveAttempt, board: (ChessPiece | null)[][]): boolean {
    if (!move || !move.from || !move.to) return false;

    if (!this.isValidPosition(move.from) || !this.isValidPosition(move.to)) return false;

    return board[move.from.row][move.from.col] !== null;
  }


/**
 * Sprawdza, czy podana pozycja znajduje się w granicach szachownicy.
 *
 * @method isValidPosition
 * @param {Position} pos - Pozycja do sprawdzenia
 * @returns {boolean} True, jeśli pozycja jest poprawna, False w przeciwnym razie
 *
 * @example
 * const valid = this.isValidPosition({ row: 3, col: 4 }); // True
 */
  private isValidPosition(pos: Position): boolean {
    return pos.row >= 0 && pos.row < 8 && pos.col >= 0 && pos.col < 8;
  }
/**
 * Generuje unikalny klucz dla danej planszy, głębokości i stanu gry.
 *
 * @method generateBoardKey
 * @param {(ChessPiece | null)[][]} board - Aktualna plansza
 * @param {number} depth - Głębokość przeszukiwania
 * @param {boolean} isMaximizingPlayer - Czy obecny gracz maksymalizuje wynik
 * @param {PieceColor} currentColor - Kolor obecnego gracza
 * @returns {string} Unikalny klucz reprezentujący stan gry
 *
 * @example
 * const key = this.generateBoardKey(board, 3, true, 'white');
 */
  private generateBoardKey(
    board: (ChessPiece | null)[][],
    depth: number,
    isMaximizingPlayer: boolean,
    currentColor: PieceColor
  ): string {
    return JSON.stringify(board) + '_' + depth + '_' + isMaximizingPlayer + '_' + currentColor;
  }
/**
 * Ocena planszy na podstawie materiału i pozycji bierek.
 *
 * @method evaluateBoard
 * @param {(ChessPiece | null)[][]} board - Plansza do oceny
 * @param {PieceColor} color - Kolor gracza, dla którego oceniamy planszę
 * @returns {number} Wynik oceny planszy
 *
 * @description
 * Funkcja ocenia planszę, uwzględniając wartość materiału, pozycję bierek
 * oraz fazę gry (otwarcie, środek gry, końcówka).
 *
 * @example
 * const score = this.evaluateBoard(board, 'white');
 */
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
        positionalScore += this.endgameAdjustments(board);
      }
    }

    // Materiał ma większe znaczenie niż pozycja
    return materialScore + (positionalScore * 0.5);
  }
/**
 * Określa fazę gry na podstawie liczby bierek na planszy.
 *
 * @method determineGamePhase
 * @param {(ChessPiece | null)[][]} board - Aktualna plansza
 * @returns {'opening' | 'middlegame' | 'endgame'} Faza gry
 *
 * @description
 * Funkcja analizuje liczbę bierek na planszy i określa, czy gra jest w fazie otwarcia,
 * środkowej gry czy końcówki. Wykorzystywana do dynamicznej oceny planszy.
 *
 * @example
 * const phase = this.determineGamePhase(board);
 */
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
/**
 * Oblicza wartość pozycyjną bierki na podstawie jej typu i pozycji.
 *
 * @method getPositionalValue
 * @param {ChessPiece} piece - Bierka, dla której obliczamy wartość pozycyjną
 * @returns {number} Wartość pozycyjna bierki
 *
 * @description
 * Funkcja zwraca wartość pozycyjną bierki na podstawie predefiniowanych tabel
 * pozycyjnych, które uwzględniają fazę gry i strategiczne znaczenie pozycji.
 *
 * @example
 * const value = this.getPositionalValue(piece);
 */
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
/**
 * Sprawdza, czy bierka została rozwinięta (czy opuściła swoją początkową pozycję).
 *
 * @method isPieceDeveloped
 * @param {ChessPiece} piece - Bierka, którą sprawdzamy
 * @returns {boolean} True, jeśli bierka została rozwinięta, False w przeciwnym razie
 *
 * @description
 * Funkcja sprawdza, czy bierka opuściła swoją początkową pozycję, co jest
 * istotne w ocenie fazy otwarcia i rozwoju bierek.
 *
 * @example
 * const developed = this.isPieceDeveloped(piece);
 */
  private isPieceDeveloped(piece: ChessPiece, row: number, col: number, color: PieceColor): boolean {
    if (color === 'white') {
      if (piece.type === 'knight' && row < 6) return true;
      if (piece.type === 'bishop' && row < 6) return true;
      return piece.type === 'rook' && row === 7 && (col === 3 || col === 4);

    } else {
      if (piece.type === 'knight' && row > 1) return true;
      if (piece.type === 'bishop' && row > 1) return true;
      return piece.type === 'rook' && row === 0 && (col === 3 || col === 4);

    }
  }
/**
 * Ocena kontroli centrum planszy przez daną bierkę.
 *
 * @method evaluateCenterControl
 * @param {ChessPiece} piece - Bierka, którą oceniamy
 * @param {(ChessPiece | null)[][]} board - Aktualna plansza
 * @returns {number} Liczba pól w centrum kontrolowanych przez bierkę
 *
 * @description
 * Funkcja analizuje ruchy bierki i sprawdza, ile pól w centrum planszy
 * jest przez nią kontrolowanych. Używana w ocenie strategicznej pozycji.
 *
 * @example
 * const control = this.evaluateCenterControl(piece, board);
 */
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
/**
 * Ocena możliwości wykonania roszady przez gracza.
 *
 * @method evaluateCastlingOpportunities
 * @param {(ChessPiece | null)[][]} board - Aktualna plansza
 * @returns {number} Wynik oceny możliwości roszady
 *
 * @description
 * Funkcja analizuje, czy król i wieże obu graczy znajdują się w swoich
 * początkowych pozycjach, co pozwala na wykonanie roszady. Dodaje punkty
 * za możliwość wykonania krótkiej lub długiej roszady.
 *
 * @example
 * const castlingScore = this.evaluateCastlingOpportunities(board);
 */
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
/**
 * Sprawdza, czy bierka znajduje się na swojej początkowej pozycji.
 *
 * @method isPieceInOriginalPosition
 * @param {(ChessPiece | null)[][]} board - Aktualna plansza
 * @param {number} row - Wiersz początkowej pozycji
 * @param {number} col - Kolumna początkowej pozycji
 * @param {PieceType} type - Typ bierki
 * @param {PieceColor} color - Kolor bierki
 * @returns {boolean} True, jeśli bierka znajduje się na swojej początkowej pozycji, False w przeciwnym razie
 *
 * @description
 * Funkcja sprawdza, czy bierka danego typu i koloru znajduje się na swojej
 * początkowej pozycji na planszy.
 *
 * @example
 * const isOriginal = this.isPieceInOriginalPosition(board, 7, 4, 'king', 'white');
 */
  private isPieceInOriginalPosition(board: (ChessPiece | null)[][], row: number, col: number, type: string, color: PieceColor): boolean {
    const piece = board[row][col];
    return !!piece && piece.type === type && piece.color === color;
  }
/**
 * Nakłada karę za zbyt wczesne ruchy królową w fazie otwarcia.
 *
 * @method penalizeEarlyQueenMoves
 * @param {number} queenMoves - Liczba ruchów królową
 * @returns {number} Kara za wczesne ruchy królową
 *
 * @description
 * Funkcja nakłada karę punktową za zbyt wczesne ruchy królową w fazie otwarcia,
 * co może prowadzić do utraty tempa i narażenia królowej na ataki.
 *
 * @example
 * const penalty = this.penalizeEarlyQueenMoves(2);
 */
  private penalizeEarlyQueenMoves(board: (ChessPiece | null)[][]): number {
    let score = 0;

    const whiteQueenMoved = !this.isPieceInOriginalPosition(board, 7, 3, 'queen', 'white');
    if (whiteQueenMoved) score -= 20;

    const blackQueenMoved = !this.isPieceInOriginalPosition(board, 0, 3, 'queen', 'black');
    if (blackQueenMoved) score += 20;

    return score;
  }
/**
 * Sprawdza, czy dane pole jest bronione przez bierki danego koloru.
 *
 * @method isSquareDefended
 * @param {(ChessPiece | null)[][]} board - Aktualna plansza
 * @param {number} row - Wiersz pola
 * @param {number} col - Kolumna pola
 * @param {PieceColor} color - Kolor bierek broniących
 * @returns {boolean} True, jeśli pole jest bronione, False w przeciwnym razie
 *
 * @description
 * Funkcja analizuje ruchy bierek danego koloru i sprawdza, czy pole jest bronione.
 *
 * @example
 * const defended = this.isSquareDefended(board, 4, 4, 'white');
 */
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
/**
 * Buduje mapę ataków przeciwnika na podstawie aktualnej planszy.
 *
 * @method buildEnemyAttackMap
 * @param {(ChessPiece | null)[][]} board - Aktualna plansza
 * @param {PieceColor} color - Kolor gracza, dla którego budujemy mapę ataków przeciwnika
 * @returns {boolean[][]} Dwuwymiarowa tablica reprezentująca pola atakowane przez przeciwnika
 *
 * @description
 * Funkcja analizuje ruchy przeciwnika i zwraca mapę pól, które są atakowane.
 * Używana do oceny bezpieczeństwa króla i innych bierek.
 *
 * @example
 * const attackMap = this.buildEnemyAttackMap(board, 'white');
 */
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
/**
 * Ocena bezpieczeństwa króla na podstawie otoczenia i ataków przeciwnika.
 *
 * @method evaluateKingSafety
 * @param {(ChessPiece | null)[][]} board - Aktualna plansza
 * @param {PieceColor} color - Kolor króla, którego bezpieczeństwo oceniamy
 * @returns {number} Wynik oceny bezpieczeństwa króla
 *
 * @description
 * Funkcja analizuje otoczenie króla, liczbę obrońców oraz potencjalne ataki
 * przeciwnika, aby ocenić bezpieczeństwo króla.
 *
 * @example
 * const safetyScore = this.evaluateKingSafety(board, 'black');
 */
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
/**
 * Liczy liczbę bierek broniących króla danego koloru.
 *
 * @method countDefenders
 * @param {(ChessPiece | null)[][]} board - Aktualna plansza
 * @param {number} kingRow - Wiersz, w którym znajduje się król
 * @param {number} kingCol - Kolumna, w której znajduje się król
 * @param {PieceColor} color - Kolor króla
 * @returns {number} Liczba bierek broniących króla
 *
 * @description
 * Funkcja iteruje przez planszę i liczy bierki danego koloru, które bronią
 * pola zajmowanego przez króla.
 *
 * @example
 * const defenders = this.countDefenders(board, 7, 4, 'white');
 */
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
/**
 * Ocena pozycji wież na otwartych i półotwartych liniach.
 *
 * @method evaluateRooksOnOpenFiles
 * @param {(ChessPiece | null)[][]} board - Aktualna plansza
 * @param {object} pawnFiles - Obiekt zawierający informacje o pionach na liniach
 * @param {number[]} pawnFiles.white - Liczba białych pionów na każdej kolumnie
 * @param {number[]} pawnFiles.black - Liczba czarnych pionów na każdej kolumnie
 * @returns {number} Wynik oceny pozycji wież
 *
 * @description
 * Funkcja analizuje pozycje wież na planszy i przyznaje punkty za obecność
 * na otwartych lub półotwartych liniach, co zwiększa ich aktywność.
 *
 * @example
 * const rookScore = this.evaluateRooksOnOpenFiles(board, { white: [0, 1, 0, 0, 0, 0, 0, 0], black: [0, 0, 0, 0, 0, 0, 1, 0] });
 */
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
/**
 * Dostosowuje ocenę planszy w końcowej fazie gry.
 *
 * @method endGameAdjustments
 * @param {number} score - Aktualny wynik oceny planszy
 * @param {(ChessPiece | null)[][]} board - Aktualna plansza
 * @param {PieceColor} color - Kolor gracza, dla którego dokonujemy dostosowania
 * @returns {number} Zaktualizowany wynik oceny planszy
 *
 * @description
 * Funkcja wprowadza poprawki do oceny planszy w końcowej fazie gry, uwzględniając
 * takie czynniki jak aktywność króla i pozycje pionów.
 *
 * @example
 * const adjustedScore = this.endGameAdjustments(score, board, 'black');
 */
  private endgameAdjustments(board: (ChessPiece | null)[][]): number {
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
/**
 * Oblicza premię za mobilność bierek.
 *
 * @method calculateMobilityBonus
 * @param {ChessPiece} piece - Bierka, dla której obliczamy premię
 * @param {legalMove[][]} moves - Lista możliwych ruchów bierki
 * @returns {number} Premia za mobilność
 *
 * @description
 * Funkcja przyznaje punkty za liczbę możliwych ruchów bierki, co odzwierciedla
 * jej aktywność i potencjał strategiczny.
 *
 * @example
 * const mobilityBonus = this.calculateMobilityBonus(piece, moves);
 */
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
  /**
 * Generuje wszystkie legalne ruchy dla danego gracza.
 *
 * @method getAllLegalMoves
 * @param {(ChessPiece | null)[][]} board - Aktualna plansza
 * @param {PieceColor} color - Kolor gracza, dla którego generujemy ruchy
 * @returns {MoveAttempt[]} Lista wszystkich legalnych ruchów
 *
 * @description
 * Funkcja iteruje przez wszystkie bierki gracza i generuje listę legalnych ruchów,
 * uwzględniając zasady gry w szachy.
 *
 * @example
 * const legalMoves = this.getAllLegalMoves(board, 'white');
 */
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
/**
 * Symuluje wykonanie ruchu na planszy i zwraca nowy stan planszy.
 *
 * @method simulateMove
 * @param {Position} from - Pozycja początkowa ruchu
 * @param {Position} to - Pozycja docelowa ruchu
 * @param {(ChessPiece | null)[][]} board - Aktualna plansza
 * @returns {(ChessPiece | null)[][]} Nowa plansza po wykonaniu ruchu
 *
 * @description
 * Funkcja symuluje wykonanie ruchu na planszy, aktualizując pozycje bierek
 * oraz inne parametry gry. Nie modyfikuje oryginalnej planszy.
 *
 * @example
 * const newBoard = this.simulateMove({ row: 1, col: 0 }, { row: 3, col: 0 }, board);
 */
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
    if(currentGame=='GraczVsAi'){
      this.timerService.currentTimer = "white";
    }else if(currentGame=='GraczVsGrandmaster'){

      this.timerService.switchTimer()

    }

    // this.timerService.currentTimer = this.timerService.currentTimer === 'white' ? 'black' : 'white';
    return newBoard;
  }
}
