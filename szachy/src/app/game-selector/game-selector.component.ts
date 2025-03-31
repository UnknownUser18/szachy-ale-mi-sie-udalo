import {AfterViewInit, Component, ElementRef, Input, OnChanges, Output, Renderer2, SimpleChanges, EventEmitter} from '@angular/core';
import {NgForOf, NgIf, NgOptimizedImage} from '@angular/common';
import {Game, GameType} from '../szachownica/szachownica.component';
import {FormsModule} from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import {ChessService,ChessPiece, PieceColor, PieceType} from '../chess.service';
import {LocalConnectionService} from '../local-connection.service';

@Component({
    selector: 'app-game-selector',
  imports: [
    NgIf,
    FormsModule,
    NgOptimizedImage,
    NgForOf
  ],
    templateUrl: './game-selector.component.html',
    styleUrls: ['./game-selector.component.css']
})
export class GameSelectorComponent implements OnChanges, AfterViewInit {
  /**
   * @description Typ gry, który jest aktualnie wybrany przez użytkownika.
   */
  @Input({ required: true }) game: GameType | undefined;
  /**
   * @description Czas gry w sekundach, emitowany dla innych komponentów.
   */
  @Output() time : EventEmitter<number> = new EventEmitter<number>();
  /**
   * @description Czas gry w sekundach.
   */
  universalTime: number = 0;
  /**
   * @description Kolor gracza, który jest aktualnie wybrany przez użytkownika.
   */
  kolorGracza: PieceColor = 'white';
  constructor(private renderer: Renderer2, private element: ElementRef, private chessService: ChessService, protected connection: LocalConnectionService, private http: HttpClient) {}
  /**
   * @description Tablica z figurami szachowymi.
   */
  pawns : Array<string[]> = this.defaultChessBoard();
  /**
   * @description Tablica z figurami szachowymi w formie stringów, używana dla `loadBoard()`.
   */
  pawns_string : string[] = ['cw','cs','cg','ch','ck','cp','bw','bs','bg','bh','bk','bp'];
  /**
   * @description Nazwy figur szachowych, używane dla wstawiania figur na szachownicę.
   */
  pawns_names: { [key: string]: string } = {
    'cw': 'Czarna Wieża', 'cs': 'Czarny Skoczek', 'cg': 'Czarny Goniec', 'ch': 'Czarny Hetman', 'ck': 'Czarny Król', 'cp': 'Czarny Pionek',
    'bw': 'Biała Wieża', 'bs': 'Biały Skoczek', 'bg': 'Biały Goniec', 'bh': 'Biały Hetman', 'bk': 'Biały Król', 'bp': 'Biały Pionek'
  };
  /**
   * @description AI trudność, używana dla `GraczVsAi`.
   */
  ai_difficulty : number = 2;
  /**
   * @description Nazwa czarnego mistrza, używana dla `GraczVsGrandmaster`.
   */
  black_grandmaster: string | undefined = undefined;
  /**
   * @description Nazwa białego mistrza, używana dla `GraczVsGrandmaster`.
   */
  white_grandmaster: string | undefined = undefined;
  /**
   * @description Tablica asocjacyjna, używana w heading, aby wyświetlić informacje o aktualnym trybie użytkownika.
   */
  type : { [key in GameType] : string } = {
    GraczVsGracz: 'Gracz vs Gracz (1 komputer)',
    GraczVsSiec: 'Gracz vs Gracz (Sieć lokalna)',
    GraczVsGrandmaster: 'Gracz vs Grandmaster',
    GraczVsAi: 'Gracz vs Komputer',
  };
  /**
   * @description Plik `.pgn` z bazą danych, używany dla `GraczVsGrandmaster`.
   */
  grandmasterFile : File | null = null;

  /**
   * @description Metoda wywoływana po załadowaniu komponentu. Inicjalizuje szachownicę i ustawia czas gry.
   * @returns {void}
   */
  ngAfterViewInit() : void {
    this.initializeChessboard().then(() : void => this.loadBoard());
    this.setTime(5400, 0, 1);
    this.chessService.currentTurnColor.next('white');
  }
  /**
   * @description Metoda inicjalizująca szachownicę.
   * @returns {Promise<void>}
   */
  async initializeChessboard() : Promise<void> {
    let chessboard: HTMLElement = this.element.nativeElement.querySelector('.chessboard');
    if (!chessboard) return;
    chessboard.innerHTML = '';
    for (let i: number = 0; i < 8; i++) {
      let row: HTMLElement = this.renderer.createElement('div');
      for (let j: number = 0; j < 8; j++) {
        let square: HTMLElement = this.renderer.createElement('div');
        square.setAttribute('data-row', i.toString());
        square.setAttribute('data-col', j.toString());
        row.appendChild(square);
      }
      chessboard.appendChild(row);
    }
    document.body.addEventListener('drop', (event: DragEvent): void => {
    event.preventDefault();
    const data = JSON.parse(event.dataTransfer!.getData('text/plain'));
    if (data.fromRow !== undefined && data.fromCol !== undefined) {
      this.pawns[data.fromRow][data.fromCol] = '';
      this.loadBoard();
    }
  })

  // Prevent default dragover behavior on the body
  document.body.addEventListener('dragover', (event: DragEvent): void => {
    event.preventDefault();
  });
  }

  /**
   * @description Metoda zwracająca domyślną szachownicę.
   * @returns {Array<string[]>}
   */
  defaultChessBoard(): Array<string[]> {
    return [
      ['cw','cs','cg','ch','ck','cg','cs','cw'],
      ['cp','cp','cp','cp','cp','cp','cp','cp'],
      ['','','','','','','',''],
      ['','','','','','','',''],
      ['','','','','','','',''],
      ['','','','','','','',''],
      ['bp','bp','bp','bp','bp','bp','bp','bp'],
      ['bw','bs','bg','bh','bk','bg','bs','bw']
    ];
  }
  /**
   * @description Metoda ładujące pionki oraz `EventListener` odpowiedzialne za przesuwanie pionków.
   * @returns {void}
   */
  loadBoard() : void {
    let chessboard: HTMLElement = this.element.nativeElement.querySelector('.chessboard');
    if (!chessboard) return;
    for (let i: number = 0; i < 8; i++) {
      for (let j: number = 0; j < 8; j++) {
        let element : HTMLElement = this.element.nativeElement.querySelector(`.chessboard > div:nth-child(${i + 1}) > div:nth-child(${j + 1})`)!;
        if (this.pawns[i][j] === '') {
          element.innerHTML = '';
          element.classList.remove('pawn');
        } else {
          if (!element.firstChild) {
            element.classList.add('pawn')
            let img: HTMLImageElement = this.renderer.createElement('img')
            img.src = `assets/pieces/${this.pawns[i][j]}.svg`;
            img.alt = this.pawns[i][j];
            img.draggable = true;
            img.addEventListener('dragstart', (event: DragEvent): void => {
              event.dataTransfer!.setData('text/plain', JSON.stringify({fromRow: i, fromCol: j, pawn: this.pawns[i][j]}));
            });
            element.appendChild(img);
          }
        }
        element.addEventListener('dragover', (event: DragEvent): void => {
          event.preventDefault();
        });
        element.addEventListener('drop', (event: DragEvent): void => {
          event.preventDefault();
          const data = JSON.parse(event.dataTransfer!.getData('text/plain'));
          if(data.pawn) {
            let col : number = parseInt(element.getAttribute('data-col')!);
            let row : number = parseInt(element.getAttribute('data-row')!);
            if(this.pawns[row][col] !== '') return;
            this.pawns[row][col] = data.pawn;
            this.loadBoard();
          } else {
            this.movePiece(data.fromRow, data.fromCol, i, j);
          }
        });
      }
    }
    const pawns : NodeListOf<HTMLImageElement> = this.element.nativeElement.querySelectorAll('.pawns img');
    pawns.forEach((pawn: HTMLImageElement) : void => {
      pawn.addEventListener('dragstart', (event: DragEvent): void => {
        event.dataTransfer!.setData('text/plain', JSON.stringify({ pawn: pawn.alt }));
      });
    });
    chessboard.addEventListener('dragover', (event: DragEvent): void => {
      event.preventDefault();
    });
    chessboard.addEventListener('drop', (event: DragEvent): void => {
      event.preventDefault();
      const data = JSON.parse(event.dataTransfer!.getData('text/plain'));
      if(!(data.fromCol !== undefined && data.fromRow !== undefined)) return; // musi być sprawdzane, gdy jest undefined, bo inaczej 0 == false
      let target : HTMLElement = (event.target as HTMLElement).parentElement!;
      if(target.getAttribute('data-row')) {
        if(this.pawns[parseInt(target.getAttribute('data-row')!)][parseInt(target.getAttribute('data-col')!)] === this.pawns[parseInt(data.fromRow)][parseInt(data.fromCol)]) return;
      }
      this.pawns[parseInt(data.fromRow)][parseInt(data.fromCol)] = '';
      this.loadBoard();
    });
  }

  /**
   * @description Metoda transformująca szachownicę z formatu stringowego na format obiektowy.
   * @param board
   */
  transformChessBoard(board: Array<string[]>): (ChessPiece | null)[][] {
    const colorDictionary: { [key: string]: PieceColor | null } = { 'c': 'black', 'b': 'white', '': null };
    const pieceTypeDictionary: { [key: string]: PieceType | null } = {'p': 'pawn', 'r': 'rook', 's': 'knight', 'g': 'bishop', 'h': 'queen', 'k': 'king', 'w': 'rook', '': null};
    board = board.reverse()
    let chessBoard: (ChessPiece | null)[][] = Array.from({ length: 8 }, () => new Array(8).fill(null));
    for (let rowNum = 0; rowNum < board.length; rowNum++)
      for (let colNum = 0; colNum < board[rowNum].length; colNum++) {
        const cell = board[rowNum][colNum];
        if (!cell || cell === '') continue;
        const [colorChar, pieceTypeChar] = cell.split('');
        const color = colorDictionary[colorChar] as PieceColor;
        const type = pieceTypeDictionary[pieceTypeChar] as PieceType;
        if (!color && type) {
          chessBoard[rowNum][colNum] = null;
          continue;
        }
        chessBoard[rowNum][colNum] = {
          color: color,
          type: type,
          position: { row: rowNum, col: colNum },
          lastPosition: { row: 0, col: 0 },
          hasMoved: false,
          moveTurn: false
        }
      }
    return chessBoard
  }

  /**
   * @description Metoda przesuwająca pionek na szachownicy.
   * @param fromRow
   * @param fromCol
   * @param toRow
   * @param toCol
   * @return {void}
   * @description Przesuwa pionek z pozycji (fromRow, fromCol) na pozycję (toRow, toCol) na szachownicy.
   */
  movePiece(fromRow: number, fromCol: number, toRow: number, toCol: number): void {
  if (this.pawns[toRow][toCol] === '') {
    this.pawns[toRow][toCol] = this.pawns[fromRow][fromCol];
    this.pawns[fromRow][fromCol] = '';
    this.loadBoard();
  }
}

  /**
   * @description Metoda wywoływana po zmianie wartości `game`. Inicjalizuje szachownicę oraz ustawia czas gry.
   * @param changes
   */
  ngOnChanges(changes: SimpleChanges): void {
    if (changes['game']) {
      this.pawns = this.defaultChessBoard();
      if(changes['game'].currentValue !== 'GraczVsSiec') {
        setTimeout(() : void => {
          let button : HTMLButtonElement = this.element.nativeElement.querySelector('.start');
          button.disabled = changes['game'].currentValue === 'GraczVsGrandmaster';
        }, 10);
      }
      if(changes['game'].previousValue === 'GraczVsGrandmaster') {
        setTimeout(() : void => {
          let chessboard : HTMLElement = this.renderer.createElement('div');
          chessboard.classList.add('chessboard');
          let chess : HTMLElement = this.element.nativeElement.querySelector('.chess');
          chess.appendChild(chessboard);
          this.initializeChessboard().then(() : void => {
            this.loadBoard();
            this.attachDragEventListeners();
          });
        }, 10)
        return;
      }
      this.initializeChessboard().then(() : void => {
        this.loadBoard();
        this.attachDragEventListeners();
      });
    }
  }

  /**
   * @description Metoda tworząca obiekt gry.
   */
  gameConstructor(): Game {
    return {
      board: this.transformChessBoard(this.pawns),
      type: this.game!,
      duration: this.universalTime,
      mainPlayerColor: this.kolorGracza,
      grandmaster: this.grandmasterFile ?? undefined,
      difficulty: this.ai_difficulty ?? undefined
    }
  }
  /**
   * @description Metoda rozpoczynająca grę.
   * @param attr - Atrybuty gry, które mają być użyte do rozpoczęcia gry.
   * @returns {void}
   */
  startGame(attr?: Game) : void {
    console.log('Starting Game');
    let gameAttributes: Game = attr ?? this.gameConstructor()
    if(this.game === 'GraczVsGrandmaster') {
      gameAttributes.mainPlayerColor = this.kolorGracza;
      if(this.kolorGracza === 'white') {
        gameAttributes.black_player = this.black_grandmaster;
        gameAttributes.white_player = 'Gracz';
      } else {
        gameAttributes.white_player = this.white_grandmaster;
        gameAttributes.black_player = 'Gracz';
      }
    }
    this.chessService.startGame(gameAttributes);
  }

  /**
   * @description Metoda ładująca plik `.pgn` od użytkownika.
   * @param event - Zdarzenie `change` wywoływane po wybraniu pliku.
   * @returns {void}
   * @description Umożliwia użytkownikowi załadowanie pliku `.pgn` z bazą danych.
   * @throws {Error} - Jeśli plik nie jest w formacie `.pgn`, wyrzuca błąd.
   * @example
   * ```typescript
   * loadFile(event: Event): void {
   *  // ...
   *  }
   *  ```
   *  @example
   *  ```html
   *  <input type="file" (change)="loadFile($event)" />
   *  ```
   */
  loadFile(event : Event) : void {
   let input : HTMLInputElement = event.target as HTMLInputElement;
   if(input.files && input.files.length > 0) {
     let file : File = input.files[0];
     if(!file.name.endsWith('pgn')) throw new Error("Plik musi być w formacie PGN, a nie " + file.name.split('.').pop());
     let select : HTMLSelectElement = this.renderer.createElement('select');
     let option_dark : HTMLOptionElement = this.renderer.createElement('option');
     option_dark.value = 'Czarni';
     option_dark.textContent = 'Czarni';
     let option_light : HTMLOptionElement = this.renderer.createElement('option');
     option_light.value = 'Biali';
     option_light.textContent = 'Biali';
     select.appendChild(option_dark);
     select.appendChild(option_light);
     this.grandmasterFile = file;
     select.addEventListener('change', () : void => {
       this.kolorGracza = select.value.startsWith('Czarni') ? 'white' : 'black';
     });
     setTimeout(() : void => {
      let lastChild : HTMLElement = this.element.nativeElement.querySelector('.grandmaster > div:last-child')!;
      if(lastChild.childNodes.length > 1) lastChild.removeChild(lastChild.childNodes[1]);
      lastChild.appendChild(select);
     }, 10) // musi być timeout, bo inaczej dodaje do "wybierz plik"
   }
  }

  /**
   * @description Metoda dodająca `EventListener` do pionków, aby umożliwić ich przesuwanie.
   * @returns {void}
   * @description Umożliwia przesuwanie pionków na szachownicy za pomocą przeciągania i upuszczania.
   */
  attachDragEventListeners(): void {
  const pawns: NodeListOf<HTMLImageElement> = this.element.nativeElement.querySelectorAll('.pawns > img');
  pawns.forEach((pawn: HTMLImageElement): void => {
    pawn.addEventListener('dragstart', (event: DragEvent): void => {
      event.dataTransfer!.setData('text/plain', JSON.stringify({ pawn: pawn.alt }));
    });
  });
}
  /**
   * @description Metoda zmieniająca czas gry.
   * @param type - Typ czasu, który ma być ustawiony.
   * @returns {void}
   * @description Umożliwia zmianę czasu gry na szachownicy.
   */
  changeTime(type : number) : void {
    switch(type) {
    case 1:
      this.setTime(5400, 0, 1);
      break;
    case 2:
      this.setTime(600, 1, 0);
      break;
    }
  }

  /**
   * @description Metoda ustawiająca przyciski na szachownicy.
   * @param css - Klasa CSS przycisku, który ma być ustawiony.
   * @param selected - Indeks przycisku, który ma być ustawiony jako wybrany.
   * @param unselected - Indeks przycisku, który ma być ustawiony jako nie wybrany.
   * @private
   */
  private setButtons(css : string, selected : number, unselected : number) : void {
    let buttons : Array<HTMLElement> = this.element.nativeElement.querySelectorAll(`.${css}`);
    if(buttons.length === 0) return;
    buttons[selected].classList.add('selected');
    buttons[unselected].classList.remove('selected');
    buttons[selected].textContent = 'Wybrano';
    buttons[unselected].textContent = 'Wybierz';
  }
  private setTime(time: number, selectedIndex: number, unselectedIndex: number): void {
    this.universalTime = time;
    this.setButtons('time', selectedIndex, unselectedIndex);
  }

  /**
   * @description Metoda zmieniająca kolor gracza.
   * @param type - Typ koloru, który ma być ustawiony.
   * @returns {void}
   * @description Umożliwia zmianę koloru gracza na szachownicy.
   */
  changeColor(type : string) : void {
    switch (type) {
      case 'white':
        this.setButtons('kolor-button', 0, 1);
        break;
      case 'black':
        this.setButtons('kolor-button', 1, 0);
        break;
    }
    this.kolorGracza = type === 'white' ? 'white' : 'black';
  }

  /**
   * @description Metoda rozpoczynająca grę z przeciwnikiem.
   * @param userId
   */
  challengeUser(userId: string) : void {
    this.connection.initializeGame(userId, this.gameConstructor());
  }

  /**
   * @description Metoda zmieniająca mistrza.
   * @param type - Typ mistrza, który ma być ustawiony.
   * @returns {void}
   * @description Zmienia ona plik `.pgn` wbudowany w `assets`.
   * @throws {Error} - Jeśli nie znajduje się plik `.pgn`, wyrzuca błąd.
   */
  grandmasterChange(type : Event) : void {
    let target : HTMLSelectElement = type.target as HTMLSelectElement;
    let button : HTMLButtonElement = this.element.nativeElement.querySelector('.start') as HTMLButtonElement;
    if(target.value === 'NA') {
      button.disabled = true;
      return;
    } else {
      button.disabled = false;
    }
    let select : HTMLSelectElement = this.renderer.createElement('select');
    let option_dark : HTMLOptionElement = this.renderer.createElement('option');
    option_dark.value = 'Czarni';
    option_dark.textContent = 'Czarni';
    let option_light : HTMLOptionElement = this.renderer.createElement('option');
    option_light.value = 'Biali';
    option_light.textContent = 'Biali';
    select.appendChild(option_dark);
    select.appendChild(option_light);
    select.addEventListener('change', () : void => {
      this.kolorGracza = select.value === 'Czarni' ? 'white' : 'black';
    });
    setTimeout(() : void => {
      let lastChild : HTMLElement = this.element.nativeElement.querySelector('.grandmaster > div:last-child')!;
      if(lastChild.childNodes.length > 1) lastChild.removeChild(lastChild.childNodes[1]);
      lastChild.appendChild(select);
     }, 50) // musi być timeout, bo inaczej dodaje do "wybierz plik"
    try {
      this.http.get(`../../../assets/pgn/${target.value}.pgn`, { responseType: 'blob' }).subscribe((file: Blob) : void => {
        this.grandmasterFile = file as File;
      });
    } catch(e) {
      console.error("Błąd w odczytywaniu bazy danych.", e);
    }
  }
}
