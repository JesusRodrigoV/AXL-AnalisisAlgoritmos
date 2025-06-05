import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ProcesarDatosComponent } from './procesar-datos';

@Component({
  selector: 'app-fuzzy',
  imports: [ProcesarDatosComponent],
  templateUrl: './fuzzy.component.html',
  styleUrl: './fuzzy.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export default class FuzzyComponent {

}
