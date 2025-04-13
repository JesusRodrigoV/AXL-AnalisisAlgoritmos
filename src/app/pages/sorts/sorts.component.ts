import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
  Inject,
  OnDestroy,
  OnInit,
  PLATFORM_ID,
  ViewChild,
} from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatMenuModule } from '@angular/material/menu';
import { FormsModule } from '@angular/forms';
import * as echarts from 'echarts';
import { SortService } from '@app/services/sort/sort.service';

type SortAlgorithm = 'selection' | 'insertion' | 'shell' | 'merge';

@Component({
  selector: 'app-sorts',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonToggleModule,
    MatButtonModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatMenuModule,
    FormsModule,
  ],
  templateUrl: './sorts.component.html',
  styleUrl: './sorts.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class SortsComponent implements OnInit, OnDestroy {
  @ViewChild('chartContainer') chartContainer!: ElementRef;

  private chart: echarts.ECharts | null = null;
  private sortCancelled = false;
  private lastAlgorithm: SortAlgorithm | null = null;

  selectedAlgorithm: SortAlgorithm = 'selection';

  // Agregar watcher para cambios en el algoritmo
  onAlgorithmChange() {
    // Si hay un ordenamiento en proceso, lo cancelamos y reseteamos
    if (this.isSorting) {
      this.sortCancelled = true;
      this.isSorting = false;
      // Restaurar el array al estado actual antes del ordenamiento
      if (this.originalArray.length > 0) {
        this.arrayData = [...this.originalArray];
      }
    }

    // Resetear tiempo de ejecución
    this.executionTime = 0;

    // Actualizar el gráfico con el array actual
    this.updateChart(this.arrayData);
    this.cdr.detectChanges();
  }

  arrayData: number[] = [];
  originalArray: number[] = []; // Guardaremos una copia del array original
  isSorting = false;
  isPaused = false;

  startTime: number = 0;
  pauseStartTime: number = 0;
  totalPausedTime: number = 0;
  executionTime: number = 0;

  pausePromiseResolve: (() => void) | null = null;

  inputMode: 'auto' | 'manual' = 'auto';
  manualInput: string = '';
  manualValues: number[] = [];

  arraySize: number = 20;
  minValue: number = 1;
  maxValue: number = 100;
  hValue: number = 10;
  sortOrder: 'asc' | 'desc' = 'asc';

  sortOptions = [
    { value: 'asc', label: 'Menor a Mayor' },
    { value: 'desc', label: 'Mayor a Menor' },
  ];

  constructor(
    private sortService: SortService,
    @Inject(PLATFORM_ID) private platformId: Object,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit() {}

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
    if (this.selectedAlgorithm === 'shell') {
      if (this.hValue <= 0 || this.hValue > this.arraySize) {
        alert(
          'El valor de h debe ser mayor a 0 y menor o igual al tamaño del array',
        );
        return false;
      }
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
      this.manualInput = '';
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

    if (this.isSorting) {
      this.sortCancelled = true;
      this.isSorting = false;
    }

    if (this.inputMode === 'auto') {
      this.arrayData = this.sortService.generarArray(
        this.arraySize,
        this.minValue,
        this.maxValue,
      );
      this.originalArray = [...this.arrayData]; // Guardamos copia del array original
    } else {
      if (!this.validateManualInput()) return;
      this.arrayData = [...this.manualValues];
      this.originalArray = [...this.manualValues]; // Guardamos copia del array original
    }

    this.executionTime = 0;
    this.updateChart(this.arrayData);
  }

  async startSort() {
    if (this.arrayData.length === 0) {
      alert('Primero genera un array');
      return;
    }

    // Si ya está ordenando, no hacer nada
    if (this.isSorting) return;

    // Limpiar estados antes de comenzar nuevo ordenamiento
    this.sortCancelled = false;
    this.isSorting = true;
    this.startTime = performance.now();
    this.executionTime = 0;

    try {
      switch (this.selectedAlgorithm) {
        case 'selection':
          await this.sortService.selectionSort(
            this.arrayData,
            this.sortOrder,
            this.onCompare.bind(this),
          );
          break;
        case 'insertion':
          await this.sortService.insertionSort(
            this.arrayData,
            this.sortOrder,
            this.onCompare.bind(this),
          );
          break;
        case 'shell':
          await this.sortService.shellSort(
            this.arrayData,
            this.hValue,
            this.sortOrder,
            this.onCompare.bind(this),
          );
          break;
        case 'merge':
          await this.sortService.mergeSort(
            this.arrayData,
            this.sortOrder,
            this.onCompare.bind(this),
          );
          break;
      }
    } catch (error) {
      console.error('Error durante el ordenamiento:', error);
    } finally {
      this.isSorting = false;
      if (this.startTime) {
        this.executionTime = performance.now() - this.startTime;
      }
      this.cdr.detectChanges();
    }
  }

  updateChart(
    data: number[],
    highlightIndex1?: number,
    highlightIndex2?: number,
  ) {
    if (this.chart) {
      // Destruir y reinicializar el chart para limpiar el estado
      if (this.lastAlgorithm !== this.selectedAlgorithm) {
        this.chart.dispose();
        this.chart = echarts.init(this.chartContainer.nativeElement);
        this.lastAlgorithm = this.selectedAlgorithm;
      }

      const option = {
        animation: false,
        title: {
          text: `${this.selectedAlgorithm.charAt(0).toUpperCase() + this.selectedAlgorithm.slice(1)} Sort - ${
            this.sortOrder === 'asc' ? 'Menor a Mayor' : 'Mayor a Menor'
          }`,
          left: 'center',
          top: 10,
          textStyle: {
            fontSize: 16,
            fontWeight: 'bold',
          },
        },
        tooltip: {
          trigger: 'axis',
          formatter: (params: any) => {
            const dataIndex = params[0].dataIndex;
            return `Posición: ${dataIndex + 1}<br/>Valor: ${params[0].value}`;
          },
          axisPointer: {
            type: 'shadow',
          },
        },
        grid: {
          left: '3%',
          right: '4%',
          bottom: '8%',
          top: '15%',
          containLabel: true,
        },
        dataZoom: [
          {
            type: 'slider',
            show: this.arrayData.length > 50,
            xAxisIndex: 0,
            start: 0,
            end: 100,
            height: 20,
            bottom: 0,
            borderColor: 'transparent',
          },
          {
            type: 'inside',
            xAxisIndex: 0,
            start: 0,
            end: 100,
          },
        ],
        xAxis: {
          type: 'category',
          data: data.map((_, index) => (index + 1).toString()),
          axisLabel: {
            interval: Math.floor(data.length / 50), // Mostrar menos etiquetas si hay muchos elementos
            rotate: data.length > 30 ? 45 : 0, // Rotar etiquetas si hay muchos elementos
            hideOverlap: true,
            fontSize: 10,
          },
          axisTick: {
            alignWithLabel: true,
          },
        },
        yAxis: {
          type: 'value',
          max: Math.max(...data) + 10,
          splitLine: {
            lineStyle: {
              type: 'dashed',
            },
          },
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

  async onCompare(arr: number[], index1: number, index2: number) {
    // Si se canceló el ordenamiento, detener la ejecución
    if (this.sortCancelled) {
      throw new Error('Sort cancelled');
    }

    // Actualizar el array
    this.arrayData = [...arr];

    // Configurar delays específicos para cada algoritmo
    const BASE_DELAY = 3000;
    const arrayLength = this.arrayData.length;
    let delay: number;

    switch (this.selectedAlgorithm) {
      case 'shell':
        delay = Math.max(100, (BASE_DELAY / arrayLength) * 2);
        break;
      case 'merge':
        delay = Math.max(80, (BASE_DELAY / arrayLength) * 1.5);
        break;
      case 'insertion':
        delay = Math.max(60, BASE_DELAY / arrayLength);
        break;
      case 'selection':
        delay = Math.max(50, BASE_DELAY / arrayLength);
        break;
      default:
        delay = Math.max(50, BASE_DELAY / arrayLength);
    }

    // Crear una promesa para esperar la actualización del DOM
    const updatePromise = new Promise<void>((resolve) => {
      requestAnimationFrame(() => {
        this.updateChart(this.arrayData, index1, index2);
        resolve();
      });
    });

    // Esperar a que se complete la actualización del DOM
    await updatePromise;

    // Calcular y actualizar el tiempo de ejecución
    if (this.startTime > 0) {
      this.executionTime = performance.now() - this.startTime;
    }

    // Asegurar que la UI se actualice
    this.cdr.detectChanges();

    // Esperar el delay configurado
    await new Promise<void>((resolve) => setTimeout(resolve, delay));
  }

  clearSort() {
    // Si hay un ordenamiento en progreso, lo cancelamos
    if (this.isSorting) {
      this.sortCancelled = true;
      this.isSorting = false;
    }

    // Reseteamos el tiempo de ejecución
    this.executionTime = 0;

    // Restauramos el array a su estado original
    if (this.originalArray.length > 0) {
      this.arrayData = [...this.originalArray];
    }

    // Actualizamos el gráfico
    this.updateChart(this.arrayData);
    this.cdr.detectChanges();
  }

  async handleFileInput(event: Event) {
    const input = event.target as HTMLInputElement;
    if (!input.files?.length) return;

    const file = input.files[0];
    const fileExt = file.name.split('.').pop()?.toLowerCase();

    try {
      const content = await file.text();
      let numbers: number[] = [];

      if (fileExt === 'json') {
        const data = JSON.parse(content);
        if (Array.isArray(data)) {
          numbers = data.map(Number);
        }
      } else if (fileExt === 'txt') {
        numbers = content
          .split(/[,\n]/)
          .map((s) => s.trim())
          .filter(Boolean)
          .map(Number);
      }

      if (numbers.some(isNaN)) {
        throw new Error('El archivo contiene valores no numéricos');
      }

      this.arraySize = numbers.length;
      this.arrayData = numbers;
      this.inputMode = 'manual';
      this.manualInput = numbers.join(', ');
      this.manualValues = [...numbers];

      this.updateChart(this.arrayData);
      this.executionTime = 0;
      this.cdr.detectChanges();
    } catch (error) {
      alert('Error al leer el archivo: ' + (error as Error).message);
    }

    input.value = '';
  }

  exportArray(format: 'json' | 'txt') {
    if (!this.arrayData.length) return;

    let content: string;
    let filename: string;
    let type: string;

    if (format === 'json') {
      content = JSON.stringify(this.arrayData, null, 2);
      filename = 'array.json';
      type = 'application/json';
    } else {
      content = this.arrayData.join(',');
      filename = 'array.txt';
      type = 'text/plain';
    }

    const blob = new Blob([content], { type });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');

    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  }

  ngOnDestroy() {
    this.sortCancelled = true;
    if (this.chart) {
      this.chart.dispose();
    }
  }
}
