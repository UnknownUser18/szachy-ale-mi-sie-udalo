import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule } from '@angular/material/dialog';
import { CommonModule } from '@angular/common';
import {MatIcon} from '@angular/material/icon';

@Component({
  selector: 'app-game-invite-dialog',
  standalone: true,
  imports: [MatDialogModule, MatButtonModule, CommonModule, MatIcon],
  templateUrl: './game-invite-dialog.component.html',
  styleUrls: ['./game-invite-dialog.component.css']
})
export class GameInviteDialogComponent {
  constructor(public dialogRef: MatDialogRef<GameInviteDialogComponent>, @Inject(MAT_DIALOG_DATA) public data: GameInviteDialogData) {}

  /**
   * @description Metoda zamykająca okno dialogowe z odpowiedzią "accept".
   */
  onAccept(): void {
    this.dialogRef.close({ response: 'accept', inviteId: this.data.inviteId });
  }

  /**
   * @description Metoda zamykająca okno dialogowe z odpowiedzią "reject".
   */
  onReject(): void {
    this.dialogRef.close({ response: 'reject', inviteId: this.data.inviteId });
  }
}

/**
 * @interface GameInviteDialogData
 * @description Interfejs definiujący dane przekazywane do okna dialogowego zaproszenia do gry.
 * @property {string} inviterUsername - Nazwa użytkownika zapraszającego.
 * @property {string} inviteId - Identyfikator zaproszenia.
 * @example
 */
export interface GameInviteDialogData {
  inviterUsername: string;
  inviteId: string;
}
