import { Component, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { PieceType, PieceColor} from '../chess.service';
import {NgForOf} from '@angular/common';

const pieces: { [key: string]: string } = {
  'black_pawn': `assets/cp.svg`,
  'white_pawn': `assets/bp.svg`,
  'black_rook': `assets/cw.svg`,
  'white_rook': `assets/bw.svg`,
  'black_knight': `assets/cs.svg`,
  'white_knight': `assets/bs.svg`,
  'black_bishop': `assets/cg.svg`,
  'white_bishop': `assets/bg.svg`,
  'black_queen': `assets/ch.svg`,
  'white_queen': `assets/bh.svg`,
  'black_king': `assets/ck.svg`,
  'white_king': `assets/bk.svg`
};

@Component({
  selector: 'app-pawn-promotion',
  templateUrl: './pawn-promotion.component.html',
  standalone: true,
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
