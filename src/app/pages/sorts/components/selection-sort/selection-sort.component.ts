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
    if (this.arraySize <= 0 || this.arraySize > 100) {
      alert('El tamaño del array debe estar entre 1 y 100');
      return false;
    }
    if (this.minValue >= this.maxValue) {
      alert('El valor mínimo debe ser menor que el valor máximo');
      return false;
    }
    return true;
  }

  generateNewArray() {
    if (!this.validateInputs()) return;

    this.arrayData = this.sortService.generarArray(
      this.arraySize,
      this.minValue,
      this.maxValue,
    );
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

    if (!this.isSorting) {
      // Iniciar nuevo ordenamiento
      this.isSorting = true;
      this.isPaused = false;
      this.startTime = performance.now();
      this.totalPausedTime = 0;
    }

    try {
      await this.sortService.selectionSort(
        this.arrayData,
        this.sortOrder,
        async (arr, index1, index2) => {
          this.arrayData = [...arr];
          this.updateChart(arr, index1, index2);

          // Actualizar tiempo en tiempo real
          if (!this.isPaused) {
            this.executionTime =
              performance.now() - this.startTime - this.totalPausedTime;
            this.cdr.detectChanges();
          }

          // Si está pausado, esperar hasta que se reanude
          while (this.isPaused) {
            await new Promise((resolve) => setTimeout(resolve, 100));
          }
        },
      );

      this.executionTime =
        performance.now() - this.startTime - this.totalPausedTime;
      this.isSorting = false;
      this.isPaused = false;
      this.updateChart(this.arrayData);
      this.cdr.detectChanges();
    } catch (error) {
      console.error('Error durante el ordenamiento:', error);
      this.isSorting = false;
      this.isPaused = false;
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
    if (this.chart) {
      this.chart.dispose();
    }
  }
}
