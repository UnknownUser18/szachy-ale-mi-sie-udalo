import {Component, ElementRef, OnInit, Renderer2} from '@angular/core';
import {ChessPiece, ChessService, legalMove, MoveAttempt} from '../chess.service';

@Component({
  selector: 'app-szachownica',
  standalone: true,
  imports: [],
  templateUrl: './szachownica.component.html',
  styleUrl: './szachownica.component.css'
})
export class SzachownicaComponent implements OnInit {
  constructor(private chessService: ChessService, private renderer : Renderer2, private element : ElementRef) { }
  focusedPiece : HTMLElement | null = null;
  loadBoard() : void {
    let board : HTMLElement = this.element.nativeElement.querySelector('main');
    (board.childNodes as NodeListOf<HTMLElement>).forEach((row : HTMLElement) : void => {
      (row.childNodes as NodeListOf<HTMLElement>).forEach((cell : HTMLElement) : void => {
        if(!(cell.hasAttribute('data-row') && cell.hasAttribute('data-column'))) return;
        let row : number = parseInt(cell.getAttribute('data-row')!);
        let column : number = parseInt(cell.getAttribute('data-column')!);
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
        const pieceType = this.chessService.board[row][column]?.type.toString();
        const pieceColor = this.chessService.board[row][column]?.color.toString();
        if (pieceType && pieceColor) {
          cell.style.backgroundImage = `url(${pieces[pieceColor + '_' + pieceType]})`;
        }
      })
    })
  }
  ngOnInit() : void {
    let board : HTMLElement = this.element.nativeElement.querySelector('main');
    board.innerHTML = '';
    for (let i : number = 9 ; i > 0 ; i--) {
      let row : HTMLElement = this.renderer.createElement('div');
      for(let j : number = 0 ; j < 9 ; j++) {
        let element : HTMLElement = this.renderer.createElement('div');
        if(i === 9) {
          element.textContent = String.fromCharCode(64 + j);
        } else {
          if(j == 0) {
            element.textContent = String(i);
          } else {
            element.setAttribute('data-row', String(i-1));
            element.setAttribute('data-column', String(j-1));
            element.addEventListener('click', () : void => {
              if (this.focusedPiece) {
                this.focusedPiece.classList.remove('active');
                this.focusedPiece = null;
                let validCells: NodeListOf<HTMLElement> = this.element.nativeElement.querySelectorAll('.valid');
                validCells.forEach((cell: HTMLElement): void => {
                  cell.classList.remove('valid');
                })
              }
              element.classList.toggle('active');
              this.focusedPiece = element;
              let piece: ChessPiece | null = this.chessService.board[parseInt(element.getAttribute('data-row')!)][parseInt(element.getAttribute('data-column')!)];
              if (!piece) return;
              let legalMoves: legalMove[][] = this.chessService.calculateLegalMoves(piece);
              legalMoves.forEach((row_moves: Array<legalMove>, index_row: number): void => {
                row_moves.forEach((column_moves: legalMove, index_column: number): void => {
                  if (!column_moves.isLegal) return;
                  let validCell: HTMLElement = this.element.nativeElement.querySelector(`div[data-row="${index_row}"][data-column="${index_column}"]`);
                  validCell.classList.add('valid');
                })
              })
              let validCells: NodeListOf<HTMLElement> = this.element.nativeElement.querySelectorAll('.valid');
              validCells.forEach((cell: HTMLElement): void => {
                cell.addEventListener('click', (): void => {
                  let row: number = parseInt(cell.getAttribute('data-row')!);
                  let column: number = parseInt(cell.getAttribute('data-column')!);
                  let moveAttempt: MoveAttempt = {
                    from: {
                      row: parseInt(this.focusedPiece?.getAttribute('data-row')!)+3,
                      col: parseInt(this.focusedPiece?.getAttribute('data-column')!),
                    },
                    to: {
                      row: row+1,
                      col: column,
                    },
                  }
                  this.chessService.tryMove(moveAttempt);
                  this.loadBoard();
                  this.focusedPiece?.classList.remove('active');
                  this.focusedPiece = null;
                  let validCells: NodeListOf<HTMLElement> = this.element.nativeElement.querySelectorAll('.valid');
                  validCells.forEach((cell: HTMLElement): void => {
                    cell.classList.remove('valid');
                  })
                });
              })
            })
          }
        }
        this.renderer.appendChild(row, element);
      }
      this.renderer.appendChild(board, row);
    }
    this.loadBoard();
  }
}
