import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import {GameEndType} from './chess.service';

@Injectable({
  providedIn: 'root'
})
export class AudioHandlerService {
  // Your provided sound map with GameEndType keys.
  private soundMap: Map<GameEndType, string> = new Map<GameEndType, string>([
    ['none', ''],
    ['check', '../assets/sfx/szach.mp3'],
    ['mate', '../assets/sfx/mat.mp3'],
    ['draw-repetition', '../assets/sfx/remis.mp3'],
    ['draw-50-moves', '../assets/sfx/remis.mp3'],
    ['stalemate', '../assets/sfx/remis.mp3']
  ]);

  constructor(@Inject(PLATFORM_ID) private platformId: Object) {}

  /**
   * Plays the sound associated with the provided game end type.
   * It creates a new Audio instance to allow simultaneous playback.
   * @param type - The game end type for which to play the sound.
   */
  playSoundForType(type: GameEndType): void {
    if (!isPlatformBrowser(this.platformId)) {
      // Avoid audio playback when not in a browser (e.g. during SSR)
      console.warn('Audio playback is not supported on the server.');
      return;
    }

    const url = this.soundMap.get(type);
    if (!url) {
      console.error(`No sound mapped for type: ${type}`);
      return;
    }

    // If the URL is empty, do nothing.
    if (url === '') {
      console.warn(`No sound file provided for type: ${type}`);
      return;
    }

    // Create a new Audio instance to allow simultaneous playback.
    const audio = new Audio(url);
    audio.play().catch(error => {
      console.error(`Error playing sound for type '${type}':`, error);
    });
  }

  /**
   * Updates or adds a sound mapping for a given game end type.
   * @param type - The game end type key.
   * @param url - The URL of the sound file.
   */
  setSoundForType(type: GameEndType, url: string): void {
    this.soundMap.set(type, url);
  }
}
