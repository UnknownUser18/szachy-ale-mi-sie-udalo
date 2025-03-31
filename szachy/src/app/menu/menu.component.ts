import { Component, Output, EventEmitter, ElementRef, ViewChild, AfterViewInit } from '@angular/core';
import { GameType } from '../szachownica/szachownica.component';
import { UstawieniaComponent } from '../ustawienia/ustawienia.component';

@Component({
  selector: 'app-menu',
  imports: [UstawieniaComponent],
  templateUrl: './menu.component.html',
  styleUrl: './menu.component.css'
})
export class MenuComponent implements AfterViewInit {
  @Output() game_selected: EventEmitter<GameType> = new EventEmitter<GameType>();
  @ViewChild('visualizer', { static: true }) visualizerCanvas!: ElementRef;
  currentTrackIndex: number = 0;
  isPlaying: boolean = false;
  tracks: string[] = [
    './assets/music/music.mp3',
    './assets/music/music2.mp3',
    './assets/music/music3.mp3',
    './assets/music/music4.mp3',
    './assets/music/music5.mp3',
    './assets/music/music6.mp3'
  ];

  constructor(private element: ElementRef) {}

  ngAfterViewInit(): void {
    this.initVisualizer();
  }

  select_game(event: MouseEvent): void {
    let target: HTMLElement = event.target as HTMLElement;
    if (target.tagName === "UL") return;
    if (target.tagName === "EM" || target.tagName === 'svg') {
      target = target.parentElement as HTMLElement;
    }
    (target.parentElement!.childNodes as NodeListOf<HTMLElement>).forEach((el: HTMLElement): void => {
      el.classList.remove('selected');
    })
    target.classList.add('selected');
    this.game_selected.emit(target.getAttribute("data-game") as GameType);
  }

  toggleAudio(): void {
    const audio: HTMLMediaElement = this.element.nativeElement.querySelector('#audio');
    if (audio) {
      if (this.isPlaying) {
        audio.pause();
      } else {
        audio.play().catch(err => console.error('Błąd przy odtwarzaniu audio:', err));
      }
      this.isPlaying = !this.isPlaying;
    }
  }

  playNext(): void {
    this.currentTrackIndex = (this.currentTrackIndex + 1) % this.tracks.length;
    const audioElement = this.element.nativeElement.querySelector('#audio');
    const sourceElement = audioElement.querySelector('source');
    sourceElement.src = this.tracks[this.currentTrackIndex];
    audioElement.load();
    audioElement.play();
  }

  initVisualizer(): void {
    const audio: HTMLMediaElement = this.element.nativeElement.querySelector('#audio');
    const canvas: HTMLCanvasElement = this.visualizerCanvas.nativeElement;
    const canvasCtx = canvas.getContext('2d');

    if (!canvasCtx) {
      console.error('Błąd: Nie udało się pobrać kontekstu 2d z canvas.');
      return;
    }

    canvas.width = 300;
    canvas.height = 200;

    const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const analyser = audioCtx.createAnalyser();
    const source = audioCtx.createMediaElementSource(audio);
    source.connect(analyser);
    analyser.connect(audioCtx.destination);

    analyser.fftSize = 256;
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const backgroundColor = getComputedStyle(document.documentElement).getPropertyValue('--background-color').trim();
    const primaryColor = getComputedStyle(document.documentElement).getPropertyValue('--primary-color').trim();
    const secondaryColor = getComputedStyle(document.documentElement).getPropertyValue('--secondary-color').trim();


    const draw = (): void => {
      requestAnimationFrame(draw);
      analyser.getByteFrequencyData(dataArray);

      canvasCtx.fillStyle = primaryColor;
      canvasCtx.fillRect(0, 0, canvas.width, canvas.height);

      const barWidth = (canvas.width / bufferLength) * 2.5;
      let x = 0;

      for (let i = 0; i < bufferLength; i++) {
        const barHeight = dataArray[i];

        const barGradient = canvasCtx.createLinearGradient(0, canvas.height - barHeight / 2, 0, canvas.height);
        barGradient.addColorStop(0, backgroundColor);
        barGradient.addColorStop(1, secondaryColor);

        canvasCtx.fillStyle = barGradient;
        canvasCtx.fillRect(x, canvas.height - barHeight / 2, barWidth, barHeight / 2);
        x += barWidth + 1;
      }
    };

    audio.addEventListener('play', () => {
      audioCtx.resume().then(() => {
        draw();
      });
    });
  }
}
