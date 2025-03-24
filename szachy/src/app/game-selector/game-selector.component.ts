import {AfterViewInit, Component, ElementRef, Input, OnChanges, Output, Renderer2, SimpleChanges, EventEmitter} from '@angular/core';
import {NgForOf, NgIf, NgOptimizedImage} from '@angular/common';
import {Game, GameType} from '../szachownica/szachownica.component';
import {FormsModule} from '@angular/forms';
import {HttpClient} from '@angular/common/http';
import {ChessService,ChessPiece, PieceColor, PieceType} from '../chess.service';

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
  @Input({ required: true }) game: GameType | undefined;
  @Output() time : EventEmitter<number> = new EventEmitter<number>();
  universalTime: number = 0;
  kolorGracza: PieceColor = 'white';
  constructor(private renderer: Renderer2, private element: ElementRef, private chessService: ChessService, private http : HttpClient) {}
  pawns : Array<string[]> = this.defaultChessBoard();
  pawns_string : string[] = ['cw','cs','cg','ch','ck','cp','bw','bs','bg','bh','bk','bp'];
  pawns_names: { [key: string]: string } = {
    'cw': 'Czarna Wieża', 'cs': 'Czarny Skoczek', 'cg': 'Czarny Goniec', 'ch': 'Czarny Hetman', 'ck': 'Czarny Król', 'cp': 'Czarny Pionek',
    'bw': 'Biała Wieża', 'bs': 'Biały Skoczek', 'bg': 'Biały Goniec', 'bh': 'Biały Hetman', 'bk': 'Biały Król', 'bp': 'Biały Pionek'
  };
  mainPlayerColor : string = 'white';
  ai_difficulty : number = 2;
  black_grandmaster: string | undefined = undefined;
  white_grandmaster: string | undefined = undefined;
  type : { [key in GameType] : string } = {
    GraczVsGracz: 'Gracz vs Gracz (1 komputer)',
    GraczVsSiec: 'Gracz vs Gracz (Sieć lokalna)',
    GraczVsGrandmaster: 'Gracz vs Grandmaster',
    GraczVsAi: 'Gracz vs Komputer',
  };
  grandmasterFile : File | null = null;
  ngAfterViewInit() : void {
    this.initializeChessboard().then(() : void => this.loadBoard());
    const pawns: NodeListOf<HTMLImageElement> = this.element.nativeElement.querySelectorAll('.pawns img');
    pawns.forEach((pawn: HTMLImageElement) : void => {
      pawn.addEventListener('dragstart', (event: DragEvent): void => {
        event.dataTransfer!.setData('text/plain', JSON.stringify({ pawn: pawn.alt }));
      });
    });
    const chessboard: HTMLElement = this.element.nativeElement.querySelector('.chess');
    if(!chessboard) return;
    chessboard.addEventListener('dragover', (event: DragEvent): void => {
      event.preventDefault();
    });
    chessboard.addEventListener('drop', (event: DragEvent): void => {
      event.preventDefault();
      const data = JSON.parse(event.dataTransfer!.getData('text/plain'));
      if(!(data.fromCol !== undefined && data.fromRow !== undefined)) return; // musi być sprawdzane, gdy jest undefined, bo inaczej 0 == false
      this.pawns[parseInt(data.fromRow)][parseInt(data.fromCol)] = '';
      this.loadBoard();
    });
    this.setTime(5400, 0, 1);
    this.chessService.currentTurnColor.next('white');
  }
  async initializeChessboard() : Promise<void> {
    let chessboard : HTMLElement = this.element.nativeElement.querySelector('.chessboard');
    if(!chessboard) return;
    chessboard.innerHTML = '';
    for(let i : number = 0 ; i < 8 ; i++) {
      let row : HTMLElement = this.renderer.createElement('div');
      for(let j : number = 0 ; j < 8 ; j++) {
        let square : HTMLElement = this.renderer.createElement('div');
        square.setAttribute('data-row', i.toString());
        square.setAttribute('data-col', j.toString());
        row.appendChild(square);
      }
      chessboard.appendChild(row);
    }
  }

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

  loadBoard() : void {
    let chessboard: HTMLElement = this.element.nativeElement.querySelector('.chessboard');
    if (!chessboard) return;
    for (let i: number = 0; i < 8; i++) {
      for (let j: number = 0; j < 8; j++) {
        let element: HTMLElement = this.element.nativeElement.querySelector(`.chessboard > div:nth-child(${i + 1}) > div:nth-child(${j + 1})`)!;
        if (this.pawns[i][j] === '') {
          element.innerHTML = '';
          element.classList.remove('pawn');
        } else {
          if (!element.firstChild) {
            element.classList.add('pawn')
            let img: HTMLImageElement = this.renderer.createElement('img')
            img.src = `assets/${this.pawns[i][j]}.svg`;
            img.draggable = true;
            img.addEventListener('dragstart', (event: DragEvent): void => {
              event.dataTransfer!.setData('text/plain', JSON.stringify({fromRow: i, fromCol: j}));
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
  }


  transformChessBoard(board: Array<string[]>): (ChessPiece | null)[][] {
    const colorDictionary: { [key: string]: PieceColor | null } = { 'c': 'black', 'b': 'white', '': null };
    const pieceTypeDictionary: { [key: string]: PieceType | null } = {
      'p': 'pawn',
      'r': 'rook',
      's': 'knight',
      'g': 'bishop',
      'h': 'queen',
      'k': 'king',
      'w': 'rook',
      '': null
    };
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
    console.log(board, chessBoard)
    return chessBoard
  }


  movePiece(fromRow: number, fromCol: number, toRow: number, toCol: number): void {
  if (this.pawns[toRow][toCol] === '') {
    this.pawns[toRow][toCol] = this.pawns[fromRow][fromCol];
    this.pawns[fromRow][fromCol] = '';
    this.loadBoard();
  }
}
  ngOnChanges(changes: SimpleChanges): void {
    if (changes['game']) {
      this.pawns = this.defaultChessBoard()
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

  startGame() : void {
    console.log('Starting Game');
    let gameAttributes: Game = {
      board: this.transformChessBoard(this.pawns) ?? this.transformChessBoard(this.pawns),
      type: this.game ?? 'GraczVsGracz',
      duration: this.universalTime,
      mainPlayerColor: this.kolorGracza,
      grandmaster: this.grandmasterFile ?? undefined,
      difficulty: this.ai_difficulty ?? undefined
    }
    if(this.game === 'GraczVsGrandmaster') {
      gameAttributes.mainPlayerColor = this.mainPlayerColor as PieceColor;
      if(this.mainPlayerColor === 'white') {
        gameAttributes.black_player = this.black_grandmaster;
        gameAttributes.white_player = 'Gracz';
      } else {
        gameAttributes.white_player = this.white_grandmaster;
        gameAttributes.black_player = 'Gracz';
      }
    }
    this.chessService.startGame(gameAttributes);
  }

  loadFile(event : Event) : void {
   let input : HTMLInputElement = event.target as HTMLInputElement;
   if(input.files && input.files.length > 0) {
     let file : File = input.files[0];
     if(!file.name.endsWith('pgn')) throw new Error("Plik musi być w formacie PGN, a nie " + file.name.split('.').pop());
     let reader : FileReader = new FileReader();
     let select : HTMLSelectElement = this.renderer.createElement('select');
     reader.onload = () : void => {
       let fileContent : string[] = (reader.result as string).split('\n');
       let option_default : HTMLOptionElement = this.renderer.createElement('option');
       option_default.value = 'NA';
       option_default.textContent = 'Wybierz przeciwnika:';
       option_default.selected = true;
       option_default.disabled = true;
       select.appendChild(option_default);
       fileContent.forEach((line : string) : void => {
         let option : HTMLOptionElement = this.renderer.createElement('option');
         if(line.startsWith('[White ')) {
           let value : string = `Biali : ${line.split('"')[1]}`;
           option.value = value;
           option.textContent = value;
           this.white_grandmaster = line.split('"')[1];
           select.appendChild(option);
         } else if(line.startsWith('[Black ')) {
           let value : string = `Czarni : ${line.split('"')[1]}`;
           option.value = value;
           option.textContent = value;
           this.black_grandmaster = line.split('"')[1];
           select.appendChild(option);
         }
       });
     }
     reader.readAsText(file);
     this.grandmasterFile = file;
     select.addEventListener('change', () : void => {
       this.mainPlayerColor = select.value.startsWith('Czarni') ? 'white' : 'black';
     });
     setTimeout(() : void => {
      let lastChild : HTMLElement = this.element.nativeElement.querySelector('.grandmaster > div:last-child')!;
      if(lastChild.childNodes.length > 1) lastChild.removeChild(lastChild.childNodes[1]);
      lastChild.appendChild(select);
     }, 10) // musi być timeout, bo inaczej dodaje do "wybierz plik"
   }
  }
  attachDragEventListeners(): void {
  const pawns: NodeListOf<HTMLImageElement> = this.element.nativeElement.querySelectorAll('.pawns > img');
  pawns.forEach((pawn: HTMLImageElement): void => {
    pawn.addEventListener('dragstart', (event: DragEvent): void => {
      event.dataTransfer!.setData('text/plain', JSON.stringify({ pawn: pawn.alt }));
    });
  });
}
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
  private setButtons(css : string, selected : number, unselected : number) : void {
    let buttons : Array<HTMLElement> = this.element.nativeElement.querySelectorAll(`.${css}`);
    buttons[selected].classList.add('selected');
    buttons[unselected].classList.remove('selected');
    buttons[selected].textContent = 'Wybrano';
    buttons[unselected].textContent = 'Wybierz';
  }
  private setTime(time: number, selectedIndex: number, unselectedIndex: number): void {
    this.universalTime = time;
    this.setButtons('time', selectedIndex, unselectedIndex);
  }

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
  grandmasterChange(type : Event) : void {
    let target : HTMLSelectElement = type.target as HTMLSelectElement;
    if(target.value === 'NA') return;
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
      this.mainPlayerColor = select.value === 'Czarni' ? 'white' : 'black';
    });
    setTimeout(() : void => {
      let lastChild : HTMLElement = this.element.nativeElement.querySelector('.grandmaster > div:last-child')!;
      if(lastChild.childNodes.length > 1) lastChild.removeChild(lastChild.childNodes[1]);
      lastChild.appendChild(select);
     }, 10) // musi być timeout, bo inaczej dodaje do "wybierz plik"
    try {
      this.http.get(`../../../assets/pgn/${target.value}.pgn`, { responseType: 'blob' }).subscribe((file: Blob) : void => {
        this.grandmasterFile = file as File;
      });
    } catch(e) {
      console.error("Błąd w odczytywaniu bazy danych.", e);
    }
  }
}
