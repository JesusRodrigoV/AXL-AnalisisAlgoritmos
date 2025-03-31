import {
  ChangeDetectionStrategy,
  Component,
  Input,
  OnChanges,
  SimpleChanges,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatCardModule } from '@angular/material/card';
import { Conexion, Nodo } from '@app/models';

interface MatrizElement {
  origen: Nodo;
  [key: string]: any; // Para las columnas dinámicas
}

@Component({
  selector: 'app-asignacion-matrix',
  imports: [CommonModule, MatTableModule, MatCardModule],
  templateUrl: './asignacion-matrix.component.html',
  styleUrl: './asignacion-matrix.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AsignacionMatrixComponent implements OnChanges {
  @Input() nodos: Nodo[] = [];
  @Input() conexiones: Conexion[] = [];

  nodosOrigen: Nodo[] = [];
  nodosDestino: Nodo[] = [];
  displayedColumns: string[] = ['origen'];
  dataSource: MatrizElement[] = [];

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['nodos'] || changes['conexiones']) {
      this.actualizarMatriz();
    }
  }

  private actualizarMatriz(): void {
    this.nodosOrigen = this.nodos.filter((nodo) => nodo.esOrigen);
    this.nodosDestino = this.nodos.filter((nodo) => !nodo.esOrigen);

    // Configurar columnas dinámicas
    this.displayedColumns = [
      'origen',
      ...this.nodosDestino.map((d) => `destino_${d.contador}`),
    ];

    // Crear el dataSource
    this.dataSource = this.nodosOrigen.map((origen) => {
      const row: MatrizElement = { origen };
      this.nodosDestino.forEach((destino) => {
        row[`destino_${destino.contador}`] = this.getConexionPeso(
          origen,
          destino,
        );
      });
      return row;
    });
  }

  getConexionPeso(origen: Nodo, destino: Nodo): number | null {
    const conexion = this.conexiones.find(
      (c) => c.desde === origen.contador && c.hasta === destino.contador,
    );
    return conexion?.peso ?? null;
  }

  getColumnName(column: string): string {
    if (column === 'origen') return '';
    const destinoId = parseInt(column.split('_')[1]);
    const destino = this.nodosDestino.find((d) => d.contador === destinoId);
    return destino?.nombre || '';
  }

  isInfinite(value: number | null): boolean {
    return value === null;
  }
}
