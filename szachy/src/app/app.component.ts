import { Component, ElementRef, Renderer2 } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import {SzachownicaComponent} from './szachownica/szachownica.component';
import { ChessService } from './chess.service';
import { ChessAiService } from './chess-ai.service';
import {ZegarComponent} from './zegar/zegar.component';
import {MenuComponent} from './menu/menu.component';
import {NgOptimizedImage} from '@angular/common';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, SzachownicaComponent, ZegarComponent, MenuComponent, NgOptimizedImage],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
  black : string = "black";
  white : string = "white";
  black_time : number = 0;
  white_time : number = 0;
  constructor(private chessService: ChessService, private chessAiService: ChessAiService, private renderer: Renderer2, private element: ElementRef) {
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
}
