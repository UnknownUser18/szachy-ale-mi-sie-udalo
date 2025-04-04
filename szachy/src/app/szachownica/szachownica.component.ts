import {Component, ElementRef, Renderer2, Output, EventEmitter, Input, OnChanges, SimpleChanges} from '@angular/core';
import {ChessPiece, ChessService, legalMove, MoveAttempt, PieceColor, Position} from '../chess.service';
import { pieces } from '../app.component';
import { LocalConnectionService } from '../local-connection.service';
import { ChessAiService } from '../chess-ai.service';
export type GameType = | 'GraczVsGracz' | 'GraczVsSiec' | 'GraczVsAi' | 'GraczVsGrandmaster';

export interface Game {
  type: GameType;
  duration: number;
  mainPlayerColor?: PieceColor;
  board?: (ChessPiece | null)[][];
  difficulty?: number;
  grandmaster?: File;
  black_player?: string;
  white_player?: string;
}

@Component({
  selector: 'app-szachownica',
  imports: [],
  templateUrl: './szachownica.component.html',
  standalone: true,
  styleUrl: './szachownica.component.css'
})
export class SzachownicaComponent implements OnChanges {
  public currentGame!: Game;
  @Output() next_moves : EventEmitter<any> = new EventEmitter();
  @Input() game: Game | undefined;
  @Output() currentGameChange : EventEmitter<Game> = new EventEmitter<Game>();
  @Output() moveExecuted : EventEmitter<MoveAttempt> = new EventEmitter<MoveAttempt>();
  @Output() moveExectued_boolean : EventEmitter<string> = new EventEmitter<string>();
  private focusedPiece: HTMLElement | null = null;
  private focusedChessPiece: ChessPiece | null = null;
  private focusedLegalMoves: legalMove[][] = [];
  constructor(private chessService : ChessService, private renderer : Renderer2, private element : ElementRef, private aiChessService : ChessAiService, private connection: LocalConnectionService) {
    this.chessService.updateBoard.subscribe(() : void => this.loadBoard())
    this.chessService.currentTurnColor.subscribe((gameTurnColor: PieceColor) : PieceColor => this.focusedColor = gameTurnColor);
  }
  focusedColor: PieceColor = 'white';
  number_move : number = 0;
  cashedGrandmasterGames : string[] = [];
  ngOnChanges(changes: SimpleChanges) : void {
    if (changes['game'] && changes['game'].currentValue) {
      this.startGame(changes['game'].currentValue);
    }
  }


  /**
   * @method loadBoard
   * @description Ładuje szachownicę graficznie w zależności od szachownicy w chessService
   * @returns {void}
   */
  loadBoard(): void {
  let board: HTMLElement = this.element.nativeElement.querySelector('main');
  (board.childNodes as NodeListOf<HTMLElement>).forEach((row: HTMLElement): void => {
    (row.childNodes as NodeListOf<HTMLElement>).forEach((cell: HTMLElement): void => {
      if (!(cell.hasAttribute('data-row') && cell.hasAttribute('data-column'))) return;
      let rowNum: number = parseInt(cell.getAttribute('data-row')!);
      let columnNum: number = parseInt(cell.getAttribute('data-column')!);
      const pieceType = this.chessService.board[rowNum][columnNum]?.type.toString();
      const pieceColor = this.chessService.board[rowNum][columnNum]?.color.toString();
      if (pieceType && pieceColor) {
        let childNodes = cell.childNodes as NodeListOf<HTMLElement>;
        childNodes.forEach((cellNode: HTMLElement): void => {
          if (cellNode.tagName === 'IMG') cell.removeChild(cellNode);
        });
        let img: HTMLImageElement = this.renderer.createElement('img');
        img.src = pieces[pieceColor + '_' + pieceType];
        cell.appendChild(img);
        cell.classList.add('piece');
        cell.setAttribute('draggable', 'true');
      } else if (cell.classList.contains('piece')) {
        if (!(cell.classList.contains('letter') || cell.classList.contains('number')))
          cell.innerHTML = '';
        cell.classList.remove('piece');
        cell.removeAttribute('draggable');
        if (cell.childNodes && cell.childNodes.length > 0) cell.removeChild(cell.querySelector('img')!);
      }
      if (cell.classList.contains('start')) {
        if (!cell.querySelector('.number')) {
          let span: HTMLElement = this.renderer.createElement('span');
          span.textContent = '1';
          span.classList.add('number');
          this.renderer.appendChild(cell, span);
        }
        if (!cell.querySelector('.letter')) {
          let span: HTMLElement = this.renderer.createElement('span');
          span.textContent = 'a';
          span.classList.add('letter');
          this.renderer.appendChild(cell, span);
        }
      }
    })
  })
  }


  /**
   * @method styleLegalMoves
   * @description Stylizuje szachownicę pod względem legalnych ruchów i ustawienia bierek
   * @param {HTMLElement} board - HTMLElement szachownicy
   * @returns {void}
   */
  styleLegalMoves(board: HTMLElement): void {
    board.querySelectorAll('.moved').forEach((cell: Element): void => { cell.classList.remove('moved') });
    for (let index_row: number = 0; index_row < 8; index_row++) {
      for (let index_column: number = 0; index_column < 8; index_column++) {
        this.chessService.board[index_row][index_column]?.moveTurn
          ? (() => {
            board.querySelector(`div[data-row="${index_row}"][data-column="${index_column}"]`)!.classList.add('moved');
            board.querySelector(`div[data-row="${this.chessService.board[index_row][index_column]!.lastPosition.row}"][data-column="${this.chessService.board[index_row][index_column]!.lastPosition.col}"]`)!.classList.add('moved')
          })()
          : '';
        if (!this.focusedLegalMoves[index_row]) {
          board.querySelectorAll('.valid').forEach((cell: Element): void => { cell.classList.remove('valid') });
          break;
        }
        this.focusedLegalMoves[index_row][index_column].isLegal
          ? board.querySelector(`div[data-row="${index_row}"][data-column="${index_column}"]`)!.classList.add('valid')
          : board.querySelector(`div[data-row="${index_row}"][data-column="${index_column}"]`)!.classList.remove('valid');
      }
    }
    board.querySelectorAll('.active').forEach((cell: Element): void => { cell.classList.remove('active') });
    if (this.focusedChessPiece) this.focusedPiece!.classList.add('active');
  }


  /**
   * @method initializeChessBoard
   * @description Inicjalizuje szachownicę graficznie w zależności od podanych atrybutów gry
   * @param {Game} gameAttributes - Atrybuty gry, którą chcemy rozpocząć
   * @returns {void}
   */
  initializeChessBoard(gameAttributes: Game): void {
    if(!!gameAttributes.board)
      this.chessService.board = gameAttributes.board
    let board: HTMLElement = this.element.nativeElement.querySelector('main');
    board.innerHTML = '';
    for (let i: number = 8; i > 0; i--) {
      let row: HTMLElement = this.renderer.createElement('div');
      for (let j: number = 0; j < 8; j++) {
        let element: HTMLElement = this.renderer.createElement('div');
        element.setAttribute('data-row', String(i - 1));
        if (i === 1 && j === 0) {
          let span: HTMLElement = this.renderer.createElement('span');
          span.textContent = '1';
          span.classList.add('number');
          this.renderer.appendChild(element, span);
          span = this.renderer.createElement('span');
          span.textContent = 'a';
          span.classList.add('letter');
          this.renderer.appendChild(element, span);
          element.classList.add('start');
        } else if (i === 1) {
          element.textContent = String.fromCharCode(65 + j).toLowerCase();
          element.classList.add('letter');
        } else if (j === 0) {
          element.textContent = String(i);
          element.classList.add('number');
        }
        element.setAttribute('data-column', String(j));
        element.addEventListener('dragstart', (event: DragEvent): void => {
          let rowNum: number = parseInt(element.getAttribute('data-row')!);
          let colNum: number = parseInt(element.getAttribute('data-column')!);
          if (this.chessService.board[rowNum][colNum]?.color !== this.focusedColor) return;
          event.dataTransfer?.setData('text/plain', JSON.stringify({
            row: rowNum,
            column: colNum
          }));
          this.focusedPiece = element;
          let position: Position = { row: rowNum, col: colNum };
          this.focusedChessPiece = this.chessService.getPieceFromPosition(position);
          this.focusedLegalMoves = this.chessService.getLegalMovesForColor(this.focusedChessPiece!.color).find((distinctPieceLegalMoves: { piece: ChessPiece, legalMoves: legalMove[][] }) => distinctPieceLegalMoves.piece === this.focusedChessPiece)?.legalMoves || [];
          this.styleLegalMoves(this.element.nativeElement.querySelector('main'));
        });
        element.addEventListener('dragover', (event: DragEvent): void => {
          event.preventDefault();
        });
        const executeForGameType = {
          "GraczVsGracz": () => this.PlayerVsPlayerLocal(element, board),
          "GraczVsAi": () => this.PlayerVsAi(element, board),
          "GraczVsSiec": () => this.PlayerVsNetwork(element, board, gameAttributes),
          "GraczVsGrandmaster": () => this.PlayerVSGrandMaster(element, board, gameAttributes),
        };
        element.addEventListener('drop', (event: DragEvent): void => {
          if (event.dataTransfer!.getData('text/plain').match('http://')) return;
          event.preventDefault();
          if(executeForGameType[gameAttributes.type]) executeForGameType[gameAttributes.type]();
        });
        element.addEventListener('click', (): void => {
          if(executeForGameType[gameAttributes.type]) executeForGameType[gameAttributes.type]();
        });
        this.renderer.appendChild(row, element);
      }
      this.renderer.appendChild(board, row);
    }
    this.loadBoard();
    if (
      gameAttributes.mainPlayerColor === 'black' &&
      (gameAttributes.type === 'GraczVsGrandmaster' ||
        gameAttributes.type === 'GraczVsAi')
    ) {
      setTimeout((): void => {
        if (gameAttributes.type === 'GraczVsGrandmaster') {
          this.GrandMasterMove(board, gameAttributes, null, null);
        } else {
          this.chessService.attemptAiMove('black', gameAttributes.difficulty!);
        }
        this.chessService.currentTurnColor.next(
          gameAttributes.mainPlayerColor === 'black' ? 'black' : 'white'
        );
      }, Math.floor(Math.random() * 1000) + 1000);
    }
  }


  /**
   * @method PlayerVsPlayerLocal
   * @description Zarządza próbą ruchów, kiedy gramy w tryb Gracza kontra Gracz
   * @param {HTMLElement} element - Konkretne pole na szachownicy
   * @param {HTMLElement} board - HTMLElement szachownicy
   * @returns {void}
   */
  PlayerVsPlayerLocal(element: HTMLElement, board: HTMLElement): void {
    let position: Position = {
      row: parseInt(element.getAttribute('data-row')!),
      col: parseInt(element.getAttribute('data-column')!),
    };
    let piece: ChessPiece | null =
      this.chessService.getPieceFromPosition(position);
    if (piece && piece.color === this.focusedColor) {
      this.focusedChessPiece = piece;
      this.focusedPiece = element;
      let legalMoves = this.chessService.getLegalMovesForColor(piece.color).find((distinctPieceLegalMoves: { piece: ChessPiece; legalMoves: legalMove[][]; }) => distinctPieceLegalMoves.piece === piece)?.legalMoves;
      if (!(legalMoves && legalMoves.length > 0)) return;
      this.focusedLegalMoves = legalMoves;
      this.styleLegalMoves(board);
      return;
    }
    if (this.focusedChessPiece)
      this.movePiece(this.focusedChessPiece!.position, position);
  }


  /**
   * @method PlayerVsNetwork
   * @description Zarządza próbą ruchów, kiedy gramy w tryb Gracza kontra Gracz w sieci lokalnej
   * @param {HTMLElement} element - Konkretne pole na szachownicy
   * @param {HTMLElement} board - HTMLElement szachownicy
   * @param {Game} gameAttributes - Atrybuty aktualnej gry
   * @returns {void}
   */
  PlayerVsNetwork(element: HTMLElement, board: HTMLElement, gameAttributes: Game): void {
    let position: Position = {
      row: parseInt(element.getAttribute('data-row')!),
      col: parseInt(element.getAttribute('data-column')!),
    };
    let piece: ChessPiece | null =
      this.chessService.getPieceFromPosition(position);
    if (
      piece &&
      piece.color === this.focusedColor &&
      piece.color === gameAttributes.mainPlayerColor
    ) {
      this.focusedChessPiece = piece;
      this.focusedPiece = element;
      let legalMoves = this.chessService.getLegalMovesForColor(piece.color).find((distinctPieceLegalMoves: { piece: ChessPiece; legalMoves: legalMove[][]; }) => distinctPieceLegalMoves.piece === piece)?.legalMoves;
      if (!(legalMoves && legalMoves.length > 0)) return;
      this.focusedLegalMoves = legalMoves;
      this.styleLegalMoves(board);
      return;
    }
    if (this.focusedChessPiece) {
      this.connection.attemptMove(this.focusedChessPiece!.position, position);
      this.movePiece(this.focusedChessPiece!.position, position);
    }
  }


  /**
   * @method PlayerVsAi
   * @description Zarządza próbą ruchów, kiedy gramy w tryb Gracza kontra AI
   * @param {HTMLElement} element - Konkretne pole na szachownicy
   * @param {HTMLElement} board - HTMLElement szachownicy
   * @returns {void}
   */
  public PlayerVsAi(element: HTMLElement, board: HTMLElement): void {
    let position: Position = {
      row: parseInt(element.getAttribute('data-row')!),
      col: parseInt(element.getAttribute('data-column')!),
    };
    let piece: ChessPiece | null = this.chessService.getPieceFromPosition(position);

    if (piece && piece.color === this.focusedColor) {
      this.focusedChessPiece = piece;
      this.focusedPiece = element;
      let moves = this.chessService
        .getLegalMovesForColor(piece.color)
        .find((m) => m.piece === piece)?.legalMoves;
      if (moves) {
        this.focusedLegalMoves = moves;
        this.styleLegalMoves(board);
      }
      return;
    }
    if (this.focusedChessPiece) {
      this.movePiece(this.focusedChessPiece.position, position);
    }
  }


  /**
   * @method movePiece
   * @description Próbuje wykonać ruch i w zależności od trybu gry wykonuje różne akcje
   * @param {Position} from - Pozycja początkowa
   * @param {Position} to - Pozycja docelowa
   * @returns {void | number} Zwraca numer, jeśli wystąpił jakiś błąd
   */
  movePiece(from: Position, to: Position): void | number {
    if (this.focusedChessPiece && this.focusedChessPiece.color !== this.focusedColor) {
      console.warn("It is not your turn.");
      return 1;
    }
    if (!this.focusedLegalMoves[to.row] || !this.focusedLegalMoves[to.row][to.col].isLegal) {
      console.warn("Illegal move attempted");
      return 1;
    }
    let moveAttempt: MoveAttempt = { from: { ...from }, to: { ...to } };
    let attempt: boolean = this.chessService.tryMove(moveAttempt);
    let movedPieceColor: PieceColor = this.focusedChessPiece!.color;
    if (attempt) {
      this.chessService.currentTurnColor.next(
        this.focusedColor === 'white' ? 'black' : 'white'
      );
      console.log(`Move executed: from (${from.row}, ${from.col}) to (${to.row}, ${to.col})`);
      this.convertPositionToNotation(from);
      this.convertPositionToNotation(to);
      this.moveExecuted.emit({
        from: { row: from.row, col: from.col },
        to: { row: to.row, col: to.col },
      });
      this.moveExectued_boolean.emit("true");
      this.focusedColor = movedPieceColor === 'white' ? 'black' : 'white';
      if (this.currentGame.type === 'GraczVsAi') {
        const aiColor: PieceColor =
          movedPieceColor === 'white' ? 'black' : 'white';
        console.log(`AI's turn to move as ${aiColor}`);
        setTimeout(() => {
          this.chessService.attemptAiMove(aiColor, this.currentGame.difficulty!);
          this.focusedColor = movedPieceColor;
          this.resetFocus();
          this.loadBoard();
          this.styleLegalMoves(
            this.element.nativeElement.querySelector('main')
          );
        }, 1000);
      }
      this.resetFocus();
    }
    this.loadBoard();
    this.styleLegalMoves(this.element.nativeElement.querySelector('main'));
  }


  /**
   * @method resetFocus
   * @description Jakakolwiek bierka, która była sfocusowana zostaje odfocusowana
   * @param {HTMLElement} board - Pozycja początkowa
   * @returns {void}
   */
  resetFocus(
    board: HTMLElement = this.element.nativeElement.querySelector('main')
  ): void {
    this.focusedPiece = null;
    this.focusedChessPiece = null;
    this.focusedLegalMoves = [];
    if (board) this.styleLegalMoves(board);
  }


  /**
   * @method startGame
   * @description Startuje grę z podanymi atrybutami i zmienia aktualny kolor gracza na biały
   * @param {Game} gameAttributes - Atrybuty gry, którą chcemy rozpocząć
   * @returns {void}
   */
  public startGame(gameAttributes: Game): void {
    this.currentGame = gameAttributes;
    this.currentGameChange.emit(gameAttributes);
    this.chessService.currentTurnColor.next('white');
    this.initializeChessBoard(gameAttributes);
  }


  /**
   * @method GrandMasterMove
   * @description Zarządza jak rusza się arcymistrz, kiedy gramy w tryb Gracz kontra Arcymistrz
   * @param {HTMLElement} board - HTMLElement szachownicy
   * @param {Game} gameAttributes - Atrybuty gry, w której ma się ruszać arcymistrz
   * @param {Position | null} lastMove - ostatni ruch
   * @param {string | null} piece - nazwa bierki
   * @returns {void}
   */
  private GrandMasterMove(board: HTMLElement, gameAttributes: Game, lastMove: Position | null, piece: string | null): void {
    const rows: any = { a: 0, b: 1, c: 2, d: 3, e: 4, f: 5, g: 6, h: 7 };
    const pieces_local: any = {pawn: '', knight: 'N', bishop: 'B', rook: 'R', queen: 'Q', king: 'K',};
    function setMoveAttempt(finalPosition: Position, n_rows: number, n_columns: number): MoveAttempt {
      return {
        from: {
          row: finalPosition.row + n_rows,
          col: finalPosition.col + n_columns,
        },
        to: { row: finalPosition.row, col: finalPosition.col },
      };
    }

    let findMoves = (moves: Array<Position>, finalPosition: Position, name: string): MoveAttempt | void => {
      if(!(moves && finalPosition && name)) throw new Error("Invalid arguments passed to findMoves");
      console.log(name);
      for (let directions of moves) {
        let newRow: number = finalPosition.row;
        let newCol: number = finalPosition.col;
        while (true) {
          newRow += directions.row;
          newCol += directions.col;
          if (newRow < 0 || newRow >= 8 || newCol < 0 || newCol >= 8) {
            break;
          }
          let element: HTMLImageElement = board.querySelector(`div[data-row="${newRow}"][data-column="${newCol}"]`)?.querySelector('img') as HTMLImageElement;
          if (!element) continue;
          let img: string = element.src!;
          img = img.substring(img.indexOf('assets/'));
          if (img === pieces[`white_${name}`] || img === pieces[`black_${name}`]) {
            console.warn(`${name} found at row: ${newRow}, col: ${newCol}`);
            return setMoveAttempt(finalPosition, newRow - finalPosition.row, newCol - finalPosition.col);
          }
        }
      }
      return;
    }
    let reader: FileReader = new FileReader();
    reader.onload = (): void => {
      let lastPlayerPosition : string = pieces_local[piece!] + (String.fromCharCode(Number(lastMove?.col) + 65) + (lastMove?.row! + 1)).toLowerCase();
      let partie : string[] | string = (reader.result as string).split(`\r\n\r\n\r\n\r\n\r\n\r\n`); // please really ignore this.
      if(this.cashedGrandmasterGames.length > 0) partie = this.cashedGrandmasterGames;
      partie = partie.filter((part : string) : boolean => {
        if(gameAttributes.mainPlayerColor === 'black')
          return part.match(`\\b${this.number_move+1}. [a-zA-Z0-9]{1,4} {2}${lastPlayerPosition}.`) !== null;
        else
          return part.match(`\\b${this.number_move+1}. ${lastPlayerPosition} {2}[a-zA-Z0-9]{1,4}.`) !== null;
      });
      if(partie.length === 0) {
        this.chessService.tryMove(this.aiChessService.findBestMove(gameAttributes.mainPlayerColor === 'white' ? 'black' : 'white', gameAttributes.difficulty!)!);
        this.next_moves.emit({player: null, grandmaster: null})
        this.loadBoard();
        return;
      } else {
        this.cashedGrandmasterGames = partie;
        partie = partie[Math.floor(Math.random() * partie.length)];
      }
      let moves: string[] = partie.split(/\d+\.\s/).filter(Boolean);
      moves.shift();
      for (let i: number = 0; i < moves.length; i++) {
        let nextMovesPlayer: string[] = [];
        let nextMovesGrandmaster: string[] = [];
        for (let j: number = i + 1; j < i + 5; j++) {
          if (gameAttributes.mainPlayerColor === 'white') {
            nextMovesGrandmaster.push(moves[j].trimEnd().split('  ')[1]);
            nextMovesPlayer.push(moves[j].trimEnd().split('  ')[0]);
          } else {
            nextMovesGrandmaster.push(moves[j].trimEnd().split('  ')[0]);
            nextMovesPlayer.push(moves[j].trimEnd().split('  ')[1]);
          }
        }
        const data = {player: nextMovesPlayer, grandmaster: nextMovesGrandmaster};
        this.next_moves.emit(data)
        let moveArray: string | string[] = moves[i].split('  ').filter(Boolean);

        if (i === this.number_move) {
          moveArray = gameAttributes.mainPlayerColor === 'white' ? moveArray[1] : moveArray[0];
          moveArray = moveArray.trimEnd().split(' ')[0].replace(/[+#]/g, '');
          let finalPosition: Position = {row: parseInt(moveArray[2]) - 1, col: rows[moveArray[1]]};
          if (moveArray.includes('x')) {
            finalPosition.row = parseInt(moveArray[3]) - 1;
            finalPosition.col = rows[moveArray[2]];
          }
          const pieces_local: { [key: string]: [string, Position[]] } = {
            'N': ['knight', [{row: 2, col: -1}, {row: 2, col: 1}, {row: 1, col: 2}, {row: -1, col: 2}, {row: -2, col: -1}, {row: -2, col: 1}, {row: 1, col: -2}, {row: -1, col: -2}]],
            'B': ['bishop', [{row: 1, col: 1}, {row: 1, col: -1}, {row: -1, col: 1}, {row: -1, col: -1}]],
            'R': ['rook', [{row: 1, col: 0}, {row: -1, col: 0}, {row: 0, col: 1}, {row: 0, col: -1}]],
            'Q': ['queen', [{row: 1, col: 1}, {row: 1, col: -1}, {row: -1, col: 1}, {row: -1, col: -1}, {row: 1, col: 0}, {row: -1, col: 0}, {row: 0, col: 1}, {row: 0, col: -1}]],
            'K': ['king', [{row: 1, col: 1}, {row: 1, col: -1}, {row: -1, col: 1}, {row: -1, col: -1}, {row: 1, col: 0}, {row: -1, col: 0}, {row: 0, col: 1}, {row: 0, col: -1}]],
            '': ['pawn', [{row: 1, col: 0}, {row: 2, col: 0}]]
          }
          let moveAttempt: MoveAttempt | null = null;
          if (pieces_local[moveArray[0]] === undefined) {
            let pawn_attempt: Array<Position> = pieces_local[''][1];
            if (moveArray.includes('x')) {
              pawn_attempt = [{row: 1, col: 1}, {row: 1, col: -1}];
            } else {
              finalPosition = {row: parseInt(moveArray[1]) - 1, col: rows[moveArray[0]]};
            }
            if (gameAttributes.mainPlayerColor === 'black')
              pawn_attempt = pawn_attempt.map((position: Position): Position => ({row: -position.row, col: position.col}));
            moveAttempt = findMoves(pawn_attempt, finalPosition, 'pawn')!;
          } else {
            moveAttempt = findMoves(pieces_local[moveArray[0]][1],finalPosition,pieces_local[moveArray[0]][0])!;
          }
          console.log(moveAttempt)
          try {
            this.chessService.tryMove(moveAttempt!);
          } catch (err) {
            console.error("Error while executing grandmaster move", err);
            console.log("Switching to AI move");
            this.chessService.tryMove(this.aiChessService.findBestMove(gameAttributes.mainPlayerColor === 'white' ? 'black' : 'white', gameAttributes.difficulty!)!);
          }
          this.loadBoard();
          this.number_move++;
          break;
        }
      }
    }
    reader.readAsText(gameAttributes.grandmaster!)
  }


  /**
   * @method PlayerVSGrandMaster
   * @description Zarządza ruszaniem się bierkami po szachownicy, kiedy gramy w tryb Gracza kontra Arcymistrz
   * @param {HTMLElement} element - Konkretne pole na szachownicy
   * @param {HTMLElement} board - HTMLElement szachownicy
   * @param {Game} gameAttributes - Atrybuty gry, w której ma się ruszać gracz i arcymistrz
   * @returns {void}
   */
  private PlayerVSGrandMaster(element: HTMLElement, board: HTMLElement, gameAttributes: Game): void {
    let position: Position = {row: parseInt(element.getAttribute('data-row')!), col: parseInt(element.getAttribute('data-column')!)};
    let piece: ChessPiece | null = this.chessService.getPieceFromPosition(position);
    if (piece && piece.color === this.focusedColor) {
      this.focusedChessPiece = piece;
      this.focusedPiece = element;
      let legalMoves = this.chessService.getLegalMovesForColor(piece.color).find((distinctPieceLegalMoves: { piece: ChessPiece, legalMoves: legalMove[][] }) : boolean => distinctPieceLegalMoves.piece === piece)?.legalMoves;
      if (!(legalMoves && legalMoves.length > 0)) return;
      this.focusedLegalMoves = legalMoves;
      this.styleLegalMoves(board);
      return;
    }
    if (!this.focusedChessPiece) return;
    const type : string = this.focusedChessPiece?.type;
    const result : number | void = this.movePiece(this.focusedChessPiece!.position, position);
    if (result === 1) {
      return console.warn("Illegal move attempted, grandmaster move will not be executed.");
    }
    this.chessService.currentTurnColor.next(gameAttributes.mainPlayerColor === 'white' ? 'black' : 'white'); // flip turn
    setTimeout(() : void => {
      this.GrandMasterMove(board, gameAttributes, position, type);
      this.chessService.currentTurnColor.next(this.chessService.currentTurnColor.value === 'white' ? 'black' : 'white'); // flip turn, and yes, it has to be twice.
    }, Math.floor(Math.random() * 1000) + 1000);
  }


  /**
   * @method undoMove
   * @description Wywołuje cofanie ruchu i zmienia sfocusowany kolor
   * @returns {void}
   */
  public undoMove(): void {
    if (this.chessService.undoMove()) this.focusedColor = this.focusedColor === 'white' ? 'black' : 'white';
    this.loadBoard();
  }


  /**
   * @method convertPositionToNotation
   * @description Konwertuje pozycję na notację szachową, dokładniej zmienia zapis kolumny na alfabetyczny
   * @param {Position} position - Pozycja początkowa
   * @returns {string} Pozycja gotowa dla notacji szachowej
   */
  convertPositionToNotation(position: Position): string {
    const column = String.fromCharCode(97 + position.col); // a-h
    const row = 8 - position.row; // 1-8
    return `${column}${row}`;
  }
}
