import { Component, OnDestroy } from '@angular/core';
import { NgClass, NgForOf, NgIf } from '@angular/common';
import { LocalConnectionService, user } from "../local-connection.service";
import { environment } from '../../environments/environment';

@Component({
  selector: 'app-local-game',
  standalone: true,
  templateUrl: './local-game.component.html',
  imports: [NgIf, NgClass],
  styleUrls: ['./local-game.component.css']
})
export class LocalGameComponent implements OnDestroy {
  isExpanded = false;
  serverIp: string | null = null;
  errorMessage: string | null = null;
  users: user[] = [];
  constructor(protected connection: LocalConnectionService) {
    this.connection.users.subscribe(users => this.users = users);
  }

  async startServer() {
    this.connection.isLoading = true;
    this.errorMessage = null;

    try {
      const response = await fetch(`${environment.apiUrl}/start-server`);

      if (!response.ok) {
        const errorResponse = await response.text();
        throw new Error(`Błąd serwera: ${response.statusText}. ${errorResponse}`);
      }

      const data = await response.json();

      if (data.ip) {
        this.serverIp = data.ip;
        this.connection.isServer = true;

        await this.connectToServer(data.ip);
      } else {
        throw new Error('Nieprawidłowa odpowiedź serwera');
      }
    } catch (error) {
      this.handleError(error);
    } finally {
      this.connection.isLoading = false;
    }
  }

  async stopServer() {
    this.connection.isLoading = true;
    try {
      const response = await fetch(`${environment.apiUrl}/stop-server`);
      if (!response.ok) throw new Error('Błąd zatrzymywania serwera');

      this.connection.isServer = false;
      this.serverIp = null;
      this.connection.users.next([]);
      this.disconnectClient();
    } catch (error) {
      this.handleError(error);
    } finally {
      this.connection.isLoading = false;
    }
  }

  async connectToServer(ip: string) {
    this.connection.isLoading = true;
    this.errorMessage = null;

    try {
      await this.connection.connect(`ws://${ip}:${environment.wsPort}`);
      this.serverIp = ip;
    } catch (error) {
      this.errorMessage = 'Nie udało się połączyć z serwerem';
    } finally {
      this.connection.isLoading = false;
    }
  }

  disconnectClient() {
    this.connection.ws?.close();
    this.connection.isClient = false;
    this.serverIp = null;
    this.connection.users.next([]);
  }

  private handleError(error: unknown) {
    this.errorMessage = error instanceof Error ? error.message : 'Nieznany błąd';
    console.error(error);
  }

  ngOnDestroy() {
    this.connection.ws?.close();
  }
}
