import { Component, Output, EventEmitter } from '@angular/core';
import { GameType } from '../szachownica/szachownica.component';

@Component({
  selector: 'app-menu',
  standalone: true,
  imports: [],
  templateUrl: './menu.component.html',
  styleUrl: './menu.component.css'
})
export class MenuComponent {
  @Output() game_selected : EventEmitter<GameType> = new EventEmitter<GameType>();
  public select_game(event: MouseEvent) : void {
    let target : HTMLElement = event.target as HTMLElement;
    if(target.tagName === "UL") return;
    if(target.tagName === "EM")
      target = target.parentElement as HTMLElement;
    this.game_selected.emit(target.getAttribute("data-game") as GameType);
  }
}
