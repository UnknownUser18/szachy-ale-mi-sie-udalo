import {Component, Input} from '@angular/core';
import {NgOptimizedImage} from '@angular/common';

@Component({
  selector: 'app-zegar',
  standalone: true,
  imports: [
    NgOptimizedImage
  ],
  templateUrl: './zegar.component.html',
  styleUrl: './zegar.component.css'
})
export class ZegarComponent {
  @Input() color!: string | undefined;
  @Input() time!: number;

  protected readonly Math = Math;
}
