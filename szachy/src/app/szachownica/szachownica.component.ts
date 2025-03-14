import {Component, ElementRef, OnInit, Renderer2} from '@angular/core';
import {ChessPiece, ChessService, legalMove, MoveAttempt, PieceColor, Position} from '../chess.service';

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
        const pieceType : string | undefined = this.chessService.board[row][column]?.type.toString();
        const pieceColor : string | undefined = this.chessService.board[row][column]?.color.toString();
        if (pieceType && pieceColor) {
          let img : HTMLImageElement = this.renderer.createElement('img');
          img.src = pieces[pieceColor + '_' + pieceType];
          cell.appendChild(img);
          cell.classList.add('piece');
          cell.setAttribute('draggable', 'true');
        }
        else if(cell.classList.contains('piece')) {
          cell.innerHTML = '';
          cell.classList.remove('piece');
          cell.removeAttribute('draggable');
          if(cell.childNodes && cell.childNodes.length > 0) cell.removeChild(cell.querySelector('img')!);
        }
      })
    })
  }


  styleLegalMoves(board: HTMLElement): void {
    for(let index_row : number = 0; index_row < 8; index_row++)
      for(let index_column : number = 0; index_column < 8; index_column++) {
        if(!this.focusedLegalMoves[index_row]){
          board.querySelectorAll('.valid').forEach((cell : Element) : void => {cell.classList.remove('valid')});
          break;
        }
        this.focusedLegalMoves[index_row][index_column].isLegal ? board.querySelector(`div[data-row="${index_row}"][data-column="${index_column}"]`)!.classList.add('valid') :  board.querySelector(`div[data-row="${index_row}"][data-column="${index_column}"]`)!.classList.remove('valid');
      }
    board.querySelectorAll('.active').forEach((cell: Element) : void => {cell.classList.remove('active')})
    if(this.focusedChessPiece) this.focusedPiece!.classList.add('active');
  }

  ngOnInit() : void {
    let board : HTMLElement = this.element.nativeElement.querySelector('main');
    board.innerHTML = '';
    for(let i : number = 8 ; i > 0 ; i--) {
      let row : HTMLElement = this.renderer.createElement('div');
      for(let j : number = 0 ; j < 8 ; j++) {
        let element : HTMLElement = this.renderer.createElement('div');
        element.setAttribute('data-row', String(i-1));
        if(i === 1 && j === 0) {
          let span : HTMLElement = this.renderer.createElement('span');
          span.textContent = '1';
          span.classList.add('number');
          this.renderer.appendChild(element, span);
          span = this.renderer.createElement('span');
          span.textContent = 'a';
          span.classList.add('letter');
          this.renderer.appendChild(element, span);
          element.classList.add('start');
        } else if(i === 1) {
          element.textContent = String.fromCharCode(65 + j).toLowerCase();
          element.classList.add('letter');
        } else if(j === 0) {
          element.textContent = String(i);
          element.classList.add('number');
        }
        element.setAttribute('data-column', String(j));
        element.addEventListener('dragstart', (event: DragEvent) : void => {
          let row : number = parseInt(element.getAttribute('data-row')!);
          let col : number = parseInt(element.getAttribute('data-column')!);
          if(this.chessService.board[row][col]?.color !== this.focusedColor) return;
          event.dataTransfer?.setData('text/plain', JSON.stringify({
            row: row,
            column: col
          }));
          this.focusedPiece = element;
          let position: Position = {row: row, col: col};
          this.focusedChessPiece = this.chessService.getPieceFromPosition(position);
          this.focusedLegalMoves = this.chessService.getLegalMovesForColor(this.focusedChessPiece!.color).find((distinctPieceLegalMoves: { piece: ChessPiece, legalMoves: legalMove[][] }) => distinctPieceLegalMoves.piece === this.focusedChessPiece)?.legalMoves || [];
          this.styleLegalMoves(this.element.nativeElement.querySelector('main'));
        });
        element.addEventListener('dragover', (event: DragEvent) : void => {
          event.preventDefault();
        });
        element.addEventListener('drop', (event: DragEvent) : void => {
          console.log("Event drop", event.dataTransfer!.getData('text/plain'));
          if(event.dataTransfer!.getData('text/plain').match('http://')) return; // jeżeli chłopie próbujesz wykonać ruch w nie swojej turze to wysyła się http://[link_do_obrazka]

          event.preventDefault();
          const data = JSON.parse(event.dataTransfer?.getData('text/plain')!);
          const fromPosition: Position = {row: parseInt(data.row), col: parseInt(data.column)};
          const toPosition: Position = {row: parseInt(element.getAttribute('data-row')!), col: parseInt(element.getAttribute('data-column')!)};
          this.movePiece(fromPosition, toPosition);
        });
        element.addEventListener('click', () : void => {
          this.onClick(element, board);
        });
        this.renderer.appendChild(row, element);
      }
      this.renderer.appendChild(board, row);
    }
    this.loadBoard();
  }

  onClick(element: HTMLElement, board: HTMLElement): void {
    let position: Position = {row: parseInt(element.getAttribute('data-row')!), col: parseInt(element.getAttribute('data-column')!)};
    let piece: ChessPiece | null = this.chessService.getPieceFromPosition(position);
    if(piece && piece.color === this.focusedColor) {
      this.focusedChessPiece = piece;
      this.focusedPiece = element;
      let legalMoves = this.chessService.getLegalMovesForColor(piece.color).find((distinctPieceLegalMoves: { piece: ChessPiece, legalMoves: legalMove[][] }) => distinctPieceLegalMoves.piece === piece)?.legalMoves;
      if(!(legalMoves && legalMoves.length > 0)) return;
      this.focusedLegalMoves = legalMoves;
      this.styleLegalMoves(board);
      return;
    }
    if(this.focusedChessPiece)
      this.movePiece(this.focusedChessPiece!.position, position);
  }

  movePiece(from: Position, to: Position): void {
    if(!this.focusedLegalMoves[to.row] || !this.focusedLegalMoves[to.row][to.col].isLegal) {
      this.resetFocus();
      return;
    }
    let moveAttempt: MoveAttempt = {from: {...from}, to: {...to}};
    let attempt: boolean = this.chessService.tryMove(moveAttempt);
    this.focusedColor = attempt ? (this.focusedColor === 'black' ? 'white' : 'black') : this.focusedColor;
    if(attempt) {
      this.resetFocus();
    }
    this.loadBoard();
    this.styleLegalMoves(this.element.nativeElement.querySelector('main'));
  }

  resetFocus(): void {
    this.focusedPiece = null;
    this.focusedChessPiece = null;
    this.focusedLegalMoves = [];
  }
}
