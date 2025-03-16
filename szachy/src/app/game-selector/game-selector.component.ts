import {AfterViewInit, Component, ElementRef, Input, OnChanges, Output, Renderer2, SimpleChanges, EventEmitter} from '@angular/core';
import {NgIf} from '@angular/common';
import {GameType} from '../szachownica/szachownica.component';
import {FormsModule} from '@angular/forms';

@Component({
  selector: 'app-game-selector',
  standalone: true,
  imports: [
    NgIf,
    FormsModule
  ],
  templateUrl: './game-selector.component.html',
  styleUrls: ['./game-selector.component.css']
})
export class GameSelectorComponent implements OnChanges, AfterViewInit {
  @Input({ required: true }) game: GameType | undefined;
  @Output() whiteTime = new EventEmitter<number>();
  @Output() blackTime = new EventEmitter<number>();
  constructor(private renderer: Renderer2, private element: ElementRef) {}
  pawns : Array<string[]> = [
    ['cw','cs','cg','ch','ck','cg','cs','cw'],
    ['cp','cp','cp','cp','cp','cp','cp','cp'],
    ['','','','','','','',''],
    ['','','','','','','',''],
    ['','','','','','','',''],
    ['','','','','','','',''],
    ['bp','bp','bp','bp','bp','bp','bp','bp'],
    ['bw','bs','bg','bh','bk','bg','bs','bw']
  ]
  ai_difficulty : number = 2;
  grandmaster: string = 'NA';
  type = {
    GraczVsGracz: 'Gracz vs Gracz (1 komputer)',
    GraczVsSiec: 'Gracz vs Gracz (Sieć lokalna)',
    GraczVsGrandmaster: 'Gracz vs Grandmaster',
    GraczVsAi: 'Gracz vs Komputer',
  };
  ngAfterViewInit() : void {
    this.initializeChessboard().then(() : void => this.loadBoard());
  }
  async initializeChessboard() : Promise<void> {
    let chessboard : HTMLElement = this.element.nativeElement.querySelector('.chessboard');
    if(!chessboard) return;
    chessboard.innerHTML = '';
    for(let i : number = 0 ; i < 8 ; i++) {
      let row : HTMLElement = this.renderer.createElement('div');
      for(let j : number = 0 ; j < 8 ; j++) {
        let square : HTMLElement = this.renderer.createElement('div');
        row.appendChild(square);
      }
      chessboard.appendChild(row);
    }
  }
  loadBoard() : void {
    let chessboard : HTMLElement = this.element.nativeElement.querySelector('.chessboard');
    if(!chessboard) return;
    for(let i : number = 0 ; i < 8 ; i++) {
      for(let j : number = 0 ; j < 8 ; j++) {
        let element : HTMLElement = this.element.nativeElement.querySelector(`.chessboard > div:nth-child(${i+1}) > div:nth-child(${j+1})`)!;
        if(this.pawns[i][j] === '') {
          element.innerHTML = '';
          element.classList.remove('pawn');
        } else {
          if(!element.firstChild) {
            element.classList.add('pawn')
            let img : HTMLImageElement = this.renderer.createElement('img')
            img.src = `assets/${this.pawns[i][j]}.svg`;
            img.draggable = true;
            img.addEventListener('dragstart', (event: DragEvent): void => {
              event.dataTransfer!.setData('text/plain', JSON.stringify({ fromRow: i, fromCol: j }));
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
          this.movePiece(data.fromRow, data.fromCol, i, j);
        });
        }
      }
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
      console.log(changes['game']);
      this.pawns = [
        ['cw','cs','cg','ch','ck','cg','cs','cw'],
        ['cp','cp','cp','cp','cp','cp','cp','cp'],
        ['','','','','','','',''],
        ['','','','','','','',''],
        ['','','','','','','',''],
        ['','','','','','','',''],
        ['bp','bp','bp','bp','bp','bp','bp','bp'],
        ['bw','bs','bg','bh','bk','bg','bs','bw']
      ];
      if(changes['game'].previousValue === 'GraczVsGrandmaster') {
        setTimeout(() : void => {
          this.grandmaster = 'NA';
          let chessboard : HTMLElement = this.renderer.createElement('div');
          chessboard.classList.add('chessboard');
          let chess : HTMLElement = this.element.nativeElement.querySelector('.chess');
          chess.appendChild(chessboard);
          this.initializeChessboard().then(() : void => this.loadBoard());
        }, 10)
        return;
      }
      this.initializeChessboard().then(() : void => this.loadBoard());
    }
  }

  startGame() : void {
    console.log('Starting Game');
  }

  loadFile(event: Event) : void {
    console.log("Loading PGN file");
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
    this.whiteTime.emit(time);
    this.blackTime.emit(time);
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
  }
}
