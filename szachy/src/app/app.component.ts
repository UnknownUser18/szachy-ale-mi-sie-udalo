import { Component, ElementRef, Renderer2, ViewChild, ViewContainerRef } from '@angular/core';
import {GameType, SzachownicaComponent} from './szachownica/szachownica.component';
import { ChessService } from './chess.service';
import { ChessAiService } from './chess-ai.service';
import {ZegarComponent} from './zegar/zegar.component';
import {MenuComponent} from './menu/menu.component';
import {NgIf, NgOptimizedImage} from '@angular/common';
import { GameSelectorComponent } from './game-selector/game-selector.component';

export let pieces: { [key: string]: string } = {
  'black_pawn': `assets/cp.svg`,
  'white_pawn': `assets/bp.svg`,
  'black_rook': `assets/cw.svg`,
  'white_rook': `assets/bw.svg`,
  'black_knight': `assets/cs.svg`,
  'white_knight': `assets/bs.svg`,
  'black_bishop': `assets/cg.svg`,
  'white_bishop': `assets/bg.svg`,
  'black_queen': `assets/ch.svg`,
  'white_queen': `assets/bh.svg`,
  'black_king': `assets/ck.svg`,
  'white_king': `assets/bk.svg`
}
@Component({
    selector: 'app-root',
    imports: [SzachownicaComponent, ZegarComponent, MenuComponent, NgOptimizedImage, GameSelectorComponent, NgIf],
    templateUrl: './app.component.html',
    styleUrl: './app.component.css'
})
export class AppComponent {
  game : GameType | null = null;
  black : string = "black";
  white : string = "white";
  black_time : number = 0;
  white_time : number = 0;

  @ViewChild('gameSelectorContainer', { read: ViewContainerRef, static: true }) gameSelectorContainer!: ViewContainerRef;
    constructor(
    private chessService: ChessService,
    private chessAiService: ChessAiService,
    private renderer: Renderer2,
    private element: ElementRef
  ) {
    this.chessService.setAiService(this.chessAiService);
  }

  protected convert_name() : void {
    let h1 : HTMLElement = this.element.nativeElement.querySelector('h1');
    if(h1.textContent! == "Szachy") {
      h1.textContent = "szachy-ale-mi-sie-udalo";
    } else {
      h1.textContent = "Szachy";
    }
  }

  selectGame(game: GameType): void {
    let chessboard : HTMLElement = this.element.nativeElement.querySelector('main');
    let zegar : Array<ZegarComponent> = this.element.nativeElement.querySelectorAll('app-zegar');
    if(chessboard.childNodes[1].nodeName.toLowerCase() === 'app-szachownica' && zegar) {
      this.renderer.removeChild(this.element.nativeElement, chessboard);
      zegar.forEach((z : ZegarComponent) : void => {
        this.renderer.removeChild(this.element.nativeElement, z);
      });
    }
    this.game = game;
  }

  changeTime(time : number, color : string) : void {
    switch(color) {
      case 'black':
        this.black_time = time;
        break;
      case 'white':
        this.white_time = time;
        break;
    }
  }
}
