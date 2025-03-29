import { Component, Input, OnDestroy } from '@angular/core';
import { NgOptimizedImage } from '@angular/common';
import { PieceColor } from '../chess.service';

@Component({
  selector: 'app-zegar',
  standalone: true,
  imports: [NgOptimizedImage],
  templateUrl: './zegar.component.html',
  styleUrls: ['./zegar.component.css']
})
export class ZegarComponent implements OnDestroy {
  @Input() color!: PieceColor;
  @Input() time!: number;
  private intervalId: any;
  isRunning = false;

  ngOnDestroy() {
    this.stopTimer();
  }

  startTimer(): void {
    if (this.isRunning) return;
    this.isRunning = true;
    this.intervalId = setInterval(() => {
      this.time--;
      if (this.time <= 0) {
        this.stopTimer();
       
      }
    }, 1000);
  }

  stopTimer(): void {
    if (!this.isRunning) return;
    clearInterval(this.intervalId);
    this.isRunning = false;
  }

  resetTimer(newTime: number): void {
    this.stopTimer();
    this.time = newTime;
  }

  formatTime(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  }

  protected readonly Math = Math;
}