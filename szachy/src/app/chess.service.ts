import {EventEmitter,Injectable} from '@angular/core';
import {PawnPromotionComponent} from './pawn-promotion/pawn-promotion.component';
import {MatDialog} from '@angular/material/dialog';
import {BehaviorSubject, Subject} from 'rxjs';
import {ChessAiService} from './chess-ai.service';
import {Game} from './szachownica/szachownica.component';
import {GameEndDialogComponent} from './game-end-dialog/game-end-dialog.component';
import {AudioHandlerService} from './audio-handler.service';

/**
 * Reprezentuje typ figury szachowej.
 *
 * @description
 * Typ wyróżniający każdy typ bierki występujący w standardowych szachach:
 * - `pawn`   : Pionek
 * - `rook`   : Wieża
 * - `knight` : Skoczek
 * - `bishop` : Goniec
 * - `queen`  : Królowa
 * - `king`   : Król
 *
 * @example
 * const figure: PieceType = 'queen';
 *
 */
export type PieceType = 'pawn' | 'rook' | 'knight' | 'bishop' | 'queen' | 'king';

/**
 * Reprezentuje kolor figury szachowej.
 *
 * @description
 * Typ wyróżniający kolory graczy:
 * - `white` : Białe figury
 * - `black` : Czarne figury
 *
 * @example
 * const playerColor: PieceColor = 'white';
 *
 */
export type PieceColor = 'white' | 'black';

/**
 * Reprezentuje specjalne ruchy w grze w szachy.
 *
 * @description
 * Specjalne mechaniki ruchów:
 * - `enpassant` : Bicie w przelocie (tylko dla pionów)
 * - `O-O`       : Krótka roszada
 * - `O-O-O`     : Długa roszada
 *
 * @example
 * const special: SpecialMove = 'O-O';
 *
 */
export type SpecialMove = 'enpassant' | 'O-O' | 'O-O-O';

/**
 * Możliwe stany zakończenia gry.
 *
 * @description
 * Typ określający zakończenie partii:
 * - `none`            : Gra trwa
 * - `check`           : Szach
 * - `mate`            : Mat
 * - `stalemate`       : Pat
 * - `draw-repetition` : Remis przez powtórzenie pozycji
 * - `draw-50-moves`   : Remis przez regułę 50 posunięć
 *
 * @example
 * const gameStatus: GameEndType = 'mate';
 *
 */
export type GameEndType = 'none' | 'check' | 'mate' | 'stalemate' | 'draw-repetition' | 'draw-50-moves';

/**
 * Interfejs opisujący legalny ruch.
 *
 * @interface legalMove
 *
 * @property {boolean} isLegal - Czy ruch jest dozwolony przez zasady gry
 * @property {SpecialMove} [special] - Opcjonalny specyficzny typ ruchu
 *
 * @description
 * Używany do walidacji i wykonywania ruchów, zawiera dodatkowe
 * informacje o specjalnych mechanikach.
 *
 * @example
 * const move: legalMove = {
 *   isLegal: true,
 *   special: 'enpassant'
 * };
 *
 */
export interface legalMove {
  isLegal: boolean;
  special?: SpecialMove;
}

/**
 * Reprezentuje pozycję na szachownicy.
 *
 * @interface Position
 *
 * @property {number} row - Wiersz (0-7), gdzie 0 = pierwszy rząd w notacji algebraicznej
 * @property {number} col - Kolumna (0-7), gdzie 0 = kolumna 'a', 7 = kolumna 'h'
 *
 * @description
 * System współrzędnych dla 8x8 szachownicy.
 *
 * @example
 * const kingPosition: Position = { row: 0, col: 4 }; // Początkowa pozycja czarnego króla
 *
 */
export interface Position {
  row: number;
  col: number;
}

/**
 * Reprezentuje próbę wykonania ruchu.
 *
 * @interface MoveAttempt
 *
 * @property {Position} from - Pozycja początkowa
 * @property {Position} to - Pozycja docelowa
 *
 * @description
 * Używany do przesyłania informacji o próbach ruchu między komponentami.
 *
 * @example
 * const attempt: MoveAttempt = {
 *   from: { row: 1, col: 0 },
 *   to: { row: 3, col: 0 }
 * };
 *
 */
export interface MoveAttempt {
  from: Position;
  to: Position;
}

/**
 * Atrybuty potrzebne do wykonania roszady.
 *
 * @interface CastleAtributes
 *
 * @property {number} col - Kolumna wieży uczestniczącej w roszadzie
 * @property {number} deltaCol - Przesunięcie króla w poziomie
 * @property {SpecialMove} special - Typ roszady (krótka/długa)
 *
 * @description
 * Parametry potrzebne do prawidłowego wykonania ruchu roszady.
 *
 * @example
 * const castle: CastleAtributes = {
 *   col: 7,
 *   deltaCol: -2,
 *   special: 'O-O'
 * };
 *
 */
export interface CastleAtributes {
  col: number;
  deltaCol: number;
  special: SpecialMove;
}

/**
 * Pełna reprezentacja bierki szachowej.
 *
 * @interface ChessPiece
 *
 * @property {PieceType} type - Typ figury
 * @property {PieceColor} color - Kolor figury
 * @property {Position} position - Aktualna pozycja
 * @property {Position} lastPosition - Poprzednia pozycja
 * @property {boolean} [hasMoved] - Czy figura była poruszana
 * @property {boolean} [moveTurn] - Czy figura była poruszona w ostatniej turze
 *
 * @description
 * Kompletny obiekt zawierający wszystkie informacje o stanie bierki.
 *
 * @example
 * const pawn: ChessPiece = {
 *   type: 'pawn',
 *   color: 'white',
 *   position: { row: 1, col: 0 },
 *   lastPosition: { row: 1, col: 0 },
 *   hasMoved: false
 * };
 *
 */
export interface ChessPiece {
  type: PieceType;
  color: PieceColor;
  position: Position;
  lastPosition: Position;
  hasMoved?: boolean;
  moveTurn?: boolean;
}

/**
 * Uproszczona reprezentacja bierki szachowej.
 *
 * @interface LowEffortChessPiece
 *
 * @property {PieceType} type - Typ figury
 * @property {PieceColor} color - Kolor figury
 * @property {Position} position - Aktualna pozycja
 *
 * @description
 * Minimalistyczna wersja ChessPiece bez historii ruchów.
 * Używana w przypadkach wymagających optymalizacji.
 *
 * @example
 * const simplePiece: LowEffortChessPiece = {
 *   type: 'rook',
 *   color: 'black',
 *   position: { row: 0, col: 0 }
 * };
 *
 */
export interface LowEffortChessPiece {
  type: PieceType;
  color: PieceColor;
  position: Position;
}

@Injectable({
  providedIn: 'root'
})
export class ChessService {
  public board: (ChessPiece | null)[][] = []; // Initialize the board as needed
  public previousBoard: (ChessPiece | null)[][] = [];
  public canUndo: boolean = false;
  private chessAiService: any;
  public lowEffortBoards: (LowEffortChessPiece | null)[][][] = [];
  public updateBoard = new Subject<(ChessPiece | null)[][]>()
  public updateGameEnd = new Subject<GameEndType>()
  public currentTurnColor = new BehaviorSubject<PieceColor>('white');
  public gameEnd = new Subject<GameEndType>()
  public gameStart = new BehaviorSubject<Game>({type: 'GraczVsGracz', duration: 0})
  public gameClose = new EventEmitter<void>();
  public undoMoveSubject = new Subject();
  public pawnPromotionSubject = new Subject<{position: Position, type: PieceType}>();
  public currentSpecialForNotationOnly: string = '';
  public aiMoveExecuted = new EventEmitter<{
    from: { row: number; col: number },
    to: { row: number; col: number },
    color: PieceColor
  }>();
  public pawnPromoted = new EventEmitter<{
    position: Position;
    promotedTo: PieceType;
    color: PieceColor;
  }>();

  /**
   * Inicjalizuje serwis
   * @constructor
   * @param {MatDialog} dialog - Serwis dialogowy Angular Material
   * @param {AudioHandlerService} AudioService - Handler odtwarzania dźwięków
   */
  constructor(private dialog: MatDialog, private AudioService: AudioHandlerService) {
    this.gameEnd.subscribe((gameEnd: GameEndType) => this.showGameEnding(gameEnd))
    this.initializeChessBoard();
  }

  /**
   * @method setAiService
   * @description Ustawia ChessAiService z podanej instacji
   * @param {ChessAiService} aiService - Podana instancja ChessAiService
   * @returns {void}
   */
  public setAiService(aiService: ChessAiService): void {
    this.chessAiService = aiService;
  }

  /**
   * @method findKing
   * @description Próbuje znaleźć króla podanego koloru
   * @param {PieceColor} color - Kolor, dla którego metoda próbuje znaleźć króla
   * @returns {Position} Pozycja znalezionego króla
   * @throws {Error} Jeśli nie znaleziono króla
   */
  private findKing(color: PieceColor): Position {
    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        const piece = this.board[row][col];
        if (piece?.type === 'king' && piece.color === color) {
          return { row, col };
        }
      }
    }
    throw new Error('King not found');
  }


  /**
   * @method initializeChessBoard
   * @description Inicjalizuje szachownicę - Ustawia standardową pozycję z wszystkimi bierkami
   * @returns {void}
   * @example
   * this.initializeChessBoard()
   */
  initializeChessBoard(): void {
    // Wynulowanie szachownicy
    this.board = Array.from({ length: 8 }, () => Array(8).fill(null));
    this.canUndo = false;

    // Ustawienie Pionków na szachownicy
    for (let col = 0; col < 8; col++) {
      this.board[1][col] = { type: 'pawn', color: 'white', position: { row: 1, col }, lastPosition: { row: 0, col: 0 }, moveTurn: false, hasMoved: false };
      this.board[6][col] = { type: 'pawn', color: 'black', position: { row: 6, col }, lastPosition: { row: 0, col: 0 }, moveTurn: false, hasMoved: false };
    }

    // Ustawienie pozostałych bierek na szachownicy
    const orderOfPieces: PieceType[] = ['rook', 'knight', 'bishop', 'queen', 'king', 'bishop', 'knight', 'rook'];
    for(let col = 0; col < 8; col++) {
      this.board[0][col] = {type: orderOfPieces[col], color: 'white', position: { row: 0, col }, lastPosition: { row: 0, col: 0 }, moveTurn: false, hasMoved: false };
      this.board[7][col] = {type: orderOfPieces[col], color: 'black', position: { row: 7, col }, lastPosition: { row: 0, col: 0 }, moveTurn: false, hasMoved: false };
    }

    console.log(this.board);
    this.previousBoard = this.copyChessBoard(this.board);
    this.lowEffortBoards.push(this.copyChessBoardLowEffort(this.board))
    console.log(this.lowEffortBoards)
    // Pokazanie w konsoli ustawienia szachownicy
  }

  /**
   * @method getPiece
   * @description Zwraca bierkę znajdującą się na pozycji (row, col)
   * @param {number} row - Wiersz, na którym znajduje się docelowa bierka
   * @param {number} col - Kolumna, na którym znajduje się docelowa bierka
   * @returns {ChessPiece | null} Potencjalna bierka na podanej pozycji
   */
  public getPiece(row: number, col: number): ChessPiece | null{
    return this.board[row][col];
  }


  /**
   * @method getPiece
   * @description Zwraca bierkę znajdującą się na podanej pozycji o typie Position
   * @param {Position} position - Podana pozycja o typie Position
   * @returns {ChessPiece | null} Potencjalna bierka na podanej pozycji
   */
  public getPieceFromPosition(position: Position): ChessPiece | null{
    return this.board[position.row][position.col];
  }


  /**
   * @method logChessBoard
   * @description Wypisuje każde pole na szachownicy i dany typ bierki na danym polu
   * @param {(ChessPiece | null)[][]} board - Szachownica, z którą chcemy pracować
   * @returns {void}
   */
  logChessBoard(board: (ChessPiece | null)[][] = this.board): void {
    console.warn(`Chess Board Log`);
    console.log('Row 0: Col a, Col b, Col c, Col d, Col e, Col f, Col g, Col h')
    for (let row = 7; row >= 0; --row) {
      let tempCols: string = ''
      for(let col = 0; col < 8; col++) {
        let currentChessPiece = board[row][col];
        if (currentChessPiece)
          tempCols += ` ${currentChessPiece.type} ; `;
        else
          tempCols += ` blank ; `;
      }
      console.log(`Row ${row + 1}: ${tempCols}`)
    }
    console.log(this.getLegalMovesForColor('white').reverse())
    console.log(this.getLegalMovesForColor('black').reverse())
  }


  /**
   * @method restartChessBoard
   * @description Restaruje pozycje bierek na szachownicy
   * @returns {void}
   */
  public restartChessBoard(): void {
    this.initializeChessBoard();
    this.logChessBoard()
  }


  /**
   * @method isValidPosition
   * @description Sprawdza czy dana pozycja mieści się na naszej planszy
   * @param {Position} pos - Pozycja początkowa
   * @returns {(ChessPiece | null)[][]} Nowa plansza po symulowanym ruchu
   */
  isValidPosition(pos: Position): boolean {
    return pos.row >= 0 && pos.row < 8 && pos.col >= 0 && pos.col < 8;
  }


  /**
   * @method cloneBoard
   * @description Kopiuje wszystkie dane z podanej szachownicy, gdyż w JS/TS większość operacji jak przypisanie (Array2) = (Array1), zachodzi przez referencję
   * @param {(ChessPiece | null)[][]} board - Pobrana szachownica do skopiowowania
   * @returns {(ChessPiece | null)[][]} Nowa plansza po symulowanym ruchu
   * @throws {Error} Jeśli pozycje są nieprawidłowe
   */
  cloneBoard(board: (ChessPiece | null)[][]): (ChessPiece | null)[][] {
    return board.map(row => row.map(piece => piece ? { ...piece, position: { ...piece.position } } : null));
  }


  /**
   * @method simulateMove
   * @description Wykonuje symulację ruchu bez modyfikowania aktualnego stanu gry
   * @param {Position} from - Pozycja początkowa
   * @param {Position} to - Pozycja docelowa
   * @param {(ChessPiece | null)[][]} [board=this.board] - Opcjonalna plansza do symulacji
   * @returns {(ChessPiece | null)[][]} Nowa plansza po symulowanym ruchu
   */
  simulateMove(
    from: Position,
    to: Position,
    board: (ChessPiece | null)[][] = this.board
  ): (ChessPiece | null)[][] {
    const newBoard = this.cloneBoard(board);
    const movingPiece = newBoard[from.row][from.col];
    if (!movingPiece || !this.isValidPosition(movingPiece.position)) {
      return newBoard;
    }
    // Usuwamy bierkę z pozycji startowej.
    newBoard[from.row][from.col] = null;
    // Aktualizujemy pozycję oraz lastPosition bierki.
    movingPiece.lastPosition = { ...movingPiece.position };
    movingPiece.position = { ...to };
    movingPiece.hasMoved = true;
    // Umieszczamy bierkę na docelowej pozycji.
    newBoard[to.row][to.col] = movingPiece;
    return newBoard;
  }

  /**
   * @method calculateLegalMoves
   * @description Na skopiowanej szachownicy wykonujemy posunięcie bez sprawdzenia, czy jest legalne
   * @param {ChessPiece} piece - Bierka, dla której chcemy sprawdzić legalne ruchy
   * @param {(ChessPiece | null)[][]} [board=this.board] - Opcjonalna plansza do symulacji
   * @returns {legalMove[][]} Nowa plansza po symulowanym ruchu
   */
  public calculateLegalMoves(
    piece: ChessPiece,
    board: (ChessPiece | null)[][] = this.board
  ): legalMove[][] {
    const calculateForType = {
      'pawn': () => this.calculatePawnMoves(piece, board),
      'knight': () => this.calculateKnightMoves(piece, board),
      'bishop': () => this.calculateBishopMoves(piece, board),
      'rook': () => this.calculateRookMoves(piece, board),
      'queen': () => this.calculateQueenMoves(piece, board),
      'king': () => this.calculateKingMoves(piece, board)
    }

    if(calculateForType[piece.type])
      return calculateForType[piece.type]()
    return this.nullLegalMovesTable();
  }


  /**
   * @method calculatePawnMoves
   * @description Sprawdza wszystkie ruchy do przodu, na skos — zbicie, i specjalny ruch — en passant
   * @param {ChessPiece} piece - Pionek, dla którego chcemy sprawdzać legalne ruchy
   * @param {(ChessPiece | null)[][]} [board=this.board] - Opcjonalna plansza do symulacji
   * @returns {legalMove[][]} - zwraca dwuwymiarową tablicę legalnych ruchów
   */
  private calculatePawnMoves(
    piece: ChessPiece,
    board: (ChessPiece | null)[][]
  ): legalMove[][] {
    let moves: legalMove[][] = this.nullLegalMovesTable();
    const direction = piece.color === 'black' ? -1 : 1;
    const startRow = piece.color === 'black' ? 6 : 1;
    const forwardPos: Position = { row: piece.position.row + direction, col: piece.position.col };
    if (this.isValidPosition(forwardPos) && board[forwardPos.row][forwardPos.col] === null) {
      moves[forwardPos.row][forwardPos.col].isLegal = true;
      if (piece.position.row === startRow && piece.hasMoved === false) {
        const twoForward: Position = { row: piece.position.row + 2 * direction, col: piece.position.col };
        if (this.isValidPosition(twoForward) && board[twoForward.row][twoForward.col] === null) {
          moves[twoForward.row][twoForward.col].isLegal = true;
        }
      }
    }
    // Ruchy bijące – na skos
    for (const deltaCol of [-1, 1]) {
      const diagPos: Position = { row: piece.position.row + direction, col: piece.position.col + deltaCol };
      if (this.isValidPosition(diagPos)) {
        const target = board[diagPos.row][diagPos.col];
        if (target && target.color !== piece.color) {
          moves[diagPos.row][diagPos.col].isLegal = true;
        }
        if(piece.position.row === startRow + direction * 3){
          const enPassantTarget = board[piece.position.row][diagPos.col];
          if (enPassantTarget && enPassantTarget.color !== piece.color && enPassantTarget.moveTurn && enPassantTarget.type === 'pawn') {
            moves[diagPos.row][diagPos.col] = {isLegal: true, special: 'enpassant'};
          }
        }
      }
    }
    // this.logLegalMoves(piece, moves);
    return moves;
  }


  /**
   * @method nullLegalMovesTable
   * @description Przez dziwny błąd z referencją TS i JS, zwraca dwuwymiarową tablicę z legalnymi ruchami cała wypełniona nielegalnymi posunięciami
   * @returns {legalMove[][]} 'wynulowana' dwuwymiarowa tablica
   */
  private nullLegalMovesTable(): legalMove[][] {
    let moves: legalMove[][] = Array.from({ length: 8 }, () => new Array(8));
    for(let row: number = 0; row < 8 ; row++)
    {
      for(let col: number = 0; col < 8; col++)
        moves[row][col] = { isLegal: false};
    }
    return moves;
  }


  /**
   * @method calculateKnightMoves
   * @description Sprawdza dla każdego możliwego ruchu skoczka, ruchy legalne
   * @param {ChessPiece} piece - skoczek, dla którego chcemy obliczyć legalne ruchy
   * @param {(ChessPiece | null)[][]} [board=this.board] - Plansza, dla której chcemy sprawdzać legalne ruchy
   * @returns {legalMove[][]} - zwraca legalne ruchy podanego skoczka
   */
  private calculateKnightMoves(
    piece: ChessPiece,
    board: (ChessPiece | null)[][]
  ): legalMove[][] {
    let moves: legalMove[][] = this.nullLegalMovesTable();
    // this.logLegalMoves(piece, moves);
    const knightDeltas = [
      { row: -2, col: -1 }, { row: -2, col: 1 },
      { row: -1, col: -2 }, { row: -1, col: 2 },
      { row: 1, col: -2 },  { row: 1, col: 2 },
      { row: 2, col: -1 },  { row: 2, col: 1 }
    ];
    for (const delta of knightDeltas) {
      const newPos: Position = { row: piece.position.row + delta.row, col: piece.position.col + delta.col };
      if (this.isValidPosition(newPos)) {
        const target = board[newPos.row][newPos.col];
        if (target === null || target.color !== piece.color) {
          moves[newPos.row][newPos.col].isLegal = true;
        }
      }
    }
    // this.logLegalMoves(piece, moves);
    return moves;
  }


  /**
   * @method calculateBishopMoves
   * @description Sprawdza dla każdego możliwego ruchu gońca, ruchy legalne
   * @param {ChessPiece} piece - Pozycja początkowa
   * @param {(ChessPiece | null)[][]} [board=this.board] - Szachownica, na której chcemy sprawdzać legalne ruchy
   * @returns {legalMove[][]} zwraca legalne ruchy podanego gońca
   */
  private calculateBishopMoves(
    piece: ChessPiece,
    board: (ChessPiece | null)[][]
  ): legalMove[][] {
    let moves: legalMove[][] = this.nullLegalMovesTable();
    const directions = [
      { row: 1, col: 1 },
      { row: 1, col: -1 },
      { row: -1, col: 1 },
      { row: -1, col: -1 }
    ];
    for (const bishopDir of directions) {
      let newRow = piece.position.row + bishopDir.row;
      let newCol = piece.position.col + bishopDir.col;
      while (this.isValidPosition({ row: newRow, col: newCol })) {
        const target = board[newRow][newCol];
        if (target === null) {
          moves[newRow][newCol].isLegal = true;
        } else {
          if (target.color !== piece.color) {
            moves[newRow][newCol].isLegal = true;
          }
          break;
        }
        newRow += bishopDir.row;
        newCol += bishopDir.col;
      }
    }
    // this.logLegalMoves(piece, moves);
    return moves
  }


  /**
   * @method calculateRookMoves
   * @description Sprawdza, dla każdego możliwego ruchu wierzy, ruchy legalne
   * @param {ChessPiece} piece - Wieża, dla której chcemy sprawdzić legalne ruchy
   * @param {(ChessPiece | null)[][]} [board=this.board] - Szachownica, na której chcemy sprawdzać legalne ruchy
   * @returns {legalMove[][]} Legalne ruchy dla podanej wieży
   */
  private calculateRookMoves(
    piece: ChessPiece,
    board: (ChessPiece | null)[][]
  ):  legalMove[][] {
    let moves: legalMove[][] = this.nullLegalMovesTable();
    const directions = [
      { row: 1, col: 0 },
      { row: -1, col: 0 },
      { row: 0, col: 1 },
      { row: 0, col: -1 }
    ];
    for (const rookDir of directions) {
      let newRow = piece.position.row + rookDir.row;
      let newCol = piece.position.col + rookDir.col;
      while (this.isValidPosition({ row: newRow, col: newCol })) {
        const target = board[newRow][newCol];
        if (target === null) {
          moves[newRow][newCol].isLegal = true;
        } else {
          if (target.color !== piece.color) {
            moves[newRow][newCol].isLegal = true;
          }
          break;
        }
        newRow += rookDir.row;
        newCol += rookDir.col;
      }
    }
    // this.logLegalMoves(piece, moves);
    return moves;
  }


  /**
   * @method calculateQueenMoves
   * @description Dodaje, legalne ruchy wierzy i gońca z pozycji hetmana
   * @param {ChessPiece} piece - Pozycja początkowa
   * @param {(ChessPiece | null)[][]} [board=this.board] - Szachownica, na której chcemy sprawdzać legalne ruchy
   * @returns {legalMove[][]} Legalne ruchy dla podanego hetmana
   */
  private calculateQueenMoves(
    piece: ChessPiece,
    board: (ChessPiece | null)[][]
  ): legalMove[][] {
    let moves: legalMove[][] = this.nullLegalMovesTable();
    let rookMoves = this.calculateRookMoves(piece, board);
    let bishopMoves = this.calculateBishopMoves(piece, board);
    for(let row = 0 ; row < 8 ; row++)
    {
      for(let col = 0; col < 8; col++)
      {
        if(rookMoves[row][col].isLegal || bishopMoves[row][col].isLegal)
          moves[row][col].isLegal = true;
      }
    }
    // this.logLegalMoves(piece, moves);
    return moves;
  }


  /**
   * @method calculateKingMoves
   * @description Sprawdza dla każdego możliwego ruchu króla, ruchy legalne oraz roszady
   * @param {ChessPiece} piece - Pozycja początkowa
   * @param {(ChessPiece | null)[][]} [board=this.board] - Szachownica, na której chcemy sprawdzać legalne ruchy
   * @returns {legalMove[][]} Legalne ruchy dla podanego króla
   */
  private calculateKingMoves(
    piece: ChessPiece,
    board: (ChessPiece | null)[][]
  ): legalMove[][] {
    let moves: legalMove[][] = this.nullLegalMovesTable();
    for (let rowDelta = -1; rowDelta <= 1; rowDelta++) {
      for (let colDelta = -1; colDelta <= 1; colDelta++) {
        if (rowDelta === 0 && colDelta === 0) { continue; }
        const newPos: Position = { row: piece.position.row + rowDelta, col: piece.position.col + colDelta };
        if (this.isValidPosition(newPos)) {
          const target = board[newPos.row][newPos.col];
          if (target === null || target.color !== piece.color) {
            moves[newPos.row][newPos.col].isLegal = true;
          }
        }
      }
    }
    // Roszady
    if (!piece.hasMoved) {
      for (const possibleRook of [
        { rookCol: 0, deltaKingCol: -2, special: 'O-O-O' as SpecialMove },
        { rookCol: 7, deltaKingCol: 2, special: 'O-O' as SpecialMove }
      ]) {
        const rookPos: Position = { row: piece.position.row, col: possibleRook.rookCol };
        if (!this.isValidPosition(rookPos)) continue;

        const rook = board[rookPos.row][rookPos.col];
        if (!rook || rook.type !== 'rook' || rook.color !== piece.color || rook.hasMoved) continue;

        const delta = possibleRook.rookCol === 0 ? -1 : 1;
        let currentCol = piece.position.col + delta;
        let pathClear = true;

        while (currentCol !== possibleRook.rookCol) {
          if (board[piece.position.row][currentCol] !== null) {
            pathClear = false;
            break;
          }
          currentCol += delta;
        }

        if (pathClear) {
          const newKingCol = piece.position.col + possibleRook.deltaKingCol;
          if (this.isValidPosition({ row: piece.position.row, col: newKingCol })) {
            moves[piece.position.row][newKingCol] = {
              isLegal: true,
              special: possibleRook.special
            };
          }
        }
      }
    }
    // this.logLegalMoves(piece, moves);
    return moves;
  }


  /**
   * @method isKingInCheck
   * @description Sprawdza, czy z perspektywy przeciwnika mógłby legalnie zbić króla
   * @param {PieceColor} color - Kolor gracza, dla którego sprawdzamy, czy jest szachowany
   * @param {(ChessPiece | null)[][]} [board=this.board] - Szachownica, na której chcemy sprawdzać potencjalny szach
   * @returns {boolean} True/False czy jest szachowany
   */
  public isKingInCheck(
    color: PieceColor,
    board: (ChessPiece | null)[][] = this.board
  ): boolean {
    let kingPos: Position | null = null;
    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        const piece = board[row][col];
        if (piece && piece.type === 'king' && piece.color === color) {
          kingPos = { row, col };
          break;
        }
      }
      if (kingPos) break;
    }
    if (!kingPos) throw new Error(`Brak króla dla koloru ${color}`);
    const enemyColor: PieceColor = color === 'white' ? 'black' : 'white';
    // Dla każdej bierki przeciwnika sprawdzamy, czy ma ruch trafiający w pozycję króla.
    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        const piece = board[row][col];
        if (piece && piece.color === enemyColor) {
          const enemyMoves = this.calculateLegalMoves(piece, board);
          if (enemyMoves[kingPos.row][kingPos.col].isLegal) {
            return true;
          }
        }
      }
    }
    return false;
  }


  /**
   * @method checkEnemyKingInCheck
   * @description Sprawdza, czy z perspektywy przeciwnika mógłby legalnie zbić króla
   * @param {ChessPiece} movingPiece - Bierka, którą ruszamy i sprawdzamy, czy przeciwnik jest szachowany
   * @returns {void}
   */
  private checkEnemyKingInCheck(movingPiece: ChessPiece): void {
    const enemyColor: PieceColor = movingPiece.color === 'white' ? 'black' : 'white';
    if (this.isKingInCheck(enemyColor)) {
      console.warn(`Enemy king (${enemyColor}) is in check!`);
    }
  }


  /**
   * @method moveLeavesKingInCheck
   * @description Sprawdza, czy po zasymulowanym ruchu, własny król byłby zaszachowany
   * @param {ChessPiece} piece - Bierka, którą próbujemy się ruszyć
   * @param {Position} from - Pozycja początkowa
   * @param {Position} to - Pozycja docelowa
   * @param {(ChessPiece | null)[][]} [board=this.board] - Opcjonalna plansza do symulacji
   * @returns {boolean} True/False czy końcowo król jest szachowany
   */
  private moveLeavesKingInCheck(
    piece: ChessPiece,
    from: Position,
    to: Position,
    board: (ChessPiece | null)[][] = this.board
  ): boolean {
    const simulatedBoard = this.simulateMove(from, to, board);
    return this.isKingInCheck(piece.color, simulatedBoard);
  }


  /**
   * @method calculateLegalMoves
   * @description Sprawdza, czy po zasymulowanym ruchów po całej szachownicy, własny król byłby zaszachowany dla jakiegokolwiek przypadku, wtedy zachodzi anulowanie legalności ruchu
   * @param {ChessPiece} piece - Bierka, dla której chcemy przefiltrować ruchy
   * @param {legalMove[][]} moves - Początkowe legalne, które nie są przefiltrowane z szachowania króla
   * @param {(ChessPiece | null)[][]} [board=this.board] - Opcjonalna plansza do symulacji
   * @returns {legalMove[][]} Przefiltrowane legalne ruchy
   */
  private filterMovesByKingSafety(
    piece: ChessPiece,
    moves: legalMove[][],
    board: (ChessPiece | null)[][] = this.board
  ): legalMove[][] {
    // Kopiujemy tablicę ruchów, aby nie modyfikować oryginału.
    const filtered = moves.map(row => row.map(cell => ({ ...cell })));
    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        if (filtered[row][col].isLegal) {
          if (this.moveLeavesKingInCheck(piece, piece.position, { row, col }, board)) {
            filtered[row][col].isLegal = false;
          }
        }
      }
    }
    return filtered;
  }


  /**
   * @method getLegalMovesForColor
   * @description Oblicza wszystkie legalne ruchy dla każdej bierki podanego koloru
   * @param {PieceColor} color - Kolor, dla którego chcemy obliczyć legalne ruchy
   * @returns {{ piece: ChessPiece, legalMoves: legalMove[][] }[]} Tablica, z legalnymi ruchami, dla każdej bierki
   */
  public getLegalMovesForColor(
    color: PieceColor
  ): { piece: ChessPiece, legalMoves: legalMove[][] }[] {
    const result: { piece: ChessPiece, legalMoves: legalMove[][] }[] = [];
    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        const piece = this.board[row][col];
        if (piece && piece.color === color) {
          const rawMoves = this.calculateLegalMoves(piece);
          const safeMoves = this.filterMovesByKingSafety(piece, rawMoves);
          result.push({ piece, legalMoves: safeMoves });
        }
      }
    }
    return result;
  }


  /**
   * @method tryMove
   * @description Sprawdza różne warunki, dla których gracz nie mógłby wykonać ruchu
   * @param {MoveAttempt} moveAttempt - Pozycja początkowa
   * @returns {boolean} True/False w zależności czy może wykonać ruch, czy też nie
   * @throws {Error} Jeśli - Pozycja poza planszą
   * @throws {Error} Jeśli - Brak bierki na pozycji startowej
   * @throws {Error} Jeśli - Ruch niedozwolony lub pozostawi króla w szachu
   */
  public tryMove(moveAttempt: MoveAttempt): boolean {
    console.log('Czy jest bierka?', moveAttempt.to.row, moveAttempt.to.col);
    if (!this.isValidPosition(moveAttempt.from) || !this.isValidPosition(moveAttempt.to))
      throw new Error('Pozycja poza planszą.');
    const piece = this.board[moveAttempt.from.row][moveAttempt.from.col];
    if (!piece)
      throw new Error('Brak bierki na pozycji startowej.');
    const rawMoves = this.calculateLegalMoves(piece);
    const legalMoves = this.filterMovesByKingSafety(piece, rawMoves);
    let currentLegalMove = legalMoves[moveAttempt.to.row][moveAttempt.to.col];
    if (!currentLegalMove.isLegal) {
      console.warn(rawMoves, legalMoves)
      throw new Error('Ruch niedozwolony lub pozostawi króla w szachu.');
    }
    // Wykonanie ruchu – jeśli na docelowej pozycji znajduje się przeciwnik, następuje bicie.
    if(!currentLegalMove.special)
      this.executeStandardMove(moveAttempt, piece);
    else
    {
      this.currentSpecialForNotationOnly = currentLegalMove.special;

      const specialExecutes = {
        'enpassant': () => this.executeEnpassant(piece),
        'O-O': () => this.executeCastle(piece, {col: 7, deltaCol: 2, special: 'O-O'}),
        'O-O-O': () => this.executeCastle(piece, {col: 0, deltaCol: -2, special: 'O-O-O' as SpecialMove}),
      }
      if(specialExecutes[`${currentLegalMove.special}`])
        specialExecutes[`${currentLegalMove.special}`]();
    }
    console.log('Czy jest mat?', this.isMate(piece.color === 'white' ? 'black' : 'white'));
    this.gameEnd.next(this.isMate(piece.color === 'white' ? 'black' : 'white'))
    // console.log('Ilość pionków : ', this.countChessPieces());
    // console.log(this.lowEffortBoards)
    this.updateBoard.next(this.board)
    this.checkForDraw();
    return true;
  }


  /**
   * @method promotePawn
   * @description Inicjalizuje dialog do awansu piona
   * @param {ChessPiece} piece - Pionek, który chcemy awansować
   * @returns {void}
   */
  private promotePawn(piece: ChessPiece): void{
    let selectedPiece: PieceType = 'pawn';
    if(this.gameStart.value.type === 'GraczVsSiec' && this.gameStart.value.mainPlayerColor !== piece.color) return;
    const dialogRef = this.dialog.open(PawnPromotionComponent, {
      width: '650px',
      disableClose: true,
      data: { color: piece.color },
      panelClass: 'promotion-dialog-container'
    });

    dialogRef.afterClosed().subscribe((result: PieceType) => {
      if (result) {
        piece.type = result;
        console.warn(selectedPiece)
        this.updateBoard.next(this.board);

        this.pawnPromotionSubject.next({position: piece.position, type: result})
        this.pawnPromoted.emit({
          position: piece.position,
          promotedTo: result,
          color: piece.color
        });
      }
    });

  }


  /**
   * @method showGameEnding
   * @description Wyświetla użytkownikowi różne scenariusze zakończenia gry graficznie
   * @param {GameEndType} gameEnd - Opcjonalna plansza do symulacji
   * @returns {void}
   */
  private showGameEnding(gameEnd: GameEndType): void
  {
    this.AudioService.playSoundForType(gameEnd)
    if(gameEnd === 'none' || gameEnd === 'check') return;
    const dialogRef = this.dialog.open(GameEndDialogComponent, {
      data: { type: gameEnd, winner: this.currentTurnColor.value === 'black' ? 'czarny' : 'biały' },
      panelClass: 'modern-dialog'
    });

    dialogRef.afterClosed().subscribe(action => {
      this.gameClose.emit();
    });

  }


  /**
   * @method checkForDraw
   * @description Sprawdza wszystkie możliwe zakończenia gry poza czasowymi
   * @returns {GameEndType} Nowa plansza po symulowanym ruchu
   */
  checkForDraw(): GameEndType {
    if (this.lowEffortBoards.length >= 50) return 'draw-50-moves';

    const frequencyMap = new Map<string, number>();

    for (const board of this.lowEffortBoards) {
      const key = this.serializeBoard(board);
      const count = (frequencyMap.get(key) || 0) + 1;
      frequencyMap.set(key, count);
      if (count >= 3) {
        return 'draw-repetition';
      }
    }

    return 'none';
  }


  /**
   * @method serializeBoard
   * @description Zamiana mniejszej struktury szachownicy na formę string
   * @param {(LowEffortChessPiece | null)[][]} board - Szachownica, którą chcemy zamienić na string
   * @returns {string} Tekstowa forma szachownicy
   */
  private serializeBoard(board: (LowEffortChessPiece | null)[][]): string {
    return board.map(row =>
      row.map(square => {
        if (!square) return 'null';
        const { color, type, position } = square;
        return `${color}_${type}_${position.row},${position.col}`;
      }).join(',')
    ).join('|');
  }


  /**
   * @method compareBoardsLowEffort
   * @description Porównuje każde pole z pierwszej szachownicy a drugiej
   * @param {(LowEffortChessPiece|null)[][]} board1 - Pierwsza szachownicy pomniejszonej struktury
   * @param {(LowEffortChessPiece|null)[][]} board2 - Druga szachownicy pomniejszonej struktury
   * @returns {boolean} True/False w zależności czy są takie same
   */
  compareBoardsLowEffort(board1:(LowEffortChessPiece|null)[][], board2: (LowEffortChessPiece | null)[][]): boolean
  {
    for(let row = 0 ; row < 8 ; row++)
      for(let col = 0 ; col < 8; col++)
        if(board1[row][col] !== board2[row][col]) return false;
    return true;
  }


  /**
   * @method executeCastle
   * @description Sprawdza, czy król i potencjalna wieża się już ruszyły, jeśli nie próbuje wykonać roszadę.
   * @description Obsługuje krótkie i długie roszady w zależności od atributes
   * @param {ChessPiece} piece - Bierka króla, którą próbujemy się ruszyć
   * @param {CastleAtributes} attributes - Atrybuty roszady, którą próbujemy wykonać
   * @returns {void}
   */
  private executeCastle(piece: ChessPiece, attributes:CastleAtributes): void {
    const castleAttributes = attributes;
    const newPos: Position = { row: piece.position.row, col: castleAttributes.col };
    if(!this.isValidPosition(newPos))
      return

    const kingTargetPos: Position = {row: piece.position.row, col: piece.position.col + castleAttributes.deltaCol}
    const rookTargetPos: Position = {row: piece.position.row, col: kingTargetPos.col - castleAttributes.deltaCol/2}
    let rookPiece = this.board[newPos.row][newPos.col];
    this.previousBoard = this.copyChessBoard(this.board);
    this.board.map((distinctRow: (ChessPiece | null)[]) => {distinctRow.map((distinctSquare: (ChessPiece | null)) => {
      if(distinctSquare)
        distinctSquare.moveTurn = false;
    })})
    rookPiece!.hasMoved = true;
    this.board[rookTargetPos.row][rookTargetPos.col] = rookPiece;
    this.board[newPos.row][newPos.col] = null;

    piece.hasMoved = true;
    piece.moveTurn = true;
    this.board[kingTargetPos.row][kingTargetPos.col] = piece;
    this.board[piece.position.row][piece.position.col] = null;
    this.logChessBoard()
    this.checkEnemyKingInCheck(piece);
    this.canUndo = true;
    this.AudioService.playSoundForType('ruch');
    this.updateBoard.next(this.board);
  }


  /**
   * @method executeEnpassant
   * @description Sprawdza, czy legalnie został przypisany legalny ruch en passant, jeśli tak szuka sąsiedniego pionka, na którym gracz może wykonać bicie w przelocie i go zbija
   * @param {ChessPiece} piece - Pozycja początkowa
   * @returns {void}
   */
  private executeEnpassant(piece: ChessPiece): void {
    let enPassantPiece: ChessPiece | null = null;
    const direction = piece.color === 'black' ? -1 : 1;
    for (const deltaCol of [-1, 1]){
      let adjacentPiece: ChessPiece | null = this.board[piece.position.row][piece.position.col + deltaCol];
      if(adjacentPiece?.moveTurn && adjacentPiece.color !== piece.color)
      {
        enPassantPiece = adjacentPiece;
        break;
      }
    }
    console.warn(enPassantPiece)
    if(!enPassantPiece)
      return;
    this.previousBoard = this.copyChessBoard(this.board);
    this.board.map((distinctRow: (ChessPiece | null)[]) => {distinctRow.map((distinctSquare: (ChessPiece | null)) => {
      if(distinctSquare)
        distinctSquare.moveTurn = false;
    })})
    console.warn(enPassantPiece, this.board[piece.position.row][piece.position.col], {row: piece.position.row + direction, col: enPassantPiece.position.col}, this.board[piece.position.row + direction][piece.position.col], this.board[enPassantPiece.position.row][enPassantPiece.position.col])
    this.board[piece.position.row][piece.position.col] = null;
    piece.position = {row: piece.position.row + direction, col: enPassantPiece.position.col};
    piece.moveTurn = true;
    piece.hasMoved = true;
    this.board[piece.position.row][piece.position.col] = piece;
    this.board[enPassantPiece.position.row][enPassantPiece.position.col] = null;
    this.logChessBoard()
    this.checkEnemyKingInCheck(piece);
    this.canUndo = true;
    this.AudioService.playSoundForType('ruch');
    this.lowEffortBoards = [];
  }


  /**
   * @method executeStandardMove
   * @description Wykonuje standardowe posunięcie, to znaczy nie specjalne
   * @param {MoveAttempt} moveAttempt - Pozycja początkowa
   * @param {ChessPiece} piece - Pozycja docelowa
   * @returns {void}
   */
  private executeStandardMove(moveAttempt: MoveAttempt, piece: ChessPiece): void {
    let numberOfPieces = this.countChessPieces(this.board);
    this.previousBoard = this.copyChessBoard(this.board);
    this.board.map((distinctRow: (ChessPiece | null)[]) => {distinctRow.map((distinctSquare: (ChessPiece | null)) => {
      if(distinctSquare)
        distinctSquare.moveTurn = false;
    })})
    this.board[moveAttempt.to.row][moveAttempt.to.col] = piece;
    this.board[moveAttempt.from.row][moveAttempt.from.col] = null;
    piece.lastPosition = { ...moveAttempt.from };
    piece.position = { ...moveAttempt.to };
    piece.moveTurn = true;
    piece.hasMoved = true;
    if(piece.type === 'pawn' && (piece.position.row === 0 || piece.position.row === 7)){
      this.promotePawn(piece);
    }
    // this.logChessBoard()
    this.checkEnemyKingInCheck(piece);
    this.canUndo = true;
    this.AudioService.playSoundForType('ruch');
    if(piece.type !== "pawn" && numberOfPieces === this.countChessPieces(this.board))
      this.lowEffortBoards.push(this.copyChessBoardLowEffort(this.previousBoard));
    else
      this.lowEffortBoards = [];
  }


  /**
   * @method copyChessBoard
   * @description Głeboko kopiuje każdą wartość z pierwszej tabeli to drugiej
   * @param {(ChessPiece | null)[][]} board - Szachownica do skopiowania
   * @returns {(ChessPiece | null)[][]} Nowa skopiowana szachownica
   */
  public copyChessBoard(board: (ChessPiece | null)[][]): (ChessPiece | null)[][] {
    return board.map(row => row.map(piece => {
      if (piece) {
        return {
          ...piece,
          position: { ...piece.position },
          lastPosition: { ...piece.lastPosition }
        };
      }
      return null;
    }));
  }


  /**
   * @method copyChessBoardLowEffort
   * @description Głęboko kopiuje każdą wartość z pierwszej tabeli to drugiej
   * @param {(ChessPiece | null)[][] | (LowEffortChessPiece | null)[][]} board - Pozycja początkowa
   * @returns {(LowEffortChessPiece | null)[][]} Nowa plansza po symulowanym ruchu
   */
  private copyChessBoardLowEffort(board: (ChessPiece | null)[][] | (LowEffortChessPiece | null)[][]): (LowEffortChessPiece | null)[][] {
    return board.map(row => row.map(piece => {
      if (piece) {
        return {
          type: piece.type,
          color: piece.color,
          position: piece.position
        };
      }
      return null;
    }));
  }


  /**
   * @method undoMove
   * @description Wraca szachownicą do poprzedniej
   * @returns {boolean} True/False w zależności od tego, czy udało się cofnąć ruch
   * @throws {Error} Jeśli pozycje są nieprawidłowe
   */
  public undoMove(): boolean{
    console.warn(`Can undo: ${this.canUndo}`);
    if(!this.canUndo)
      return false;
    this.board = this.copyChessBoard(this.previousBoard);
    this.logChessBoard()
    this.currentTurnColor.next(this.currentTurnColor.value === 'white' ? 'black' : 'white');
    console.log(this.board)
    this.canUndo = false;
    this.updateBoard.next(this.board);
    this.undoMoveSubject.next(true);
    return true
  }


  /**
   * @method isMate
   * @description Sprawdza czy ma legalne ruchy, możliwe są dwie opcję: nic się nie stało albo jest szach
   * @description Jeśli nie znajdzie legalnych ruchów, wtedy jest mat albo pat
   * @param {PieceColor} color - Pozycja początkowa
   * @returns {GameEndType} Nowa plansza po symulowanym ruchu
   */
  public isMate(color: PieceColor): GameEndType {
    // Pobieramy wszystkie legalne ruchy dla danego koloru.
    let isDraw: GameEndType = this.checkForDraw();
    if(isDraw !== 'none')
    {
      return isDraw
    }
    const legalMovesForColor = this.getLegalMovesForColor(color);
    for (const { legalMoves } of legalMovesForColor)
      for (let row = 0; row < 8; row++)
        for (let col = 0; col < 8; col++)
          if (legalMoves[row][col].isLegal)
          {
            return this.isKingInCheck(color) ? 'check' : 'none';
          } // Znaleziono legalny ruch – nie jest to mat, ale może być pat.
    // Nie znaleziono legalnego ruchu — jest mat albo pat!
    return this.isKingInCheck(color) ? 'mate' : 'stalemate';
  }


  /**
   * @method countChessPieces
   * @description Zlicza ile jest bierek na szachownicy
   * @param {(ChessPiece | null)[][]} [board=this.board] - Szachownica, na której chcemy zliczać
   * @returns {number} Nowa plansza po symulowanym ruchu
   */
  public countChessPieces(board: (ChessPiece | null)[][] = this.board): number{
    let count: number = 0;
    for (let row = 0; row < 8; row++)
      for (let col = 0; col < 8; col++)
        if(board[row][col]) count++;
    return count;
  }


  /**
   * @method attemptAiMove
   * @description Wykonuje ruch Ai
   * @param {PieceColor} color - Kolor "gracza" ai
   * @param {number} difficulty - Trudność i poziom gry "gracza" ai
   * @returns {void}
   */
  public attemptAiMove(color: PieceColor, difficulty: number): void {
    if (!this.chessAiService) {
      console.warn(`AI service not set yet.`);
      return;
    }
    const bestMove = this.chessAiService.findBestMove(color, difficulty);
    if (bestMove) {
      console.log(`AI selected move: from (${bestMove.from.row}, ${bestMove.from.col}) to (${bestMove.to.row}, ${bestMove.to.col})`);
      this.tryMove(bestMove);
    } else {
      console.warn('No valid move found by AI.');
    }
  }


  /**
   * @method startGame
   * @description Startuje grę z podanymi
   * @param {Game} gameAttributes - Pozycja początkowa
   * @returns {void} Nowa plansza po symulowanym ruchu
   */
  public startGame(gameAttributes : Game): void {
    this.gameStart.next(gameAttributes);
  }
}
