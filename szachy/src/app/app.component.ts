import { Component, Renderer2, ElementRef } from '@angular/core';
import { SzachownicaComponent } from './szachownica/szachownica.component';
import { NgOptimizedImage } from '@angular/common';
import {MenuComponent} from './menu/menu.component';
import {ZegarComponent} from './zegar/zegar.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [SzachownicaComponent, NgOptimizedImage, MenuComponent, ZegarComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
  black : string = 'black';
  white : string = 'white';
  white_time : number = 0;
  black_time : number = 0;
  constructor(private renderer : Renderer2, private element : ElementRef) {}
  convert_name() : void {
    let h1 : HTMLElement = this.element.nativeElement.querySelector('h1');
    h1.textContent === 'szachy-ale-mi-sie-udalo' ? h1.textContent = 'Szachy' : h1.textContent = 'szachy-ale-mi-sie-udalo';
  }
}
