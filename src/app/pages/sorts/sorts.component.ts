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
import { HelpButtonComponent } from '@app/src/help-button';
import { HelpContent } from '@app/models/Help.model';

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
    HelpButtonComponent,
  ],
  templateUrl: './sorts.component.html',
  styleUrl: './sorts.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class SortsComponent implements OnInit, OnDestroy {
  @ViewChild('chartContainer') chartContainer!: ElementRef;
  helpContent: HelpContent = {
    title: 'Algoritmos de Ordenamiento',
    description:
      'Esta herramienta te permite visualizar y comparar diferentes algoritmos de ordenamiento. Puedes ver paso a paso cómo funcionan los algoritmos Selection Sort, Insertion Sort, Shell Sort y Merge Sort con una representación gráfica en tiempo real.',
    steps: [
      {
        number: 1,
        title: 'Configuración del Array',
        description:
          'Elige entre generación automática o manual del array:\n- Automático: Define tamaño, valores mínimos y máximos\n- Manual: Ingresa los valores separados por comas\n- También puedes importar datos desde archivos JSON o TXT',
        image: 'assets/help/sort-config.png',
      },
      {
        number: 2,
        title: 'Selección del Algoritmo',
        description:
          'Elige entre cuatro algoritmos de ordenamiento:\n- Selection Sort: Ideal para arrays pequeños\n- Insertion Sort: Eficiente para arrays casi ordenados\n- Shell Sort: Mejora del Insertion Sort\n- Merge Sort: Eficiente para grandes conjuntos de datos',
        image: 'assets/help/sort-algorithms.png',
      },
      {
        number: 3,
        title: 'Controles de Ordenamiento',
        description:
          'Utiliza los controles para:\n- Iniciar el ordenamiento\n- Pausar/Reanudar la visualización\n- Cambiar la dirección (ascendente/descendente)\n- Ajustar la velocidad de visualización',
        image: 'assets/help/sort-controls.png',
      },
      {
        number: 4,
        title: 'Visualización y Análisis',
        description:
          'Observa en tiempo real:\n- Comparaciones entre elementos\n- Intercambios realizados\n- Tiempo de ejecución\n- Estado actual del array',
      },
    ],
    tips: [
      'Para arrays grandes (>50 elementos), usa el zoom para ver mejor los detalles',
      'El color rojo indica el elemento que se está comparando actualmente',
      'El color amarillo muestra el elemento con el que se está comparando',
      'Para un mejor análisis, prueba el mismo array con diferentes algoritmos',
      "Shell Sort requiere un valor 'h' - prueba diferentes valores para ver su impacto",
      'Puedes exportar los arrays para comparar resultados posteriormente',
    ],
    images: [
      {
        url: 'assets/help/sort-visualization.png',
        caption: 'Visualización del proceso de ordenamiento',
        alt: 'Gráfico de barras mostrando el proceso de ordenamiento',
      },
      {
        url: 'assets/help/sort-comparison.png',
        caption: 'Comparación de algoritmos',
        alt: 'Diferentes algoritmos de ordenamiento en acción',
      },
    ],
    videos: [
      {
        url: 'https://www.youtube.com/watch?v=sorting-algorithms',
        title: 'Tutorial: Entendiendo los Algoritmos de Ordenamiento',
        thumbnail: 'assets/help/sorting-tutorial-thumb.png',
      },
    ],
  };
  private chart: echarts.ECharts | null = null;
  private sortCancelled = false;

  selectedAlgorithm: SortAlgorithm = 'selection';

  arrayData: number[] = [];
  isSorting = false;
  isPaused = false;

  startTime: number = 0;
  pauseStartTime: number = 0;
  totalPausedTime: number = 0;
  executionTime: number = 0;

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
      this.isPaused = false;
    }

    if (this.inputMode === 'auto') {
      this.arrayData = this.sortService.generarArray(
        this.arraySize,
        this.minValue,
        this.maxValue,
      );
    } else {
      if (!this.validateManualInput()) return;
      this.arrayData = [...this.manualValues];
    }

    this.executionTime = 0;
    this.updateChart(this.arrayData);
  }

  async startSort() {
    if (this.arrayData.length === 0) {
      alert('Primero genera un array');
      return;
    }

    // Si estaba en pausa, solo reanudar
    if (this.isSorting && this.isPaused) {
      this.isPaused = false;
      this.totalPausedTime += performance.now() - this.pauseStartTime;
      this.cdr.detectChanges();
      return;
    }

    // Si ya está ordenando y no está pausado, no hacer nada
    if (this.isSorting && !this.isPaused) return;

    // Limpiar estados antes de comenzar nuevo ordenamiento
    this.sortCancelled = false;
    this.isSorting = true;
    this.isPaused = false;
    this.startTime = performance.now();
    this.totalPausedTime = 0;
    this.executionTime = 0;

    this.isSorting = true;
    this.isPaused = false;
    this.sortCancelled = false;
    this.startTime = performance.now();
    this.totalPausedTime = 0;

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
      this.isPaused = false;
      if (this.startTime) {
        this.executionTime =
          performance.now() - this.startTime - this.totalPausedTime;
      }
      this.cdr.detectChanges();
    }
  }

  togglePause() {
    if (!this.isSorting) return;

    this.isPaused = !this.isPaused;
    if (this.isPaused) {
      this.pauseStartTime = performance.now();
    } else {
      if (this.pauseStartTime > 0) {
        this.totalPausedTime += performance.now() - this.pauseStartTime;
      }
    }
    this.cdr.detectChanges();
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
    if (this.isPaused) {
      return new Promise<void>((resolve) => {
        const checkPause = () => {
          if (!this.isPaused) {
            resolve();
          } else {
            setTimeout(checkPause, 100);
          }
        };
        checkPause();
      });
    }

    this.arrayData = [...arr];
    this.updateChart(this.arrayData, index1, index2);
    this.executionTime =
      performance.now() - this.startTime - this.totalPausedTime;
    this.cdr.detectChanges();

    return new Promise<void>((resolve) => setTimeout(resolve, 50));

    const BASE_DELAY = 3000;
    const delay = BASE_DELAY / this.arrayData.length;
    return new Promise<void>((resolve) => setTimeout(resolve, delay));
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
