import {Component, ElementRef, OnInit, ViewChild, ViewContainerRef} from '@angular/core';
import {Game, GameType, SzachownicaComponent} from './szachownica/szachownica.component';
import {ChessService, MoveAttempt} from './chess.service';
import { ChessAiService } from './chess-ai.service';
import {ZegarComponent} from './zegar/zegar.component';
import {MenuComponent} from './menu/menu.component';
import {NgOptimizedImage} from '@angular/common';
import { GameSelectorComponent } from './game-selector/game-selector.component';
import {LocalGameComponent} from './local-game/local-game.component';
import { NotationComponent } from './notation/notation.component';
import {NerdViewComponent} from './nerd-view/nerd-view.component';
import {PositionEvaluatorComponent} from './position-evaluator/position-evaluator.component';
import {PodpowiedziComponent} from './podpowiedzi/podpowiedzi.component';
import { TimerService } from './timer.service';
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
    imports: [SzachownicaComponent, ZegarComponent, MenuComponent, NgOptimizedImage, GameSelectorComponent, NerdViewComponent, NotationComponent, LocalGameComponent, PositionEvaluatorComponent, PodpowiedziComponent],
    templateUrl: './app.component.html',
    styleUrl: './app.component.css',
})
export class AppComponent implements OnInit {
  moves : any
  gameType : GameType | null = null;
  moveOccured : string | undefined;
  game : Game | null = null;
  black : string = "black";
  white : string = "white";


  @ViewChild('gameSelectorContainer', { read: ViewContainerRef, static: true }) gameSelectorContainer!: ViewContainerRef;
    constructor(
    private chessService: ChessService,
    private chessAiService: ChessAiService,
    public timerService: TimerService,
    private element: ElementRef
  ) {
    this.chessService.setAiService(this.chessAiService);
    this.chessService.gameStart.subscribe((game : Game) : void => {
      this.gameType = game.type;
      this.game = game;
    })
      this.chessService.gameClose.subscribe(() : void => {
        this.game = null;
      })
  }
  ngOnInit() : void {
      this.gameType = null;
      this.game = null;
  }

  protected convert_name() : void {
    let h1 : HTMLElement = this.element.nativeElement.querySelector('h1');
    if(h1.textContent! == "Szachy") {
      h1.textContent = "szachy-ale-mi-sie-udalo";
    } else {
      h1.textContent = "Szachy";
    }
  }


  selectGame(game: GameType | null) : void {
    this.game = null;
    this.gameType = game;
  }
  setGame(game : Game) : void {
    this.game = game;
    this.timerService.setTime(game.duration)
    this.timerService.resetTimers();
    this.timerService.startTimer();
  }


  setMoves(data : any) : void {
    this.moves = data;
  }

  setMove(data : string) : void {
      console.log(data);
    this.moveOccured = data;
  }
}
