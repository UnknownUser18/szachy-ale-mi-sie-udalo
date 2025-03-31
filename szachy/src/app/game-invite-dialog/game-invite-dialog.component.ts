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
  constructor(
    public dialogRef: MatDialogRef<GameInviteDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: GameInviteDialogData
  ) {}

  onAccept(): void {
    this.dialogRef.close({ response: 'accept', inviteId: this.data.inviteId });
  }

  onReject(): void {
    this.dialogRef.close({ response: 'reject', inviteId: this.data.inviteId });
  }
}

export interface GameInviteDialogData {
  inviterUsername: string;
  inviteId: string;
}
