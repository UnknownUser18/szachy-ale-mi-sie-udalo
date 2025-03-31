import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { MatDialog } from '@angular/material/dialog';
import { GameInviteDialogComponent } from './game-invite-dialog/game-invite-dialog.component';
import {Game} from './szachownica/szachownica.component';
import {ChessService, MoveAttempt, PieceColor, Position} from './chess.service';

export interface user{
  id: string;
  username: string;
  connectedAt: string;
}

export interface serverData{
  method: string;
  data: any;
}

export interface gameInvite{
  inviteId: string;
  fromUser: { id: number, username: string };
  gameAttributes: Game
}

export interface moveData {
  gameId: number;
  move: MoveAttempt;
  newTurn: string;
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
  private currentInvite = new BehaviorSubject<gameInvite>({
    inviteId: '',
    fromUser: { id: 0, username: '' },
    gameAttributes: {type: 'GraczVsGracz', duration: 0}
  });

  constructor(private dialog: MatDialog, private chessService: ChessService) {}

  async connect(ipv4: string) {
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

  sendAccept(result:any): void {
    this.send(this.standarizeData('gameAccept', { inviteId: result.inviteId }))
  }

  sendReject(result:any): void {
    this.send(this.standarizeData('gameReject', { inviteId: result.inviteId }))
  }

  send(message: string) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(message);
    }
  }

  handleData(initialData: any)
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
    }
  }

  handleMoveAttempt(data: moveData)
  {
    let attempt: boolean = this.chessService.tryMove(data.move);
    if (attempt) {
      console.log(`Move executed: from (${data.move.from.row}, ${data.move.from.col}) to (${data.move.to.row}, ${data.move.to.col})`);
      this.chessService.currentTurnColor.next(this.chessService.currentTurnColor.value === 'white' ? 'black' : 'white');
    }
  }

  handleGameStart(data: any) {
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

  handleIncomingInvite(inviteData: gameInvite) {
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

  public initializeGame(challengedUserId: string, gameAttr: Game) {
    this.send(this.standarizeData('gameInvite', { toUserId: challengedUserId, gameAttributes: gameAttr }))
  }


  public standarizeData (method: string, data: object): string{
    return JSON.stringify({ method, data });
  }


  public attemptMove(from: Position, to: Position)
  {
    const moveAttempt: MoveAttempt = {from: from, to: to};
    this.send(this.standarizeData('move', {
      gameId: this.gameId,
      move: moveAttempt
    }))
  }

}
