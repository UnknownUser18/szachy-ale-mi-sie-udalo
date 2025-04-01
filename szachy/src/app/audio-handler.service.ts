import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

@Injectable({
  providedIn: 'root'
})
export class AudioHandlerService {
  private soundMap: Map<string, string> = new Map<string, string>([
    ['none', ''],
    ['check', '../assets/sfx/szach.mp3'],
    ['mate', '../assets/sfx/mat.mp3'],
    ['draw-repetition', '../assets/sfx/remis.mp3'],
    ['draw-50-moves', '../assets/sfx/remis.mp3'],
    ['stalemate', '../assets/sfx/remis.mp3']
  ]);

  constructor(@Inject(PLATFORM_ID) private platformId: Object) {}


  /**
   * @method playSoundForType
   * @description Gra dźwięk w zależności od podanego klucza
   * @param {string} type - Klucz, dla którego chcemy zagrać dźwięk
   * @returns {void}
   */
  playSoundForType(type: string): void {
    if (!isPlatformBrowser(this.platformId)) {
      console.warn('Audio playback is not supported on the server.');
      return;
    }

    const url = this.soundMap.get(type);
    if (!url) {
      console.error(`No sound mapped for type: ${type}`);
      return;
    }

    if (url === '') {
      console.warn(`No sound file provided for type: ${type}`);
      return;
    }

    const audio = new Audio(url);
    audio.play().catch(error => {
      console.error(`Error playing sound for type '${type}':`, error);
    });
  }


  /**
   * @method simulateMove
   * @description Tworzy nową zależność dla podanego klucza adres dźwięku
   * @param {string} type - Klucz, dla którego chcemy przypisać adres dźwięku
   * @param {string} url - Adres dźwięku, który chcemy przypisać do klucza
   * @returns {void}
   */
  setSoundForType(type: string, url: string): void {
    this.soundMap.set(type, url);
  }
}
