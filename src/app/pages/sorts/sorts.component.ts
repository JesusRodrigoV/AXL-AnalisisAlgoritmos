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
import { MatIconModule } from '@angular/material/icon';
import { FormsModule } from '@angular/forms';
import * as echarts from 'echarts';
import { SortService } from '@app/services/sort/sort.service';
import { HelpButtonComponent } from '../../src/help-button/help-button.component';
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
    MatIconModule,
    FormsModule,
    HelpButtonComponent,
  ],
  templateUrl: './sorts.component.html',
  styleUrl: './sorts.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class SortsComponent implements OnInit, OnDestroy {
  private originalArray: number[] = [];

  exportToJSON(): void {
    const arrayToExport = this.sorting ? this.originalArray : this.array;
    const data = {
      array: arrayToExport,
      metadata: {
        timestamp: new Date().toISOString(),
        arraySize: arrayToExport.length,
        minValue: Math.min(...arrayToExport),
        maxValue: Math.max(...arrayToExport),
      },
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: 'application/json',
    });
    this.downloadFile(blob, 'array-data.json');
  }

  exportToTXT(): void {
    const arrayToExport = this.sorting ? this.originalArray : this.array;
    const content = arrayToExport.join(', ');
    const blob = new Blob([content], { type: 'text/plain' });
    this.downloadFile(blob, 'array-data.txt');
  }

  private downloadFile(blob: Blob, filename: string): void {
    const link = document.createElement('a');
    link.href = window.URL.createObjectURL(blob);
    link.download = filename;
    link.click();
    window.URL.revokeObjectURL(link.href);
  }

  importArray(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        let importedArray: number[] = [];

        if (file.name.endsWith('.json')) {
          const data = JSON.parse(content);
          importedArray = data.array;
        } else if (file.name.endsWith('.txt')) {
          importedArray = content
            .split(',')
            .map((num) => parseInt(num.trim()))
            .filter((num) => !isNaN(num));
        }

        if (importedArray.length > 0) {
          this.array = importedArray;
          this.arraySize = importedArray.length;
          this.arrayInputMode = 'manual';
          this.manualArrayInput = importedArray.join(', ');
          this.minValue = Math.min(...importedArray);
          this.maxValue = Math.max(...importedArray);
          this.updateChartOptions();
        }
      } catch (error) {
        console.error('Error al importar el archivo:', error);
        // Aquí podrías agregar una notificación al usuario
      }
    };

    if (file.name.endsWith('.json')) {
      reader.readAsText(file);
    } else if (file.name.endsWith('.txt')) {
      reader.readAsText(file);
    }
  }
  //private originalArray: number[] = [];
  isPaused: boolean = false;
  @ViewChild('chartContainer', { static: true }) chartContainer!: ElementRef;

  private chart: echarts.ECharts | null = null;
  sorting = false;
  private currentAnimation: Promise<number[]> | null = null;
  executionTime: number = 0;
  private startTime: number = 0;

  array: number[] = [];
  selectedAlgorithm: SortAlgorithm = 'selection';
  arraySize = 50;
  minValue = 1;
  maxValue = 100;
  sortOrder: 'asc' | 'desc' = 'asc';
  hValue: number = 25; // Inicialmente será N/2
  arrayInputMode: 'random' | 'manual' = 'random';
  manualArrayInput: string = '';

  getPreviewArray(): number[] {
    if (!this.manualArrayInput) return [];
    return this.manualArrayInput
      .split(',')
      .map((str) => parseInt(str.trim()))
      .filter((num) => !isNaN(num))
      .slice(0, 100); // Limitamos a 100 elementos para la vista previa
  }

  readonly helpContent: HelpContent = {
    title: 'Algoritmos de Ordenamiento',
    description:
      'Visualización interactiva de algoritmos de ordenamiento con múltiples opciones de personalización.',
    steps: [
      {
        number: 1,
        title: 'Selection Sort',
        description:
          'Busca el elemento más pequeño y lo coloca al principio. Complejidad: O(n²)',
      },
      {
        number: 2,
        title: 'Insertion Sort',
        description:
          'Construye la lista final insertando un elemento a la vez. Complejidad: O(n²)',
      },
      {
        number: 3,
        title: 'Shell Sort',
        description:
          'Mejora del Insertion Sort que permite el intercambio de elementos distantes. Complejidad: O(n log n)',
      },
      {
        number: 4,
        title: 'Merge Sort',
        description:
          'Divide la lista en mitades, ordena y combina. Complejidad: O(n log n)',
      },
    ],
    tips: [
      'Usa arrays pequeños para ver mejor la animación',
      'Puedes pausar y reanudar la animación en cualquier momento',
      'Importa arrays desde archivos JSON o TXT para análisis específicos',
      'El modo manual permite ingresar tus propios números para ordenar',
      'Exporta los arrays en formato JSON (con metadata) o TXT',
      'El botón de reinicio detiene completamente el ordenamiento actual',
      'Puedes cambiar entre orden ascendente y descendente',
      'La visualización muestra el valor y posición al pasar el mouse',
    ],
  };

  constructor(
    private sortService: SortService,
    private cdr: ChangeDetectorRef,
    @Inject(PLATFORM_ID) private platformId: object,
  ) {}

  ngOnInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      this.initializeChart();
      this.generateNewArray();
    }
  }

  ngOnDestroy(): void {
    if (this.chart) {
      this.chart.dispose();
    }
  }

  private initializeChart(): void {
    this.chart = echarts.init(this.chartContainer.nativeElement);
    this.updateChartOptions();
  }

  private updateChartOptions(): void {
    if (!this.chart) return;

    const options: echarts.EChartsOption = {
      animation: false,
      grid: {
        left: '5%',
        right: '5%',
        bottom: '10%',
        top: '5%',
        containLabel: true,
      },
      tooltip: {
        trigger: 'item',
        formatter: (params: any) => {
          const value = params.value;
          const index = params.dataIndex;
          return `Valor: ${value}<br/>Posición: ${index}`;
        },
        backgroundColor: 'rgba(50, 50, 50, 0.9)',
        borderRadius: 8,
        padding: [8, 12],
        textStyle: {
          color: '#fff',
          fontSize: 14,
        },
        extraCssText: 'box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);',
      },
      xAxis: {
        type: 'category',
        data: this.array.map((_, index) => index.toString()),
        show: true,
        axisTick: {
          alignWithLabel: true,
        },
        axisLabel: {
          color: '#2c3e50',
          interval: Math.ceil(this.array.length / 10), // Mostrar cada N etiquetas para no sobrecargar
        },
        axisLine: {
          lineStyle: {
            color: '#2c3e50',
          },
        },
      },
      yAxis: {
        type: 'value',
        show: true,
        axisLabel: {
          color: '#2c3e50',
        },
        axisLine: {
          lineStyle: {
            color: '#2c3e50',
          },
        },
        splitLine: {
          lineStyle: {
            color: 'rgba(0,0,0,0.05)',
          },
        },
      },
      series: [
        {
          type: 'bar',
          data: this.array,
          itemStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: '#63b3ed' },
              { offset: 0.5, color: '#4299e1' },
              { offset: 1, color: '#3182ce' },
            ]),
            borderRadius: [12, 12, 0, 0],
            shadowColor: 'rgba(0, 0, 0, 0.2)',
            shadowBlur: 10,
            shadowOffsetY: 5,
          },
          emphasis: {
            itemStyle: {
              color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                { offset: 0, color: '#FF6B6B' },
                { offset: 0.5, color: '#e74c3c' },
                { offset: 1, color: '#c0392b' },
              ]),
              shadowColor: 'rgba(231, 76, 60, 0.4)',
              shadowBlur: 15,
              shadowOffsetY: 5,
            },
          },
        },
      ],
    };

    this.chart.setOption(options);
  }

  generateNewArray(): void {
    // Si hay un ordenamiento en proceso, primero hacer reset
    if (this.sorting) {
      this.reset();
    }

    if (this.arrayInputMode === 'random') {
      this.array = this.sortService.generarArray(
        this.arraySize,
        this.minValue,
        this.maxValue,
      );
    } else {
      // Convertir el string de entrada en un array de números
      const values = this.manualArrayInput
        .split(',')
        .map((str) => parseInt(str.trim()))
        .filter((num) => !isNaN(num));

      if (values.length === 0) {
        // Si no hay valores válidos, generar array aleatorio
        this.array = this.sortService.generarArray(
          this.arraySize,
          this.minValue,
          this.maxValue,
        );
      } else {
        this.array = values;
        this.arraySize = values.length; // Actualizar el tamaño del array
      }
    }

    // Actualizar el valor de h cuando cambia el tamaño del array
    this.hValue = Math.floor(this.arraySize / 2);
    this.updateChartOptions();
  }

  togglePause(): void {
    this.isPaused = !this.isPaused;
    this.sortService.togglePause();
    this.cdr.detectChanges();
  }

  async startSort(): Promise<void> {
    if (this.sorting) return;

    // Asegurarnos de que empezamos desde un estado limpio
    this.isPaused = false;
    this.sortService.resetPauseState();

    this.sorting = true;
    this.startTime = performance.now();
    this.originalArray = [...this.array]; // Guardamos el array original
    this.executionTime = 0;
    const h = Math.floor(this.array.length / 2);

    try {
      this.currentAnimation = this.runSortingAlgorithm();
      await this.currentAnimation;
    } finally {
      this.sorting = false;
      this.currentAnimation = null;
      this.executionTime = Number(
        (performance.now() - this.startTime).toFixed(2),
      );
      this.cdr.markForCheck();
    }
  }

  private runSortingAlgorithm(): Promise<number[]> {
    switch (this.selectedAlgorithm) {
      case 'selection':
        return this.sortService.selectionSort(
          this.array,
          this.sortOrder,
          this.updateVisualization.bind(this),
        );
      case 'insertion':
        return this.sortService.insertionSort(
          this.array,
          this.sortOrder,
          this.updateVisualization.bind(this),
        );
      case 'shell':
        return this.sortService.shellSort(
          this.array,
          this.hValue,
          this.sortOrder,
          this.updateVisualization.bind(this),
        );
      case 'merge':
        return this.sortService.mergeSort(
          this.array,
          this.sortOrder,
          this.updateVisualization.bind(this),
        );
      default:
        return Promise.resolve([]);
    }
  }

  private updateVisualization(
    newArray: number[],
    index1: number,
    index2: number,
  ): void {
    this.array = [...newArray];

    if (this.chart) {
      const emphasizedData = this.array.map((value, idx) => ({
        value,
        itemStyle: {
          color:
            idx === index1 || idx === index2
              ? new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                  { offset: 0, color: '#e74c3c' },
                  { offset: 1, color: '#c0392b' },
                ])
              : new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                  { offset: 0, color: '#3498db' },
                  { offset: 1, color: '#2980b9' },
                ]),
        },
      }));

      this.chart.setOption({
        series: [
          {
            data: emphasizedData,
          },
        ],
      });
    }
  }

  reset(): void {
    // Detener cualquier timeout pendiente primero
    if (this.sortService) {
      this.sortService.clearTimeouts();
    }

    // Detener el ordenamiento y la animación
    this.sorting = false;
    this.currentAnimation = null;
    this.executionTime = 0;

    // Resetear estados de pausa
    this.isPaused = false;
    this.sortService.resetPauseState();

    // Limpiar el array y actualizar el estado
    this.array = [];

    // Actualizar la visualización con el array vacío
    if (this.chart) {
      this.chart.clear();
      this.chart.setOption({
        xAxis: {
          type: 'category',
          show: false,
        },
        yAxis: {
          type: 'value',
          show: false,
        },
        series: [
          {
            type: 'bar',
            data: [],
            itemStyle: {
              color: '#3498db',
            },
          },
        ],
      });
    }

    this.cdr.detectChanges();
  }
}
