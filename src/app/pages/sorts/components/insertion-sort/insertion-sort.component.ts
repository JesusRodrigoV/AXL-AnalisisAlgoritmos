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
  selector: 'app-insertion-sort',
  templateUrl: './insertion-sort.component.html',
  standalone: true,
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
export class InsertionSortComponent
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
  private sortCancelled = false;

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
    // Esperamos input del usuario
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

  generateNewArray() {
    if (!this.validateInputs()) return;

    // Si hay un ordenamiento en curso, cancelarlo
    if (this.isSorting) {
      this.sortCancelled = true;
      this.isSorting = false;
      this.isPaused = false;
    }

    this.arrayData = this.sortService.generarArray(
      this.arraySize,
      this.minValue,
      this.maxValue,
    );
    this.executionTime = 0;
    this.updateChart(this.arrayData);
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
    this.sortCancelled = false;
    this.startTime = performance.now();
    this.totalPausedTime = 0;

    try {
      const arrayCopy = [...this.arrayData];
      const n = arrayCopy.length;

      for (let i = 1; i < n && !this.sortCancelled; i++) {
        const current = arrayCopy[i];
        let j = i - 1;

        while (j >= 0 && !this.sortCancelled) {
          // Mientras esté pausado, esperar
          while (this.isPaused && !this.sortCancelled) {
            await new Promise((resolve) => setTimeout(resolve, 100));
          }

          // Si se canceló durante la pausa, salir
          if (this.sortCancelled) break;

          const shouldMove =
            this.sortOrder === 'asc'
              ? arrayCopy[j] > current
              : arrayCopy[j] < current;

          if (!shouldMove) break;

          arrayCopy[j + 1] = arrayCopy[j];
          this.updateChart(arrayCopy, j, i);

          // Actualizar tiempo de ejecución
          this.executionTime =
            performance.now() - this.startTime - this.totalPausedTime;
          this.cdr.detectChanges();

          await new Promise((resolve) => setTimeout(resolve, 50));
          j--;
        }

        if (this.sortCancelled) break;

        arrayCopy[j + 1] = current;
        this.updateChart(arrayCopy, j + 1, i);

        // Actualizar tiempo
        this.executionTime =
          performance.now() - this.startTime - this.totalPausedTime;
        this.cdr.detectChanges();

        await new Promise((resolve) => setTimeout(resolve, 200));
      }

      // Actualizar array final
      this.arrayData = arrayCopy;

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
      this.pauseStartTime = performance.now();
    } else {
      this.totalPausedTime += performance.now() - this.pauseStartTime;
    }
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
          text: `Insertion Sort - ${
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

  ngOnDestroy() {
    this.sortCancelled = true;
    if (this.chart) {
      this.chart.dispose();
    }
  }
}
