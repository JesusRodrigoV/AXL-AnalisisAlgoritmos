import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ProcesarLaplaceComponent } from './procesar-laplace';

@Component({
  selector: 'app-laplace',
  imports: [ProcesarLaplaceComponent],
  templateUrl: './laplace.component.html',
  styleUrl: './laplace.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export default class LaplaceComponent {

}
