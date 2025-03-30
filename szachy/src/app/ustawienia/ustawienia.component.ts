import { Component, ElementRef, OnInit } from '@angular/core';
import { NgIf, NgOptimizedImage } from '@angular/common';

@Component({
  selector: 'app-ustawienia',
  imports: [NgOptimizedImage],
  templateUrl: './ustawienia.component.html',
  styleUrl: './ustawienia.component.css'
})
export class UstawieniaComponent implements OnInit {
  settingsOpened: boolean = false;
  availableThemes: string[] = ['light', 'dark', 'mocha'];

  constructor(private element: ElementRef) {}

  ngOnInit(): void {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
      this.element.nativeElement.ownerDocument.body.classList.add(savedTheme);
    }
  }

  changeTheme(event: Event): void {
    const target = event.target as HTMLSelectElement;
    const value: string = target.value;

    this.availableThemes.forEach(theme => {
      this.element.nativeElement.ownerDocument.body.classList.remove(theme);
    });

    this.element.nativeElement.ownerDocument.body.classList.add(value);
    localStorage.setItem('theme', value);
  }
}
