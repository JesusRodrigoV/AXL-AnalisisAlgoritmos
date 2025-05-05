import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-proyecto',
  imports: [],
  templateUrl: './proyecto.component.html',
  styleUrl: './proyecto.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class ProyectoComponent {
  titulo = '';
  intro = '';
  problema = '';
  objGeneral = '';
  objEspecificos: String[] = [];
}
