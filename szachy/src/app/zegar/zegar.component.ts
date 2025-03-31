import { Component, Input, Output, EventEmitter, OnDestroy } from '@angular/core';
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
  @Input() set time(value: number) {
    this._time = value;
    if (value <= 0) {
      this.timeEnded.emit(this.color);
    }
  }
  get time(): number {
    return this._time;
  }
  @Output() timeEnded = new EventEmitter<PieceColor>();

  private _time: number = 0;
  private intervalId: any;

  ngOnDestroy(): void {
    clearInterval(this.intervalId);
  }

  formatTime(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  }
}
