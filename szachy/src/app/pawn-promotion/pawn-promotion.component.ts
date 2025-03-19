import { Component, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { PieceType, PieceColor} from '../chess.service';
import {NgForOf} from '@angular/common';
import { pieces } from '../app.component';

@Component({
    selector: 'app-pawn-promotion',
    templateUrl: './pawn-promotion.component.html',
    imports: [
        NgForOf
    ],
    styleUrls: ['./pawn-promotion.component.css']
})
export class PawnPromotionComponent {
  promotionOptions: PieceType[] = ['rook', 'knight', 'bishop', 'queen'];
  hoveredPiece: PieceType | null = null;

  constructor(
    public dialogRef: MatDialogRef<PawnPromotionComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { color: PieceColor }
  ) {}

  getPieceImage(piece: PieceType): string {
    return pieces[`${this.data.color}_${piece}`] || '';
  }

  selectPiece(piece: PieceType): void {
    this.dialogRef.close(piece);
  }

  hoverPiece(piece: PieceType | null): void {
    this.hoveredPiece = piece;
  }
}
