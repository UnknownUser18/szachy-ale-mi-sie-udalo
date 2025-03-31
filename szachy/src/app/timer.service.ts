import { Injectable } from '@angular/core';
// timer.service.ts


@Injectable({ providedIn: 'root' })
export class TimerService {
  public currentTimer: 'white' | 'black' = 'white';
  private timerInterval: any;
  initialTime: number = 5400;
  whiteTime: number = this.initialTime;
  blackTime: number = this.initialTime;
  constructor() {}

  resetTimers(): void {
    this.whiteTime = this.initialTime;
    this.blackTime = this.initialTime;
    clearInterval(this.timerInterval);
    this.currentTimer = 'white';
  }


  setTime(minutes: number): void {
    this.initialTime = minutes;
    this.resetTimers();
  }

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

  switchTimer(): void {
    this.currentTimer = this.currentTimer === 'white' ? 'black' : 'white';
    this.startTimer();
  }

  onTimeEnded(color: 'white' | 'black'): void {
    clearInterval(this.timerInterval);
    console.log(`Czas gracza ${color} się skończył!`);

  }




  // Reszta metod timerowych...
}