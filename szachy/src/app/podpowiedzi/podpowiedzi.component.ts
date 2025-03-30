import {Component, Input, OnChanges, SimpleChanges} from '@angular/core';
import { MoveAttempt } from '../chess.service';
import { ChessAiService } from '../chess-ai.service';
@Component({
  selector: 'app-podpowiedzi',
  imports: [],
  templateUrl: './podpowiedzi.component.html',
  styleUrl: './podpowiedzi.component.css'
})
export class PodpowiedziComponent implements OnChanges {
  bestBlackMove: MoveAttempt | undefined;
  bestWhiteMove: MoveAttempt | undefined;
  rows: string[] = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
  @Input() moveOccurred!: string | undefined;
  constructor(protected chessAiService: ChessAiService) {}
  ngOnChanges(changes: SimpleChanges): void {
    console.log(changes);
    if(changes['moveOccurred']) {
      this.bestBlackMove = this.chessAiService.findBestMove('black', 3)!;
      this.bestWhiteMove = this.chessAiService.findBestMove('white', 3)!;
      console.log(this.bestWhiteMove, this.bestBlackMove)
    }
  }
}
