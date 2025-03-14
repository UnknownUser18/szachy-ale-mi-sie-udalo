import { Component, OnInit, Renderer2, ElementRef } from '@angular/core';
import { ChessPiece, legalMove, MoveAttempt, PieceColor, Position } from '../chess.model';
import { ChessService } from '../chess.service';

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
  focusedChessPiece : ChessPiece | null = null;
  focusedLegalMoves : legalMove[][] = [];
  focusedColor: PieceColor = 'white';
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
        else
          cell.style.backgroundImage = '';
      })
    })
  }

  logFocused()
  {
    console.log(this.focusedPiece, this.focusedColor, this.focusedChessPiece, this.focusedLegalMoves)
  }


  styleLegalMoves(board: HTMLElement): void {
    for(let index_row = 0; index_row < 8; index_row++)
      for(let index_column = 0; index_column < 8; index_column++) {
        if(!this.focusedLegalMoves[index_row]){
          board.querySelectorAll('.valid').forEach((cell : Element) => {cell.classList.remove('valid')});
          break;
        }
        this.focusedLegalMoves[index_row][index_column].isLegal ? board.querySelector(`div[data-row="${index_row}"][data-column="${index_column}"]`)!.classList.add('valid') :  board.querySelector(`div[data-row="${index_row}"][data-column="${index_column}"]`)!.classList.remove('valid');
      }
    board.querySelectorAll('.active').forEach((cell: Element) => {cell.classList.remove('active')})
    if(this.focusedChessPiece) this.focusedPiece!.classList.add('active');
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
            element.addEventListener('click', (event) : void => {
              let position: Position = {row: parseInt(element.getAttribute('data-row')!), col: parseInt(element.getAttribute('data-column')!)}
              let piece: ChessPiece | null = this.chessService.getPieceFromPosition(position);
              console.log(piece, position);
              if(piece && piece.color === this.focusedColor) {
                this.focusedChessPiece = piece;
                this.focusedPiece = element;
                let legalMoves = this.chessService.getLegalMovesForColor(piece.color).find((distinctPieceLegalMoves: { piece: ChessPiece, legalMoves: legalMove[][] }) => distinctPieceLegalMoves.piece === piece)?.legalMoves
                if(!(legalMoves && legalMoves.length > 0))
                {
                  console.log(legalMoves)
                  return;
                }
                this.chessService.logChessBoard()
                console.log(legalMoves)
                this.focusedLegalMoves = legalMoves;
                this.styleLegalMoves(board)
                return;
              }
              console.log(this.focusedPiece, piece, position);
              this.logFocused()
              let target = this.chessService.getPieceFromPosition(position);
              if(!this.focusedLegalMoves[position.row]) return;
              if(!this.focusedLegalMoves[position.row][position.col].isLegal)
              {
                this.focusedPiece = null;
                this.focusedChessPiece = null;
                this.focusedLegalMoves = [];
                this.logFocused()
                this.styleLegalMoves(board)
                console.error('Próba zrobienia ruchu poza legalnymi ruchami!')
                return
              }

              this.logFocused()
              if(!(target === null || target.color !== this.focusedChessPiece?.color)) return;

              let moveAttempt: MoveAttempt = {from: {...this.focusedChessPiece!.position}, to: {...position}}
              console.log(target, moveAttempt)
              let attempt: boolean = this.chessService.tryMove(moveAttempt)
              this.focusedColor = attempt? (this.focusedColor === 'black' ? 'white' : 'black') : this.focusedColor;
              const movedPieceColor = this.focusedChessPiece!.color;
              this.focusedColor = attempt ? (this.focusedColor === 'black' ? 'white' : 'black') : this.focusedColor;
              if (attempt) {
                this.focusedPiece = null;
                this.focusedChessPiece = null;
                this.focusedLegalMoves = [];
                this.chessService.attemptAiMove(movedPieceColor === 'white' ? 'black' : 'white');
              }
              this.loadBoard();
              this.styleLegalMoves(board)
              // if (this.focusedPiece) {
              //   console.log(this.focusedPiece)
              //   this.focusedPiece.classList.remove('active');
              //   this.focusedPiece = null;
              //   let validCells: NodeListOf<HTMLElement> = this.element.nativeElement.querySelectorAll('.valid');
              //   validCells.forEach((cell: HTMLElement): void => {
              //     cell.classList.remove('valid');
              //   })
              // }
              // element.classList.toggle('active');
              // this.focusedPiece = element;

              // let piece: ChessPiece | null = this.chessService.board[parseInt(element.getAttribute('data-row')!)][parseInt(element.getAttribute('data-column')!)];
              // if (!piece) return;
              // console.log(this.focusedPiece)
              // console.log(piece);
              // let legalMoves: legalMove[][] = this.chessService.calculateLegalMoves(piece);
              // legalMoves.forEach((row_moves: Array<legalMove>, index_row: number): void => {
              //   row_moves.forEach((column_moves: legalMove, index_column: number): void => {
              //     if (!column_moves.isLegal) return;
              //     let validCell: HTMLElement = this.element.nativeElement.querySelector(`div[data-row="${index_row}"][data-column="${index_column}"]`);
              //     validCell.classList.add('valid');
              //   })
              // })
              // let validCells: NodeListOf<HTMLElement> = this.element.nativeElement.querySelectorAll('.valid');
              // validCells.forEach((cell: HTMLElement): void => {
              //   cell.addEventListener('click', (): void => {
              //     let row: number = parseInt(cell.getAttribute('data-row')!);
              //     let column: number = parseInt(cell.getAttribute('data-column')!);
              //     let moveAttempt: MoveAttempt = {
              //       from: {
              //         row: piece.position.row,
              //         col: piece.position.col,
              //       },
              //       to: {
              //         row: row,
              //         col: column,
              //       },
              //     }
              //     console.log(moveAttempt, this.focusedPiece)
              //     this.chessService.tryMove(moveAttempt);
              //     this.loadBoard();
              //     this.chessService.logChessBoard()
              //     this.focusedPiece?.classList.remove('active');
              //     this.focusedPiece = null;
              //     let validCells: NodeListOf<HTMLElement> = this.element.nativeElement.querySelectorAll('.valid');
              //     validCells.forEach((cell: HTMLElement): void => {
              //       cell.classList.remove('valid');
              //     })
              //   });
              // })
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
