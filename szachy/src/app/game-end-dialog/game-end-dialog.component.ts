import { Component, Inject } from '@angular/core';
import {
  MAT_DIALOG_DATA,
  MatDialogActions, MatDialogClose,
  MatDialogContent,
  MatDialogRef,
  MatDialogTitle
} from '@angular/material/dialog';
import {MatIcon} from '@angular/material/icon';
import {NgIf, NgSwitch, NgSwitchCase} from '@angular/common';
import {MatButton} from '@angular/material/button';
import {GameEndType} from '../chess.service';
export type GameResult = 'warning' | 'victory' | 'draw';
@Component({
  selector: 'app-game-end-dialog',
  templateUrl: './game-end-dialog.component.html',
  imports: [
    MatIcon,
    NgSwitchCase,
    NgSwitch,
    MatDialogContent,
    MatDialogActions,
    NgIf,
    MatDialogTitle,
    MatButton,
    MatDialogClose
  ],
  styleUrls: ['./game-end-dialog.component.css']
})
export class GameEndDialogComponent {
  titleMap = {
    'check': 'Szach!',
    'mate': 'Mat!',
    'stalemate': 'Pat!',
    'draw-repetition': 'Remis - Powtórzenia',
    'draw-50-moves': 'Remis - 50 Posunięć',
    'none': ''
  };

  messageMap = {
    'check': 'Twój król jest zagrożony!',
    'mate': 'Gracz {winner} wygrywa partię!',
    'stalemate': 'Brak możliwych ruchów - Remis!',
    'draw-repetition': 'Trzykrotne powtórzenie pozycji',
    'draw-50-moves': '50 posunięć bez bicia lub ruchu pionem',
    'none': ''
  };

  iconMap = {
    'check': 'error_outline',
    'mate': 'emoji_events',
    'stalemate': 'hourglass_empty',
    'draw-repetition': 'replay',
    'draw-50-moves': 'numbers',
    'none': ''
  };

  constructor(
    public dialogRef: MatDialogRef<GameEndDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { type: GameEndType, winner?: string },
  ) {
  }

  get formattedMessage(): string {
    return this.messageMap[this.data.type].replace('{winner}', this.data.winner || '');
  }

  handleAction(action: string): void {
    this.dialogRef.close(action);
  }
  get resultType(): GameResult {
    switch(this.data.type) {
      case 'check': return 'warning';
      case 'mate': return 'victory';
      default: return 'draw';
    }
  }

}
