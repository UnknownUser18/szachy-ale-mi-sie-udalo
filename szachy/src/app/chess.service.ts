﻿import {Injectable} from '@angular/core';
import {PawnPromotionComponent} from './pawn-promotion/pawn-promotion.component';
import {MatDialog} from '@angular/material/dialog';
import {Subject} from 'rxjs';
import {ChessAiService} from './chess-ai.service';

// Typ wyróżniający każdy typ bierki występujący w standardowych szachach
export type PieceType = 'pawn' | 'rook' | 'knight' | 'bishop' | 'queen' | 'king';

// Typ wyróżniający przeciwne kolory graczy na szachownicy - biały i czarny
export type PieceColor = 'white' | 'black';

// Typ wyróżniający specjalne ruchy w grze
export type SpecialMove = 'enpassant' | 'O-O' | 'O-O-O';

//Typ wyróżniający możliwe zakończenia gry
export type GameEndType = 'none' | 'check' | 'mate' | 'stalemate' | 'draw-repetition' | 'draw-50-moves';

/*
* Interfejs Danych
* Nazwa: legalMove
* Pola:
* isLegal: boolean - stan ruchu - wartość warunku czy konkretny ruch jest legalny
* special?: SpecialMove - jeżeli dany ruch zwiera się w ruchach specjalnych, wtedy występuje atrybut zmieniający działanie wykonywania ruchu
*/
export interface legalMove{
  isLegal: boolean;
  special?: SpecialMove;
}

/*
* Interfejs Danych
* Nazwa: Position
* Pola:
* row: number - wiersz liczony od góry, w którym jest dana bierka - Indeksy 0-7 ( np. indeks 0 oznacza 8-my wiersz w notacji algebraicznej czyli startowy wiersz czarnych, 7 analogicznie oznacza 1-wszy wiersz, czyli startowy wiersz białych
* col: number - kolumna liczona od lewej, w którym jest dana bierka - Indeksy 0-7 ( np. indeks 0 oznacza pierwszą kolumnę od lewej - standardowo oznaczaną literą 'a' ; indeks 7 oznacza ostatnią kolumnę od lewej - standardowo oznaczoną literą 'h'
*/
export interface Position{
  row: number;
  col: number;
}

/*
* Interfejs Danych
* Nazwa: MoveAttempt
* Pola:
* from: Position - Pozycja startowa z której występuja próba ruchu
* to: Position - Pozycja końcowa na której miałaby się znajdować bierka
*/
export interface MoveAttempt {
  from: Position;
  to: Position;
}

/*
* Interfejs Danych
* Nazwa: CastleAtributes
* Pola:
* col: number - kolumna na której powinna znajdować się wierza do konkretnej roszady
* deltaCol: number - zmiana, czyli przesunięcie króla po kolumnach w stronę wierzy
* special: SpecialMove - określenie czy jest to krótka roszada, czy też długa
*/
export interface CastleAtributes {
  col: number;
  deltaCol: number;
  special: SpecialMove;
}


/*
* Interfejs Danych
* Nazwa: ChessPiece
* Pola:
* type: PieceType - oznaczenie jakiego typu jest dana bierka
* color: PieceColor - rozróżnienie, którego gracza jest dana bierka w zależności od koloru bierki
* position: Position - aktualna pozycja bierki na szachownicy
* lastPosition: Position - pozycja bierki przed ostatnim ruchem na szachownicy - szczególnie przydatne do notacji szachowej i cofania ruchu
* hasMoved?: boolean - stan bierki - czy została poruszona - szczególnie przydatne do sprawdzania legalnści roszady podczas gry
* moveTurn?: boolean - stan bierki - czy została poruszona w ostatnim ruchu - szczególnie przydatne przy implementacji en passant
* */
export interface ChessPiece{
  type: PieceType;
  color: PieceColor;
  position: Position;
  lastPosition: Position;
  hasMoved?: boolean;
  moveTurn?: boolean;
}

export interface LowEffortChessPiece{
  type: PieceType;
  color: PieceColor;
  position: Position;
}

@Injectable({
  providedIn: 'root'
})
export class ChessService {
  public board: (ChessPiece | null)[][] = []; // Initialize the board as needed
  private previousBoard: (ChessPiece | null)[][] = [];
  public canUndo: boolean = false;
  private chessAiService: any;
  public lowEffortBoards: (LowEffortChessPiece | null)[][][] = [];
  public updateBoard = new Subject<(ChessPiece | null)[][]>()

  constructor(private dialog: MatDialog) {
    console.log('ChessService constructor called');
    this.initializeChessBoard();
    this.logChessBoard();
    console.log(this.getLegalMovesForColor('white'));
    console.log(this.getLegalMovesForColor('black'));
    this.tryMove({ from: { row: 1, col: 3 }, to: { row: 3, col: 3 } });
    this.undoMove();
    this.tryMove({ from: { row: 1, col: 3 }, to: { row: 2, col: 3 } });
    this.restartChessBoard();
  }

  public setAiService(aiService: ChessAiService): void {
    this.chessAiService = aiService;
  }


  /*
  * Metoda
  * Nazwa: initializeChessBoard
  * Pola:
  * Nie pobiera żadnych pól
  * Działanie:
  * Nuluje aktualą szachownicę oraz wypełnia ją domyślnym ustawieniem
  * Dodatkowo wyświetla w konsoli ustawienie szachownicy
  * Zwracana Wartość:
  * Nie zwraca żadnej wartości
  * */
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

  /*
  * Metoda
  * Nazwa: getPieceFromPosition
  * Pola:
  * position: Position - pozycja, z której chcemy znaleźć bierkę
  * Działanie:
  * Znajduje bierkę lub wartość null w danej pozycji na szachownicy
  * Zwracana wartość:
  * ChessPiece | null - w zależności czy znajdzie się tam bierka, zwróci ją lub null
  * */
  public getPiece(row: number, col: number): ChessPiece | null{
    return this.board[row][col];
  }

  /*
  * Metoda
  * Nazwa: getPieceFromPosition
  * Pola:
  * position: Position - pozycja, z której chcemy znaleźć bierkę
  * Działanie:
  * Znajduje bierkę lub wartość null w danej pozycji na szachownicy
  * Zwracana wartość:
  * ChessPiece | null - w zależności czy znajdzie się tam bierka, zwróci ją lub null
  * */
  public getPieceFromPosition(position: Position): ChessPiece | null{
    return this.board[position.row][position.col];
  }

  /*
  * Metoda
  * Nazwa: logChessBoard
  * Pola:
  * board: (ChessPiece | null)[][] - szachownica, którą chcemy wypisać, domyślnie jest to globalna szachownica this.board
  * Działanie:
  * Wypisuje każde pole na szachownicy i dany typ bierki na danym polu
  * Zwracana wartość:
  * Nie zwraca żadnej wartości
  * */
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

  /*
  * Metoda
  * Nazwa: restartChessBoard
  * Pola:
  * Nie pobiera pól
  * Działanie:
  * Inicjalizuje ponownie szachownicę przygotowując na nową rozgrywkę
  * Zwracana wartość:
  * Nie zwraca żadnej wartości
  * */
  public restartChessBoard(): void {
    this.initializeChessBoard();
    this.logChessBoard()
  }

  /*
  * Metoda
  * Nazwa: isValidPosition
  * Pola:
  * pos: Position - pobranie pozycji do sprawdzenia
  * Działanie:
  * Sprawdza czy dana pozycja mieści się na naszej planszy
  * Zwracana wartość:
  * boolean - zwraca czy podana pozycja spełnia warunek - true/false
  * */
  isValidPosition(pos: Position): boolean {
    return pos.row >= 0 && pos.row < 8 && pos.col >= 0 && pos.col < 8;
  }

  /*
  * Metoda
  * Nazwa: cloneBoard
  * Pola:
  * board: (ChessPiece | null)[][] - pobranie szachownicy do skopiowania
  * Działanie:
  * Kopiuje wszystkie dane z podanej szachownicy, gdyż w JS/TS większość operacji jak przypisanie (Array2) = (Array1), zachodzi przez referencję
  * Zwracana wartość:
  * (ChessPiece | null)[][] - zwraca skopiowaną szachownicę
  * */
  cloneBoard(board: (ChessPiece | null)[][]): (ChessPiece | null)[][] {
    return board.map(row => row.map(piece => piece ? { ...piece, position: { ...piece.position } } : null));
  }

  /*
  * Metoda
  * Nazwa: simulateMove
  * Pola:
  * from: Position - pozycją, z której chcemy symulować ruch
  * to: Position - końcowa pozycją, na której chcemy wylądować
  * board: (ChessPiece | null)[][] = this.board - szachownica, na której chcemy symulować - domyślnie używana jest globalna aktualna szachownica
  * Działanie:
  * Na skopiowanej szachownicy wykonujemy posunięcie bez sprawdzenia czy jest legalne
  * Jest ona kluczowa do sprawdzania szachowania króla
  * Zwracana wartość:
  * (ChessPiece | null)[][] - zwraca skopiowaną szachownicę
  * */
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

  /*
  * Metoda
  * Nazwa: calculateLegalMoves
  * Pola:
  * from: Position — pozycją, z której chcemy symulować ruch
  * to: Position — końcową pozycją, na której chcemy wylądować
  * board: (ChessPiece | null)[][] = this.board — szachownica, na której chcemy symulować — domyślnie używana jest globalna aktualna szachownica
  * Działanie:
  * Na skopiowanej szachownicy wykonujemy posunięcie bez sprawdzenia, czy jest legalne
  * Jest ona kluczowa do sprawdzania szachowania króla
  * Zwracana wartość:
  * (ChessPiece | null)[][] - zwraca skopiowaną szachownicę
  * */
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

  /*
  * Metoda
  * Nazwa: calculatePawnMoves
  * Pola:
  * piece: ChessPiece — pionek, dla którego chcemy sprawdzać legalne ruchy
  * board: (ChessPiece | null)[][] - szachownica, na której chcemy sprawdzać legalne ruchy
  * Działanie:
  * Sprawdza wszystkie ruchy do przodu, na skos — zbicie, i specjalny ruch — en passant
  * Zwracana wartość:
  * legalMove[][] - zwraca dwuwymiarową tablicę legalnych ruchów
  * */
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
          if (enPassantTarget && enPassantTarget.color !== piece.color && enPassantTarget.moveTurn) {
            moves[diagPos.row][diagPos.col] = {isLegal: true, special: 'enpassant'};
          }
        }
      }
    }
    // this.logLegalMoves(piece, moves);
    return moves;
  }

  /*
  * Metoda
  * Nazwa: logLegalMoves
  * Pola:
  * piece: ChessPiece — bierka, dla której chcemy wypisać legalne ruchy do konsoli
  * moves: legalMove[][] - obliczone legalne ruchy dla konkretnej bierki
  * Działanie:
  * Wypisuje 'typ bierki legal moves: legalne ruchy' w konsoli dla danych podanych pól
  * Zwracana wartość:
  * Nie zwraca żadnej wartości
  * */
  // private logLegalMoves(piece: ChessPiece, moves: legalMove[][]) {
  //   console.log(`${piece.type} legal moves: `, moves)
  // }

  /*
  * Metoda
  * Nazwa: nullLegalMovesTable
  * Pola:
  * Nie pobiera żadnych pól
  * Działanie:
  * Przez dziwny błąd z referencją TS i JS, zwraca dwuwymiarową tablicę z legalnymi ruchami cała wypełniona nielegalnymi posunięciami
  * Zwracana wartość:
  * legalMove[][] - 'wynulowana' dwuwymiarowa tablica dwuwymiarowa
  * */
  private nullLegalMovesTable(): legalMove[][] {
    let moves: legalMove[][] = Array.from({ length: 8 }, () => new Array(8));
    for(let row: number = 0; row < 8 ; row++)
    {
      for(let col: number = 0; col < 8; col++)
        moves[row][col] = { isLegal: false};
    }
    return moves;
  }

  /*
  * Metoda
  * Nazwa: calculateKnightMoves
  * Pola:
  * piece: ChessPiece — skoczek, dla którego chcemy obliczyć legalne ruchy
  * board: (ChessPiece | null)[][] - szachowanica, na której chcemy sprawdzać legalne ruchy
  * Działanie:
  * Sprawdza dla każdego możliwego ruchu skoczka, ruchy legalne
  * Zwracana wartość:
  * legalMove[][] - zwraca legalne ruchy podanego skoczka
  * */
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

  /*
  * Metoda
  * Nazwa: calculateBishopMoves
  * Pola:
  * piece: ChessPiece — goniec, dla którego chcemy obliczyć legalne ruchy
  * board: (ChessPiece | null)[][] - szachowanica, na której chcemy sprawdzać legalne ruchy
  * Działanie:
  * Sprawdza dla każdego możliwego ruchu gońca, ruchy legalne
  * Zwracana wartość:
  * legalMove[][] - zwraca legalne ruchy podanego gońca
  * */
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

  /*
  * Metoda
  * Nazwa: calculateRookMoves
  * Pola:
  * piece: ChessPiece — wieża, dla której chcemy obliczyć legalne ruchy
  * board: (ChessPiece | null)[][] - szachownica, na której chcemy sprawdzać legalne ruchy
  * Działanie:
  * Sprawdza, dla każdego możliwego ruchu wierzy, ruchy legalne
  * Zwracana wartość:
  * legalMove[][] - zwraca legalne ruchy podanej wieży
  * */
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

  /*
  * Metoda
  * Nazwa: calculateQueenMoves
  * Pola:
  * piece: ChessPiece — hetman, dla którego chcemy obliczyć legalne ruchy
  * board: (ChessPiece | null)[][] - szachownica, na której chcemy sprawdzać legalne ruchy
  * Działanie:
  * Dodaje, legalne ruchy wierzy i gońca z pozycji hetmana
  * Zwracana wartość:
  * legalMove[][] - zwraca legalne ruchy podanego hetmana
  * */
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

  /*
  * Metoda
  * Nazwa: calculateKingMoves
  * Pola:
  * piece: ChessPiece — król, dla którego chcemy obliczyć legalne ruchy
  * board: (ChessPiece | null)[][] - szachownica, na której chcemy sprawdzać legalne ruchy
  * Działanie:
  * Sprawdza dla każdego możliwego ruchu króla, ruchy legalne oraz roszady
  * Zwracana wartość:
  * legalMove[][] - zwraca legalne ruchy podanego króla
  * */
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
    if(!piece.hasMoved)
      for (let possibleRookCol of [{col: 0, deltaCol: -2, special: 'O-O-O' as SpecialMove}, {col: 7, deltaCol: 2, special: 'O-O' as SpecialMove}])
      {
        const newPos: Position = { row: piece.position.row, col: possibleRookCol.col };
        let col = piece.position.col;
        let possibleTarget: ChessPiece | null = null;
        while(col !== newPos.col)
        {
          const target = board[newPos.row][col];
          if(target)
            possibleTarget = target;
          col += newPos.col - col;
        }
        if(this.isValidPosition(newPos) && !possibleTarget)
        {
          const target = board[newPos.row][newPos.col];
          if(target?.type === 'rook' && target?.color === piece.color && !target.hasMoved)
            moves[piece.position.row][piece.position.col + possibleRookCol.deltaCol] = {isLegal: true, special: possibleRookCol.special};
        }
      }
    // this.logLegalMoves(piece, moves);
    return moves;
  }

  /*
  * Metoda
  * Nazwa: isKingInCheck
  * Pola:
  * color: PieceColor — kolor króla, dla którego chcemy sprawdzić czy jest on szachowany
  * board: (ChessPiece | null)[][] - szachownica, na której chcemy sprawdzać legalne ruchy
  * Działanie:
  * Sprawdza, czy z perspektywy przeciwnika mógłby legalnie zbić króla
  * Zwracana wartość:
  * boolean — zwraca prawda/fałsz w zależności od spełnienia warunków
  * */
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
    if (!kingPos) {
      console.error(`Brak króla dla koloru ${color}`);
      return false;
    }
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

  /*
  * Metoda
  * Nazwa: checkEnemyKingInCheck
  * Pola:
  * movingPiece: ChessPiece — pobranie poruszonej bierki, aby określić kolor przeciwnego króla
  * Działanie:
  * Sprawdza, czy z perspektywy przeciwnika mógłby legalnie zbić króla
  * Zwracana wartość:
  * boolean — zwraca prawda/fałsz w zależności od spełnienia warunków
  * */
  private checkEnemyKingInCheck(movingPiece: ChessPiece): void {
    const enemyColor: PieceColor = movingPiece.color === 'white' ? 'black' : 'white';
    if (this.isKingInCheck(enemyColor)) {
      console.warn(`Enemy king (${enemyColor}) is in check!`);
    }
  }

  /*
  * Metoda
  * Nazwa: moveLeavesKingInCheck
  * Pola:
  * piece: ChessPiece — pobranie ruszanej bierki
  * from: Position — pozycja startowa bierki
  * to: Position — pozycja końcowa bierki
  * board: (ChessPiece | null)[][] - szachownica, na której chcemy sprawdzać legalne ruchy
  * Działanie:
  * Sprawdza, czy po zasymulowanym ruchu, własny król byłby zaszachowany
  * Zwracana wartość:
  * boolean — zwraca prawda/fałsz w zależności od spełnienia warunków
  * */
  private moveLeavesKingInCheck(
    piece: ChessPiece,
    from: Position,
    to: Position,
    board: (ChessPiece | null)[][] = this.board
  ): boolean {
    const simulatedBoard = this.simulateMove(from, to, board);
    return this.isKingInCheck(piece.color, simulatedBoard);
  }

  /*
  * Metoda
  * Nazwa: filterMovesByKingSafety
  * Pola:
  * piece: ChessPiece — pobranie ruszanej bierki
  * moves: legalMove[][] - obliczone wcześniej 'legalne' ruchy, dla których się sprawdza czy nie pozostawią króla w szachu po ruchu
  * board: (ChessPiece | null)[][] - szachownica, na której chcemy sprawdzać legalne ruchy
  * Działanie:
  * Sprawdza, czy po zasymulowanym ruchów po całej szachownicy, własny król byłby zaszachowany dla jakiegokolwiek przypadku, wtedy zachodzi anulowanie legalności ruchu
  * Zwracana wartość:
  * boolean — zwraca prawda/fałsz w zależności od spełnienia warunków
  * */
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

  /*
  * Metoda
  * Nazwa: getLegalMovesForColor
  * Pola:
  * color: PieceColor — kolor, dla którego chcemy pobrać legalne ruchy
  * Działanie:
  * Oblicza wszystkie legalne ruchy dla każdej bierki podanego koloru
  * Zwracana wartość:
  * { piece: ChessPiece, legalMoves: legalMove[][] }[] - zwaraca tablicę z określeniem legalnych ruchów(dwuwymiarowa tablica) dla konkretnej bierki
  * */
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


  /*
  * Metoda
  * Nazwa: tryMove
  * Pola:
  * moveAttempt: MoveAttempt — próba ruchu przez gracza
  * Działanie:
  * Sprawdza różne warunki, dla których gracz nie mógłby wykonać ruchu
  * Zwracana wartość:
  * boolean — zawraca prawda/fałsz w zależności czy może wykonać ruch, czy też nie
  * */
  public tryMove(moveAttempt: MoveAttempt): boolean {
    console.log('Czy jest bierka?', moveAttempt.to.row, moveAttempt.to.col);
    if (!this.isValidPosition(moveAttempt.from) || !this.isValidPosition(moveAttempt.to)) {
      console.error('Pozycja poza planszą.');
      return false;
    }
    const piece = this.board[moveAttempt.from.row][moveAttempt.from.col];
    console.log(piece)
    console.log(this.board)
    if (!piece) {
      console.error('Brak bierki na pozycji startowej.');
      return false;
    }
    const rawMoves = this.calculateLegalMoves(piece);
    const legalMoves = this.filterMovesByKingSafety(piece, rawMoves);
    let currentLegalMove = legalMoves[moveAttempt.to.row][moveAttempt.to.col];
    if (!currentLegalMove.isLegal) {
      console.warn(rawMoves, legalMoves)
      console.error('Ruch niedozwolony lub pozostawi króla w szachu.');
      return false;
    }
    // Wykonanie ruchu – jeśli na docelowej pozycji znajduje się przeciwnik, następuje bicie.
    if(!currentLegalMove.special)
      this.executeStandardMove(moveAttempt, piece);
    else
    {
      const specialExecutes = {
        'enpassant': () => this.executeEnpassant(piece),
        'O-O': () => this.executeCastle(piece, {col: 7, deltaCol: 2, special: 'O-O'}),
        'O-O-O': () => this.executeCastle(piece, {col: 0, deltaCol: -2, special: 'O-O-O' as SpecialMove}),
      }
      if(specialExecutes[`${currentLegalMove.special}`])
        specialExecutes[`${currentLegalMove.special}`]();
    }
    console.log('Czy jest mat?', this.isMate(piece.color === 'white' ? 'black' : 'white'));
    console.warn(this.countChessPieces());
    console.log(this.lowEffortBoards)
    this.checkForDraw();
    return true;
  }


  private promotePawn(piece: ChessPiece){
    let selectedPiece: PieceType = 'pawn';

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
      }
    });
  }


  checkForDraw(): GameEndType
  {
    if(this.lowEffortBoards.length >= 50) return 'draw-50-moves';
    // this.lowEffortBoards.forEach((distinctBoard: (LowEffortChessPiece | null)[][]) => {
    //   if(this.lowEffortBoards.filter((distinctItem: (LowEffortChessPiece | null)[][]) => {if(this.compareBoardsLowEffort(distinctItem, distinctBoard)) isDraw = 'draw-repetition'}).length >= 3) isDraw = 'draw-repetition';
    // })
    return 'none';
  }

  compareBoardsLowEffort(board1:(LowEffortChessPiece|null)[][], board2: (LowEffortChessPiece | null)[][]): boolean
  {
    for(let row = 0 ; row < 8 ; row++)
      for(let col = 0 ; col < 8; col++)
        if(board1[row][col] !== board2[row][col]) return false;
    return true;
  }


  /*
  * Metoda
  * Nazwa: executeCastle
  * Pola:
  * piece: ChessPiece — pobranie ruszanego króla
  * atributes: CastleAtributes — atrybuty roszady — gdzie miałaby znajdować się wieża oraz o ile miałby poruszyć się król podczas roszady
  * Działanie:
  * Sprawdza, czy król i potencjalna wieża się już ruszyły, jeśli nie próbuje wykonać roszadę.
  * Obsługuje krótkie i długie roszady w zależności od atributes
  * Zwracana wartość:
  * Nie zwraca żadnych wartości
  * */
  private executeCastle(piece: ChessPiece, atributes:CastleAtributes) {
    const castleAtributes = atributes;
    const newPos: Position = { row: piece.position.row, col: castleAtributes.col };
    if(!this.isValidPosition(newPos))
      return

    const kingTargetPos: Position = {row: piece.position.row, col: piece.position.col + castleAtributes.deltaCol}
    const rookTargetPos: Position = {row: piece.position.row, col: kingTargetPos.col - castleAtributes.deltaCol/2}
    let rookPiece = this.board[newPos.row][newPos.col];
    this.previousBoard = this.copyChessBoard(this.board);
    this.board.map((distinctRow: (ChessPiece | null)[]) => {distinctRow.map((distinctSquare: (ChessPiece | null)) => {
      if(distinctSquare)
        distinctSquare.moveTurn = false;
    })})
    this.board[newPos.row][newPos.col] = null;
    rookPiece!.hasMoved = true;
    this.board[rookTargetPos.row][rookTargetPos.col] = rookPiece;

    this.board[piece.position.row][piece.position.col] = null;
    piece.hasMoved = true;
    piece.moveTurn = true;
    this.board[kingTargetPos.row][kingTargetPos.col] = piece;
    this.logChessBoard()
    this.checkEnemyKingInCheck(piece);
    this.canUndo = true;
  }

  /*
  * Metoda
  * Nazwa: executeEnpassant
  * Pola:
  * piece: ChessPiece — pobranie ruszanego pionka
  * Działanie:
  * Sprawdza, czy legalnie został przypisany legalny ruch en passant, jeśli tak szuka sąsiedniego pionka, na którym gracz może wykonać bicie w przelocie i go zbija
  * Zwracana wartość:
  * Nie zwraca żadnych wartości
  * */
  private executeEnpassant(piece: ChessPiece) {
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
    this.lowEffortBoards = [];
  }

  /*
  * Metoda
  * Nazwa: executeStandardMove
  * Pola:
  * piece: ChessPiece — pobranie ruszanego króla
  * moveAttempt: MoveAttempt — dokładne opisanie próby ruchu
  * Działanie:
  * Wykonuje posunięcie
  * Zwracana wartość:
  * Nie zwraca żadnych wartości
  * */
  private executeStandardMove(moveAttempt: MoveAttempt, piece: ChessPiece) {
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
    this.logChessBoard();
    if(piece.type === 'pawn' && (piece.position.row === 0 || piece.position.row === 7)) this.promotePawn(piece);
    this.logChessBoard()
    this.checkEnemyKingInCheck(piece);
    this.canUndo = true;
    if(piece.type !== "pawn" && numberOfPieces === this.countChessPieces(this.board))
      this.lowEffortBoards.push(this.copyChessBoardLowEffort(this.previousBoard));
    else
      this.lowEffortBoards = [];
  }

  /*
  * Metoda
  * Nazwa: copyChessBoard
  * Pola:
  * board: (ChessPiece | null)[][] - szachownica, którą chcemy kopiować
  * Działanie:
  * Głeboko kopiuje każdą wartość z pierwszej tabeli to drugiej
  * Zwracana wartość:
  * (ChessPiece | null)[][] - zwraca skopiowaną tabelę
  * */
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

  /*
  * Metoda
  * Nazwa: copyChessBoardLowEffort
  * Pola:
  * board: (ChessPiece | null)[][] - szachownica, którą chcemy kopiować
  * Działanie:
  * Głeboko kopiuje każdą wartość z pierwszej tabeli to drugiej
  * Zwracana wartość:
  * (LowEffortChessPiece | null)[][] - zwraca skopiowaną ograniczoną tabelę
  * */
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


  /*
  * Metoda
  * Nazwa: undoMove
  * Pola:
  * Nie pobiera żadnych pól
  * Działanie:
  * Wraca szachownicą do poprzedniej
  * Zwracana wartość:
  * Nie zwraca żadnej wartości
  * */
  public undoMove(): boolean{
    console.warn(`Can undo: ${this.canUndo}`);
    if(!this.canUndo)
      return false;
    this.board = this.copyChessBoard(this.previousBoard);
    this.logChessBoard()
    console.log(this.board)
    return true
  }

  /*
  * Metoda
  * Nazwa: isMate
  * Pola:
  * color: PieceColor — sprawdzenie mata, dla konkretnego koloru
  * Działanie:
  * Sprawdza czy ma legalne ruchy, możliwe są dwie opcję: nic się nie stało albo jest szach
  * Jeśli nie znajdzie legalnych ruchów, wtedy jest mat albo pat
  * Zwracana wartość:
  * Nie zwraca żadnych wartości
  * */
  public isMate(color: PieceColor): GameEndType {
    // Pobieramy wszystkie legalne ruchy dla danego koloru.
    if(this.checkForDraw() !== 'none') return this.checkForDraw()
    const legalMovesForColor = this.getLegalMovesForColor(color);
    for (const { legalMoves } of legalMovesForColor)
      for (let row = 0; row < 8; row++)
        for (let col = 0; col < 8; col++)
          if (legalMoves[row][col].isLegal) return this.isKingInCheck(color) ? 'check' : 'none'; // Znaleziono legalny ruch – nie jest to mat, ale może być pat.
    // Nie znaleziono legalnego ruchu — jest mat albo pat!
    return this.isKingInCheck(color) ? 'mate' : 'stalemate';
  }
  /*
  * Metoda
  * Nazwa: countChessPieces
  * Pola:
  * board: (ChessPiece | null)[][] — pobierana szachownica
  * Działanie:
  * Sprawdza, czy król jest w szachu
  * Jeśli jest, wtedy sprawdza legalne ruchy
  * Jeśli nie znajdzie legalnych ruchów, wtedy jest mat
  * Zwracana wartość:
  * number - zwraca ile jest bierek na szachownicy
  * */
  public countChessPieces(board: (ChessPiece | null)[][] = this.board): number{
    let count: number = 0;
    for (let row = 0; row < 8; row++)
      for (let col = 0; col < 8; col++)
        if(board[row][col]) count++;
    return count;
  }
  public attemptAiMove(color: PieceColor): void {
    if (!this.chessAiService) {
      console.warn(`AI service not set yet.`);
      return;
    }
    const bestMove = this.chessAiService.findBestMove(color, 2);
    if (bestMove) {
      console.log(`AI selected move: from (${bestMove.from.row}, ${bestMove.from.col}) to (${bestMove.to.row}, ${bestMove.to.col})`);
      this.tryMove(bestMove);
    } else {
      console.warn('No valid move found by AI.');
    }
  }

}

