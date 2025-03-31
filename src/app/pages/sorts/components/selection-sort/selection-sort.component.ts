import {
  Component,
  OnInit,
  ElementRef,
  ViewChild,
  AfterViewInit,
  OnDestroy,
  Inject,
  PLATFORM_ID,
  ChangeDetectorRef,
} from '@angular/core';
import * as echarts from 'echarts';
import { SortService } from '@app/services/sort/sort.service';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-selection-sort',
  templateUrl: './selection-sort.component.html',
  styleUrls: ['./selection-sort.component.scss'],
  imports: [
    CommonModule,
    MatButtonModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    FormsModule,
  ],
})
export class SelectionSortComponent
  implements OnInit, AfterViewInit, OnDestroy
{
  @ViewChild('chartContainer') chartContainer!: ElementRef;
  private chart: echarts.ECharts | null = null;
  arrayData: number[] = [];
  isSorting = false;
  isPaused = false;
  startTime: number = 0;
  pauseStartTime: number = 0;
  totalPausedTime: number = 0;
  executionTime: number = 0;
  private sortCancelled = false; // Variable para controlar la cancelación del ordenamiento

  // Modo de ingreso de datos
  inputMode: 'auto' | 'manual' = 'auto';
  manualInput: string = '';
  manualValues: number[] = [];

  // Parámetros para la generación del array
  arraySize: number = 20;
  minValue: number = 1;
  maxValue: number = 100;
  sortOrder: 'asc' | 'desc' = 'asc';

  // Opciones para el select de ordenamiento
  sortOptions = [
    { value: 'asc', label: 'Menor a Mayor' },
    { value: 'desc', label: 'Mayor a Menor' },
  ];

  constructor(
    private sortService: SortService,
    @Inject(PLATFORM_ID) private platformId: Object,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit() {
    // No generamos array automáticamente, esperamos input del usuario
  }

  ngAfterViewInit() {
    this.initChart();
  }

  private initChart() {
    if (isPlatformBrowser(this.platformId)) {
      this.chart = echarts.init(this.chartContainer.nativeElement);
    }
  }

  validateInputs(): boolean {
    if (this.minValue >= this.maxValue) {
      alert('El valor mínimo debe ser menor que el valor máximo');
      return false;
    }
    return true;
  }

  onInputModeChange() {
    this.arrayData = [];
    this.manualInput = '';
    this.manualValues = [];
  }

  onArraySizeChange() {
    if (this.inputMode === 'manual') {
      this.manualInput = ''; // Limpiar el input cuando cambia el tamaño
      this.manualValues = [];
    }
  }

  validateManualInput(): boolean {
    if (!this.manualInput.trim()) {
      alert('Por favor ingrese valores');
      return false;
    }

    const values = this.manualInput
      .split(',')
      .map((val) => val.trim())
      .filter((val) => val !== '');

    if (values.length !== this.arraySize) {
      alert(
        `Por favor ingrese exactamente ${this.arraySize} valores separados por comas`,
      );
      return false;
    }

    const numbers = values.map((v) => Number(v));
    if (numbers.some(isNaN)) {
      alert('Todos los valores deben ser números válidos');
      return false;
    }

    this.manualValues = numbers;
    return true;
  }

  generateNewArray() {
    if (this.inputMode === 'auto' && !this.validateInputs()) return;

    // Si hay un ordenamiento en curso, cancelarlo
    if (this.isSorting) {
      this.sortCancelled = true;
      this.isSorting = false;
      this.isPaused = false;
    }

    if (this.inputMode === 'auto') {
      this.arrayData = this.sortService.generarArray(
        this.arraySize,
        this.minValue,
        this.maxValue,
      );
    } else {
      if (!this.validateManualInput()) {
        return;
      }
      this.arrayData = [...this.manualValues];
    }

    this.executionTime = 0; // Resetear el tiempo cuando se genera un nuevo array
    this.updateChart(this.arrayData);
  }

  updateChart(
    data: number[],
    highlightIndex1?: number,
    highlightIndex2?: number,
  ) {
    if (this.chart) {
      const option = {
        animation: true,
        title: {
          text: `Selection Sort - ${
            this.sortOrder === 'asc' ? 'Menor a Mayor' : 'Mayor a Menor'
          }`,
          left: 'center',
        },
        tooltip: {
          trigger: 'item',
          formatter: '{c}',
        },
        xAxis: {
          type: 'category',
          data: data.map((_, index) => (index + 1).toString()),
          axisLabel: {
            interval: 0,
          },
        },
        yAxis: {
          type: 'value',
          max: Math.max(...data) + 10,
        },
        series: [
          {
            data: data.map((value, index) => ({
              value: value,
              itemStyle: {
                color:
                  index === highlightIndex1
                    ? '#ff4444'
                    : index === highlightIndex2
                      ? '#ffbb00'
                      : '#3398db',
              },
            })),
            type: 'bar',
            animation: false,
            animationDuration: 0,
            animationEasing: 'linear',
          },
        ],
      };

      this.chart.setOption(option);
    }
  }

  async startSort() {
    if (this.arrayData.length === 0) {
      alert('Primero genera un array');
      return;
    }

    // Si está pausado, simplemente reanudar
    if (this.isSorting && this.isPaused) {
      this.isPaused = false;
      this.totalPausedTime += performance.now() - this.pauseStartTime;
      return;
    }

    // Si ya está ordenando y no está pausado, no hacer nada
    if (this.isSorting && !this.isPaused) {
      return;
    }

    // Iniciar nuevo ordenamiento
    this.isSorting = true;
    this.isPaused = false;
    this.sortCancelled = false; // Resetear la bandera de cancelación
    this.startTime = performance.now();
    this.totalPausedTime = 0;

    try {
      // Crear una copia del array original para trabajar con él
      const arrayCopy = [...this.arrayData];

      // Implementar Selection Sort directamente aquí para tener más control
      const n = arrayCopy.length;

      for (let i = 0; i < n; i++) {
        // Si el ordenamiento fue cancelado, salir del bucle
        if (this.sortCancelled) {
          break;
        }

        let optimalIdx = i;
        for (let j = i + 1; j < n; j++) {
          // Si el ordenamiento fue cancelado, salir del bucle
          if (this.sortCancelled) {
            break;
          }

          // Mientras esté pausado, esperar
          while (this.isPaused && !this.sortCancelled) {
            await new Promise((resolve) => setTimeout(resolve, 100));
          }

          // Si se canceló durante la pausa, salir
          if (this.sortCancelled) {
            break;
          }

          // Lógica de ordenamiento según orden ascendente o descendente
          if (this.sortOrder === 'asc') {
            if (arrayCopy[j] < arrayCopy[optimalIdx]) {
              optimalIdx = j;
            }
          } else {
            if (arrayCopy[j] > arrayCopy[optimalIdx]) {
              optimalIdx = j;
            }
          }

          // Actualizar la visualización en cada comparación
          this.updateChart(arrayCopy, i, j);

          // Actualizar el tiempo de ejecución en tiempo real
          this.executionTime =
            performance.now() - this.startTime - this.totalPausedTime;
          this.cdr.detectChanges();

          // Pequeña pausa para visualizar cada paso
          await new Promise((resolve) => setTimeout(resolve, 50));
        }

        // Si el ordenamiento fue cancelado, salir del bucle
        if (this.sortCancelled) {
          break;
        }

        // Intercambiar elementos
        if (optimalIdx !== i) {
          const temp = arrayCopy[i];
          arrayCopy[i] = arrayCopy[optimalIdx];
          arrayCopy[optimalIdx] = temp;

          // Actualizar la visualización después del intercambio
          this.updateChart(arrayCopy, i, optimalIdx);

          // Pequeña pausa para visualizar el intercambio
          await new Promise((resolve) => setTimeout(resolve, 200));
        }

        // Actualizar el tiempo de ejecución
        this.executionTime =
          performance.now() - this.startTime - this.totalPausedTime;
        this.cdr.detectChanges();
      }

      // Actualizar array final
      this.arrayData = arrayCopy;

      // Si no fue cancelado, mostrar estado final
      if (!this.sortCancelled) {
        this.executionTime =
          performance.now() - this.startTime - this.totalPausedTime;
        this.updateChart(this.arrayData);
      }

      this.isSorting = false;
      this.isPaused = false;
      this.cdr.detectChanges();
    } catch (error) {
      console.error('Error durante el ordenamiento:', error);
      this.isSorting = false;
      this.isPaused = false;
      this.sortCancelled = false;
    }
  }

  togglePause() {
    if (!this.isSorting) return;

    this.isPaused = !this.isPaused;
    if (this.isPaused) {
      // Guardar el momento en que se pausó
      this.pauseStartTime = performance.now();
    } else {
      // Calcular el tiempo total pausado
      this.totalPausedTime += performance.now() - this.pauseStartTime;
    }
  }

  ngOnDestroy() {
    // Asegurarse de cancelar cualquier ordenamiento en curso
    this.sortCancelled = true;
    if (this.chart) {
      this.chart.dispose();
    }
  }
}
