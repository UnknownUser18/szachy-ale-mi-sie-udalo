import { Component, ElementRef, Renderer2, ViewChild, ViewContainerRef } from '@angular/core';
import {Game, GameType, SzachownicaComponent} from './szachownica/szachownica.component';
import { ChessService } from './chess.service';
import { ChessAiService } from './chess-ai.service';
import {ZegarComponent} from './zegar/zegar.component';
import {MenuComponent} from './menu/menu.component';
import {NgOptimizedImage} from '@angular/common';
import { GameSelectorComponent } from './game-selector/game-selector.component';
import { NotationComponent } from './notation/notation.component';
import {NerdViewComponent} from './nerd-view/nerd-view.component';
import {PositionEvaluatorComponent} from './position-evaluator/position-evaluator.component';
// import {LocalGameComponent} from './local-game/local-game.component';
// import {GameEndComponent} from './game-end/game-end.component';

export let pieces: { [key: string]: string } = {
  'black_pawn': `assets/pieces/cp.svg`,
  'white_pawn': `assets/pieces/bp.svg`,
  'black_rook': `assets/pieces/cw.svg`,
  'white_rook': `assets/pieces/bw.svg`,
  'black_knight': `assets/pieces/cs.svg`,
  'white_knight': `assets/pieces/bs.svg`,
  'black_bishop': `assets/pieces/cg.svg`,
  'white_bishop': `assets/pieces/bg.svg`,
  'black_queen': `assets/pieces/ch.svg`,
  'white_queen': `assets/pieces/bh.svg`,
  'black_king': `assets/pieces/ck.svg`,
  'white_king': `assets/pieces/bk.svg`
}
@Component({
    selector: 'app-root',
  imports: [SzachownicaComponent, ZegarComponent, MenuComponent, NgOptimizedImage, GameSelectorComponent, NerdViewComponent, NotationComponent, PositionEvaluatorComponent],
    templateUrl: './app.component.html',
    styleUrl: './app.component.css',
})
export class AppComponent {
  gameType : GameType | null = null;
  game : Game | null = null;
  black : string = "black";
  white : string = "white";
  initialTime: number = 5400;
  whiteTime: number = this.initialTime;
  blackTime: number = this.initialTime;
  currentTimer: 'white' | 'black' = 'white';
  timerInterval: any;

  @ViewChild('gameSelectorContainer', { read: ViewContainerRef, static: true }) gameSelectorContainer!: ViewContainerRef;
    constructor(
    private chessService: ChessService,
    private chessAiService: ChessAiService,
    private renderer: Renderer2,
    private element: ElementRef
  ) {
    this.chessService.setAiService(this.chessAiService);
    this.chessService.gameStart.subscribe((game : Game) : void => {
      this.game = game;
      this.selectGame(null);
    })
  }

  protected convert_name() : void {
    let h1 : HTMLElement = this.element.nativeElement.querySelector('h1');
    if(h1.textContent! == "Szachy") {
      h1.textContent = "szachy-ale-mi-sie-udalo";
    } else {
      h1.textContent = "Szachy";
    }
  }


  selectGame(game: GameType | null): void {
    let chessboard: HTMLElement = this.element.nativeElement.querySelector('main > div');
    let zegar: NodeListOf<HTMLElement> = this.element.nativeElement.querySelectorAll('app-zegar');
    this.gameType = game;
    if(!chessboard) return;
    if (game === null) {
      this.renderer.setStyle(chessboard, 'display', 'flex');
      zegar.forEach((z: HTMLElement): void => {
        this.renderer.setStyle(z, 'display', 'block');
      });
    } else if (chessboard.childNodes && chessboard.childNodes[1].nodeName.toLowerCase() === 'app-szachownica' && zegar) {
      this.game = null;
      this.renderer.setStyle(chessboard, 'display', 'none');
      zegar.forEach((z: HTMLElement): void => {
        this.renderer.setStyle(z, 'display', 'none');
      });
    }

  }
  setGame(game : Game) : void {
    this.game = game;
    this.initialTime = game.duration ? game.duration  : 600;
    // alert(this.whiteTime)
    this.resetTimers();
    this.startTimer();
  }

  resetTimers(): void {
    this.whiteTime = this.initialTime;
    this.blackTime = this.initialTime;
    clearInterval(this.timerInterval);
    this.currentTimer = 'white';
  }


  setTime(minutes: number): void {
    this.initialTime = minutes * 60;
    this.resetTimers();
  }

  startTimer(): void {
    clearInterval(this.timerInterval);
    this.timerInterval = setInterval(() => {
      if (this.currentTimer === 'white') {
        this.whiteTime--;
      } else if(this.currentTimer === 'black') {
        this.blackTime--;
      }
      if ((this.whiteTime <= 0 || this.blackTime <= 0)) {
        this.onTimeEnded(this.currentTimer);
      }
    }, 1000);
  }

  switchTimer(): void {
    this.currentTimer = this.currentTimer === 'white' ? 'black' : 'white';
    this.startTimer();
  }

  onTimeEnded(color: 'white' | 'black'): void {
    clearInterval(this.timerInterval);
    console.log(`Czas gracza ${color} się skończył!`);

  }
}
