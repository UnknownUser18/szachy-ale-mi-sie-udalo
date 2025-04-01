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

  /**
   * @method startServer
   * @description Startuje serwer przez komunikacje się z controller.js
   * @returns {Promise<void>}
   */
  async startServer(): Promise<void> {
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


  /**
   * @method stopServer
   * @description Podobnie jak włączanie serwera, poprzez komunikację z controller.js wyłącza serwer
   * @returns {Promise<void>}
   */
  async stopServer(): Promise<void> {
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


  /**
   * @method connectToServer
   * @description Łączy się z serwerem zainicjalizowanym przez controller.js
   * @param {string} ip - Adres IP serwera, do którego próbujemy się połączyć
   * @returns {Promise<void>}
   */
  async connectToServer(ip: string): Promise<void> {
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


  /**
   * @method disconnectClient
   * @description Kończy komunikację z serwerem zainicjalizowanym przez controller.js
   * @returns {void}
   */
  disconnectClient(): void {
    this.connection.ws?.close();
    this.connection.isClient = false;
    this.serverIp = null;
    this.connection.users.next([]);
  }


  /**
   * @method handleError
   * @description W przypadku wystąpienia błędu, zostaje on przypisany do zmiennej 'errorMessage' i wypisuje go w konsoli jako error
   * @param {unknown} error - Pozycja początkowa
   * @returns {void} Nowa plansza po symulowanym ruchu
   */
  private handleError(error: unknown): void {
    this.errorMessage = error instanceof Error ? error.message : 'Nieznany błąd';
    console.error(error);
  }

  /**
   * @method ngOnDestroy
   * @description W przypadku 'końca życia' komponentu, kończy się komunikacja z controller.js
   * @returns {void}
   */
  ngOnDestroy(): void {
    this.connection.ws?.close();
  }
}
