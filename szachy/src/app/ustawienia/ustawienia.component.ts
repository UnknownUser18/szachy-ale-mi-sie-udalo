import { Component, ElementRef, OnInit, DoCheck, KeyValueDiffers } from '@angular/core';
import { NgOptimizedImage } from '@angular/common';

@Component({
  selector: 'app-ustawienia',
  imports: [NgOptimizedImage],
  templateUrl: './ustawienia.component.html',
  styleUrl: './ustawienia.component.css'
})
export class UstawieniaComponent implements OnInit, DoCheck {
  settingsOpened: boolean = false;
  availableThemes: string[] = ['light', 'dark', 'mocha'];
  private differ: any;

  constructor(private element: ElementRef, private differs: KeyValueDiffers) {
    this.differ = this.differs.find({}).create();
  }


  /**
   * @method ngDoCheck
   * @description To jest do tego, że jeżeli się zmieni to erm, to jest tylko po to, że jeżeli otworzysz komponent ustawienia to wybiera ci konkrętną wartość
   * @returns {void}
   */
  ngDoCheck(): void {
    const changes = this.differ.diff({ settingsOpened: this.settingsOpened });
    if (!changes) return;
    changes.forEachChangedItem((item: any) : void => {
      if(item.key !== 'settingsOpened') return;
      if (!localStorage) return;
      const savedTheme : string = localStorage.getItem('theme')!;
      setTimeout(() : void => {
        const selectElement : HTMLSelectElement = this.element.nativeElement.querySelector('select');
        if(!selectElement) return;
        selectElement.value = savedTheme;
      });
    });
  }


  /**
   * @method ngOnInit
   * @description Podczas inicjalizacji komponentu pobiera localStorage i jeśli istnieje pobiera zapisany motyw dla naszej strony i zapisuje go
   * @returns {void}
   */
  ngOnInit(): void {
    const localStorage = typeof window !== 'undefined' ? window.localStorage : null;
    if (!localStorage) return;
    const savedTheme : string = localStorage.getItem('theme')!;
    this.element.nativeElement.ownerDocument.body.classList.add(savedTheme);
  }


  /**
   * @method changeTheme
   * @description Zmienia motyw strony w zależności od klikniętej
   * @param {Event} event - Event związany ze zmianą motywu
   * @returns {void}
   */
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
