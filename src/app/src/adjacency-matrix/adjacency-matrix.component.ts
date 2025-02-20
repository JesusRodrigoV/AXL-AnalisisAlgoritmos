import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  Input,
  OnChanges,
  SimpleChanges,
  ChangeDetectorRef,
  AfterViewInit,
  ElementRef,
  ViewChild,
  EventEmitter,
} from '@angular/core';
import { Nodo, Conexion } from '@app/models';

@Component({
  selector: 'app-adjacency-matrix',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './adjacency-matrix.component.html',
  styleUrl: './adjacency-matrix.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdjacencyMatrixComponent implements AfterViewInit, OnChanges {
  @Input() nodos: Nodo[] = [];
  @Input() conexiones: Conexion[] = [];
  @ViewChild('myCanvas') canvas: ElementRef<HTMLCanvasElement> | undefined;
  matriz: number[][] = [];
  filaSumas: number[] = [];
  columnaSumas: number[] = [];
  @Input() actualizarMatriz$: EventEmitter<void> | undefined;

  constructor(private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    if (this.actualizarMatriz$) {
      this.actualizarMatriz$.subscribe(() => {
        this.onActualizarMatriz();
        this.generarMatriz();
        this.dibujarMatriz();
      });
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['nodos'] || changes['conexiones']) {
      this.onActualizarMatriz();
      setTimeout(() => {
        this.generarMatriz();
        this.dibujarMatriz();
        this.cdr.detectChanges(); // Forzar la actualización de la vista
      });
    }
  }

  ngAfterViewInit(): void {
    this.onActualizarMatriz();
    this.dibujarMatriz();
  }

  generarMatriz(): void {
    const n = this.nodos.length;
    if (n === 0) {
      this.matriz = [];
      this.filaSumas = [];
      this.columnaSumas = [];
      return;
    }

    this.matriz = Array.from({ length: n }, () => Array(n).fill(0));
    this.filaSumas = Array(n).fill(0);
    this.columnaSumas = Array(n).fill(0);

    this.conexiones.forEach((conexion) => {
      const i = this.nodos.findIndex((n) => n.contador === conexion.desde);
      const j = this.nodos.findIndex((n) => n.contador === conexion.hasta);
      if (i !== -1 && j !== -1) {
        const peso = conexion.peso || 0;
        this.matriz[i][j] = peso;
        this.filaSumas[i] += peso;
        this.columnaSumas[j] += peso;

        if (!conexion.dirigido) {
          this.matriz[j][i] = peso;
          this.filaSumas[j] += peso;
          this.columnaSumas[i] += peso;
        }
      }
    });
  }

  dibujarMatriz(): void {
    if (this.canvas && this.canvas.nativeElement) {
      const ctx = this.canvas.nativeElement.getContext('2d');
      if (ctx && this.matriz.length > 0) {
        const cellSize = 40;
        ctx.clearRect(
          0,
          0,
          this.canvas.nativeElement.width,
          this.canvas.nativeElement.height,
        );

        for (let i = 0; i < this.matriz.length; i++) {
          for (let j = 0; j < this.matriz[i].length; j++) {
            ctx.beginPath();
            ctx.rect(j * cellSize, i * cellSize, cellSize, cellSize);
            ctx.stroke();

            const weight = this.matriz[i][j];
            if (weight > 0) {
              ctx.fillText(`${weight}`, j * cellSize + 10, i * cellSize + 20);
            }
          }
          // Dibujar suma de la fila a la derecha
          ctx.fillText(
            `${this.filaSumas[i]}`,
            this.matriz.length * cellSize + 10,
            i * cellSize + 20,
          );
        }

        // Dibujar suma de la columna en la parte inferior
        for (let j = 0; j < this.columnaSumas.length; j++) {
          ctx.fillText(
            `${this.columnaSumas[j]}`,
            j * cellSize + 10,
            this.matriz.length * cellSize + 30,
          );
        }
      }
    }
  }

  onActualizarMatriz(): void {
    this.generarMatriz();
    this.dibujarMatriz();
    this.cdr.detectChanges();
  }
}
