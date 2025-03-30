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

  ngOnInit(): void {
    const localStorage = typeof window !== 'undefined' ? window.localStorage : null;
    if (!localStorage) return;
    const savedTheme : string = localStorage.getItem('theme')!;
    this.element.nativeElement.ownerDocument.body.classList.add(savedTheme);
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
