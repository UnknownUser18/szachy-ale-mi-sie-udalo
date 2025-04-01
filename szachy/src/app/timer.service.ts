import { Injectable } from '@angular/core';
import {PieceColor} from './chess.service';


@Injectable({ providedIn: 'root' })
export class TimerService {
  public currentTimer: 'white' | 'black' = 'white';
  private timerInterval: any;
  initialTime: number = 5400;
  whiteTime: number = this.initialTime;
  blackTime: number = this.initialTime;
  constructor() {}


  /**
   * @method resetTimers
   * @description Resetuje zegary
   * @returns {void}
   */
  resetTimers(): void {
    this.whiteTime = this.initialTime;
    this.blackTime = this.initialTime;
    clearInterval(this.timerInterval);
    this.currentTimer = 'white';
  }


  /**
   * @method setTime
   * @description Rozpoczyna działanie zegarów na daną ilość czasu
   * @param {number} minutes - Ilość minut, z jaką rozpoczynają gracze
   * @returns {void}
   */
  setTime(minutes: number): void {
    this.initialTime = minutes;
    this.resetTimers();
  }


  /**
   * @method startTimer
   * @description Rozpoczyna działanie zegarów
   * @returns {void}
   */
  startTimer(): void {
    clearInterval(this.timerInterval);
    this.timerInterval = setInterval(() => {
      if (this.currentTimer === 'white') {
        this.whiteTime--;
      } else if(this.currentTimer === 'black') {
        this.blackTime--;
      }
      if ((this.whiteTime <= 0 || this.blackTime <= 0)) {
        this.onTimeEnded(this.currentTimer);
      }
    }, 1000);
  }


  /**
   * @method switchTimer
   * @description Zmienia aktualnego gracza, któremu leci czas
   * @returns {void}
   */
  switchTimer(): void {
    this.currentTimer = this.currentTimer === 'white' ? 'black' : 'white';
    this.startTimer();
  }


  /**
   * @method onTimeEnded
   * @description Kończy działanie zegara, kiedy skończył się czas
   * @param {PieceColor} color - Kolor gracza, któremu skończył się czas
   * @returns {void}
   */
  onTimeEnded(color: PieceColor): void {
    clearInterval(this.timerInterval);
    console.log(`Czas gracza ${color} się skończył!`);

  }
}
