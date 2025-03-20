import {Component, Input} from '@angular/core';
import {Game} from '../szachownica/szachownica.component';

@Component({
  selector: 'app-nerd-view',
  imports: [],
  templateUrl: './nerd-view.component.html',
  styleUrl: './nerd-view.component.css'
})
export class NerdViewComponent {
  @Input() game!: Game | null;

}
