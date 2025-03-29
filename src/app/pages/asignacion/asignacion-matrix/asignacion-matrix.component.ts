import {
  ChangeDetectionStrategy,
  Component,
  Input,
  OnChanges,
  SimpleChanges,
} from '@angular/core';
import { Conexion, Nodo } from '@app/models';

@Component({
  selector: 'app-asignacion-matrix',
  imports: [],
  templateUrl: './asignacion-matrix.component.html',
  styleUrl: './asignacion-matrix.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AsignacionMatrixComponent implements OnChanges {
  @Input() nodos: Nodo[] = [];
  @Input() conexiones: Conexion[] = [];

  nodosOrigen: Nodo[] = [];
  nodosDestino: Nodo[] = [];

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['nodos'] || changes['conexiones']) {
      this.actualizarMatriz();
    }
  }

  private actualizarMatriz(): void {
    // Separar nodos en origen y destino
    this.nodosOrigen = this.nodos.filter((nodo) => nodo.esOrigen);
    this.nodosDestino = this.nodos.filter((nodo) => !nodo.esOrigen);
  }

  getConexionPeso(origen: Nodo, destino: Nodo): number | null {
    const conexion = this.conexiones.find(
      (c) => c.desde === origen.contador && c.hasta === destino.contador,
    );
    return conexion?.peso ?? null;
  }
}
