import {Injectable} from '@angular/core';
import {BehaviorSubject, Subject} from 'rxjs';
import { MatDialog } from '@angular/material/dialog';
import { GameInviteDialogComponent } from './game-invite-dialog/game-invite-dialog.component';
import {Game} from './szachownica/szachownica.component';
import {ChessService, MoveAttempt, PieceType, Position} from './chess.service';

/**
 * @interface user
 *
 * @property {string} id - Id użytkownika
 * @property {string} username - Nazwa użytkownika
 *
 * @description
 * Obiekt zawierający wszystkie ważne informacje o pojedynczym użytkowniku
 *
 * @example
 * const user: user = {
 *   id: '195823',
 *   username: 'RadiantTiger85'
 * };
 *
 */
export interface user{
  id: string;
  username: string;
}

/**
 * @interface gameInvite
 *
 * @property {string} inviteId - Id zaproszenia, które wysłał do nas jeden z użytkowników
 * @property {{ id: number, username: string }} fromUser - Id użytkownika, który zaprosił nas do gry oraz nazwa tego samego użytkownika
 * @property {Game} gameAttributes - Atrybuty gry, do której zostaliśmy zaproszeni
 *
 * @description
 * Obiekt zawierający wszystkie ważne informacje związane z zaproszeniem do gry
 *
 * @example
 * const pawn: ChessPiece = {
 *   inviteId: 'ok15aA81',
 *   fromUser: {id: 195823, username: 'RadiantTiger85'},
 *   gameAttributes: {type: 'GraczVsGraczLocal', ...}
 * };
 *
 */
export interface gameInvite{
  inviteId: string;
  fromUser: { id: number, username: string };
  gameAttributes: Game
}

/**
 * @interface moveData
 *
 * @property {number} gameId - Id gry, w którą gra użytkownik
 * @property {MoveAttempt} move - Próba ruchu przeciwnika
 * @property {string} newTurn - kolor gracza w następnej turze
 *
 * @description
 * Obiekt zawierający wszystkie ważne informacje o próbie ruchu przeciwnika
 *
 * @example
 * const pawn: ChessPiece = {
 *   gameId: 105492,
 *   move: { row: 1, col: 0 },
 *   newTurn: 'white'
 * };
 *
 */
export interface moveData {
  gameId: number;
  move: MoveAttempt;
  newTurn: string;
}

/**
 * Pełna reprezentacja bierki szachowej.
 *
 * @interface ChessPiece
 *
 * @property {PieceType} type - Typ figury
 * @property {PieceColor} color - Kolor figury
 * @property {Position} position - Aktualna pozycja
 * @property {Position} lastPosition - Poprzednia pozycja
 * @property {boolean} [hasMoved] - Czy figura była poruszana
 * @property {boolean} [moveTurn] - Czy figura była poruszona w ostatniej turze
 *
 * @description
 * Kompletny obiekt zawierający wszystkie informacje o stanie bierki.
 *
 * @example
 * const pawn: ChessPiece = {
 *   type: 'pawn',
 *   color: 'white',
 *   position: { row: 1, col: 0 },
 *   lastPosition: { row: 1, col: 0 },
 *   hasMoved: false
 * };
 *
 */
export interface promotionData{
  gameId: number;
  pawnPos: Position;
  promotionType: PieceType;
}

@Injectable({
  providedIn: 'root'
})
export class LocalConnectionService {
  public ws: WebSocket | undefined;
  public users = new BehaviorSubject<user[]>([]);
  public isServer = false;
  public isClient = false;
  public isLoading = false;
  public errorMessage = '';
  public gameId: number = 0;
  public moveExecuted : Subject<MoveAttempt> = new Subject<MoveAttempt>();
  private currentInvite = new BehaviorSubject<gameInvite>({
    inviteId: '',
    fromUser: { id: 0, username: '' },
    gameAttributes: {type: 'GraczVsGracz', duration: 0}
  });

  constructor(private dialog: MatDialog, private chessService: ChessService) {
    this.chessService.pawnPromotionSubject.asObservable().subscribe((data: {position: Position, type: PieceType}) => this.requestPawnPromotion(data.position, data.type))
  }


  /**
   * @method connect
   * @description Z podanym IP serwera, próbujemy się do niego połączyć
   * @param {string} ipv4 - IP serwera, do którego próbujemy się połączyć
   * @returns {Promise<void>}
   */
  async connect(ipv4: string): Promise<void> {
    try {
      if (this.ws) {
        this.ws.close();
      }

      this.isLoading = true;
      this.ws = new WebSocket(ipv4);

      this.ws.onopen = () => {
        this.isClient = true;
        this.isLoading = false;
        this.errorMessage = '';
      };

      this.ws.onclose = () => {
        this.isClient = false;
        this.users.next([]);
        this.isLoading = false;
      };

      this.ws.onerror = (error) => {
        this.isClient = false;
        this.isLoading = false;
        this.errorMessage = 'Błąd połączenia WebSocket';
        console.error('WebSocket error:', error);
      };

      this.ws.onmessage = (event) => this.handleData(event.data);

    } catch (error: any) {
      this.isLoading = false;
      this.errorMessage = error.message || 'Błąd połączenia';
      throw error;
    }
  }


  /**
   * @method sendAccept
   * @description Odsyła akceptacja zaproszenia
   * @param {any} result - Zmienna, która musi przechowywać kluczowe informacje jak ID zaproszenia wysłanego do użytkownika
   * @returns {void}
   */
  sendAccept(result:any): void {
    this.send(this.standardizeData('gameAccept', { inviteId: result.inviteId }))
  }


  /**
   * @method sendReject
   * @description Odsyła odrzucenie zaproszenia
   * @param {any} result - Zmienna, która musi przechowywać kluczowe informacje jak ID zaproszenia wysłanego do użytkownika
   * @returns {void}
   */
  sendReject(result:any): void {
    this.send(this.standardizeData('gameReject', { inviteId: result.inviteId }))
  }


  /**
   * @method send
   * @description Wysyła string do serwera
   * @param {string} message - String, który chcemy wysłać do serwera
   * @returns {void}
   */
  send(message: string): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(message);
    }
  }


  /**
   * @method handleData
   * @description Zarządza danymi, które strona otrzymuje od serwera
   * @param {any} initialData - Dane, które są przesyłane od serwera
   * @returns {void}
   */
  handleData(initialData: any): void
  {
    console.log(initialData);
    const {method, data} = JSON.parse(initialData);
    switch (method) {
      case 'error':
        console.error(data);
        break;
      case 'userList':
        this.users.next(data as Array<user>);
        break;
      case 'gameInvite':
        this.handleIncomingInvite(data as gameInvite);
        break;
      case 'gameStart':
        this.handleGameStart(data);
        break;
      case 'move':
        this.handleMoveAttempt(data as moveData);
        break;
      case 'undo':
        this.handleUndoMove();
        break;
      case 'pawnPromotion':
        console.log('aaa')
        this.handlePawnPromotion(data as promotionData);
        break;
    }
  }


  /**
   * @method handleUndoMove
   * @description Jeżeli dostaliśmy prośbę od serwera o cofnięcie ruchu, wykonujemy je
   * @returns {void}
   */
  handleUndoMove(): void {
    this.chessService.undoMove()
  }


  /**
   * @method requestUndoMove
   * @description Wysłanie prośby do serwera, o cofnięcie ruchu u przeciwnika
   * @returns {void}
   */
  requestUndoMove(): void
  {
    console.log('aaa')
    this.send(this.standardizeData('undoMove', { gameId: this.gameId }))
  }


  /**
   * @method handleMoveAttempt
   * @description Jeżeli przeciwnik się ruszył, to wysłane zostały dane od serwera o ruchu przeciwnika
   * @param {moveData} data - Dane, o ruchu przeciwnika
   * @returns {void}
   */
  handleMoveAttempt(data: moveData): void
  {
    let attempt: boolean = this.chessService.tryMove(data.move);
    if (attempt) {
      this.moveExecuted.next(data.move);
      console.log(`Move executed: from (${data.move.from.row}, ${data.move.from.col}) to (${data.move.to.row}, ${data.move.to.col})`);
      this.chessService.currentTurnColor.next(this.chessService.currentTurnColor.value === 'white' ? 'black' : 'white');
    }
  }


  /**
   * @method handleGameStart
   * @description Zarządza rozpoczęciem gry w sieci lokalnej
   * @param {any} data - Dane posiadające informacje o rozpoczęciu gry
   * @returns {void}
   */
  handleGameStart(data: any): void {
    console.log('game start:', data);
    this.gameId = data.gameId
    let gameAttributes = data.gameAttributes;
    let opponent = data.opponent;
    if(gameAttributes.type === 'GraczVsGrandmaster') {
      if(gameAttributes.mainPlayerColor === 'white') {
        gameAttributes.black_player = opponent;
        gameAttributes.white_player = 'Gracz';
      } else {
        gameAttributes.white_player = opponent;
        gameAttributes.black_player = 'Gracz';
      }
    }
    this.chessService.startGame(gameAttributes);
  }


  /**
   * @method handleIncomingInvite
   * @description Zarządza zaproszeniem do gry sieciowej
   * @param {gameInvite} inviteData - Dane przechowujące informacje o zaproszeniu do gry sieciowej
   * @returns {void}
   */
  handleIncomingInvite(inviteData: gameInvite): void {
    inviteData.gameAttributes.mainPlayerColor = inviteData.gameAttributes.mainPlayerColor === 'white' ? 'black' : 'white';
    this.currentInvite.next(inviteData);
    const dialogRef = this.dialog.open(GameInviteDialogComponent, {
      data: {
        inviterUsername: inviteData.fromUser.username,
        inviteId: inviteData.inviteId,
        gameAttributes: inviteData.gameAttributes,
      },
      disableClose: true
    });
    dialogRef.afterClosed().subscribe(result => {
      if (result.response === 'accept') this.sendAccept(inviteData);
      else this.sendReject(inviteData);
    });
  }


  /**
   * @method handlePawnPromotion
   * @description Zarządza promocją piona w grze o trybie Gracz kontra Gracz w sieci lokalnej
   * @param {promotionData} data - Dane przechowujące informacje o promocji piona
   * @returns {void}
   */
  handlePawnPromotion(data: promotionData): void {
    this.chessService.board[data.pawnPos.row][data.pawnPos.col]!.type = data.promotionType;
    this.chessService.updateBoard.next(this.chessService.board);
  }


  /**
   * @method requestPawnPromotion
   * @description Wysyła prośbę do serwera o awans piona na danej pozycji u przeciwnika
   * @param {Position} pawnPos - Pozycja awansowanego pionka
   * @param {PieceType} type - Typ figury, na którą awansujemy pionka
   * @returns {void}
   */
  requestPawnPromotion(pawnPos: Position, type: PieceType): void
  {
    this.send(this.standardizeData('undoMove', { gameId: this.gameId, pawnPos: pawnPos, promotionType: type }))
  }


  /**
   * @method initializeGame
   * @description Inicjalizuje grę szachową, dokładniej mówiąc: wysyła zaproszenia do przeciwnika
   * @param {string} challengedUserId - Id użytkownika, którego chcemy wyzwać na partię szachową
   * @param {Game} gameAttr - Atrybuty gry, którą chcemy rozpocząć w sieci lokalnej
   * @returns {void}
   */
  public initializeGame(challengedUserId: string, gameAttr: Game): void {
    this.send(this.standardizeData('gameInvite', { toUserId: challengedUserId, gameAttributes: gameAttr }))
  }


  /**
   * @method standardizeData
   * @description Ujednolica dane wysyłane do serwera
   * @param {string} method - Metodą, która będzie nagłówkiem w naszej wiadomości
   * @param {object} data - Obiekt, który chcemy wysłać jako parametry do serwera
   * @returns {string} String gotowy do wysłania przez sieć
   */
  public standardizeData (method: string, data: object): string{
    return JSON.stringify({ method, data });
  }


  /**
   * @method attemptMove
   * @description Wysyła próbę wykonania ruchu do serwera
   * @param {Position} from - Pozycja początkowa
   * @param {Position} to - Pozycja docelowa
   * @returns {void}
   */
  public attemptMove(from: Position, to: Position): void
  {
    const moveAttempt: MoveAttempt = {from: from, to: to};
    this.send(this.standardizeData('move', {
      gameId: this.gameId,
      move: moveAttempt
    }))
  }

}
