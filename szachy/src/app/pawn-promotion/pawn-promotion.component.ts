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


  /**
   * @method getPieceImage
   * @description Wyszukuje adres zdjęcia, które chcemy wyświetlić dla konkretnego typu bierki
   * @param {PieceType} piece - Typ bierki, dla którego chcemy znaleźć zdjęcie
   * @returns {string} Adres zdjęcia
   */
  getPieceImage(piece: PieceType): string {
    return pieces[`${this.data.color}_${piece}`] || '';
  }

  /**
   * @method selectPiece
   * @description Kończy dialog i zwraca wybrany typ bierki
   * @param {PieceType} piece - Typ bierki wybrany przez użytkownika
   * @returns {void}
   */
  selectPiece(piece: PieceType): void {
    this.dialogRef.close(piece);
  }

  /**
   * @method hoverPiece
   * @description Przypisanie typu bierki do zmiennej 'hoveredPiece', nad którym znajduje się myszka
   * @param {PieceType | null} piece - Typ bierki (lub nie), nad którym aktualnie znajduje się myszka
   * @returns {void}
   */
  hoverPiece(piece: PieceType | null): void {
    this.hoveredPiece = piece;
  }
}
