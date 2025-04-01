import { Component } from '@angular/core';
import {ChessService} from '../chess.service';
import {LocalConnectionService} from '../local-connection.service';

@Component({
  selector: 'app-undo-move',
  imports: [],
  templateUrl: './undo-move.component.html',
  styleUrl: './undo-move.component.css'
})
export class UndoMoveComponent {

  constructor(public chessService: ChessService, public connection: LocalConnectionService) {

  }

  handleUndoMove(data: Event) {
    if(this.chessService.gameStart.value.type === 'GraczVsGracz')
    {
      this.chessService.undoMove()
      return;
    }
    if(this.chessService.gameStart.value.mainPlayerColor === this.chessService.currentTurnColor.value) return;
    this.chessService.undoMove()
    if(this.chessService.gameStart.value.type === 'GraczVsSiec')
      this.connection.requestUndoMove();
  }

}
