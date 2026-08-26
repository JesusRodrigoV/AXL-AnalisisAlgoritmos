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
import { MatCardModule } from '@angular/material/card';
import { SortService, SortContext } from '@app/services/sort/sort.service';
import { SortChartService } from '@app/services/sort/sort-chart.service';
import { ArrayFileService } from '@app/services/sort/array-file.service';
import { HelpButtonComponent } from '@app/shared/components/help-button';
import {
  SortConfigComponent,
  SortAlgorithm,
  SortOrder,
  InputMode,
} from './components/sort-config';
import { SortControlsComponent } from './components/sort-controls';
import { SORTS_HELP_CONTENT } from './sorts-help.data';

@Component({
  selector: 'app-sorts',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    HelpButtonComponent,
    SortConfigComponent,
    SortControlsComponent,
  ],
  templateUrl: './sorts.component.html',
  styleUrl: './sorts.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class SortsComponent implements OnInit, OnDestroy {
  @ViewChild('chartContainer') chartContainer!: ElementRef;

  helpContent = SORTS_HELP_CONTENT;

  arrayData: number[] = [];
  originalArray: number[] = [];
  isSorting = false;
  isPaused = false;
  executionTime = 0;
  speedMultiplier = 1;

  selectedAlgorithm: SortAlgorithm = 'selection';
  inputMode: InputMode = 'auto';
  manualInput = '';
  arraySize = 20;
  minValue = 1;
  maxValue = 100;
  hValue = 10;
  sortOrder: SortOrder = 'asc';

  private startTime = 0;
  private totalPausedTime = 0;
  private sortCtx: SortContext | null = null;
  private rafId = 0;
  private pendingStep: { arr: number[]; i: number; j: number } | null = null;

  constructor(
    private sortService: SortService,
    private chartService: SortChartService,
    private fileService: ArrayFileService,
    @Inject(PLATFORM_ID) private platformId: Object,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit() {}

  ngAfterViewInit() {
    if (isPlatformBrowser(this.platformId)) {
      this.chartService.initChart(this.chartContainer.nativeElement);
    }
  }

  // --- Config handlers ---

  onAlgorithmChange(algorithm: SortAlgorithm) {
    if (this.isSorting) this.cancelSort();
    this.selectedAlgorithm = algorithm;
    this.executionTime = 0;
    this.chartService.updateChart(this.arrayData, algorithm, this.sortOrder);
    this.cdr.detectChanges();
  }

  onInputModeChange(mode: InputMode) {
    this.inputMode = mode;
    this.arrayData = [];
    this.manualInput = '';
  }

  onArraySizeChange(size: number) {
    this.arraySize = size;
    if (this.inputMode === 'manual') this.manualInput = '';
  }

  onMinValueChange(val: number) { this.minValue = val; }
  onMaxValueChange(val: number) { this.maxValue = val; }
  onHValueChange(val: number) { this.hValue = val; }
  onSortOrderChange(order: SortOrder) { this.sortOrder = order; }
  onManualInputChange(val: string) { this.manualInput = val; }
  onSpeedChange(speed: number) { this.speedMultiplier = speed; }

  onValidationError(msg: string) {
    alert(msg);
  }

  // --- Array generation ---

  generateArray() {
    if (this.isSorting) this.cancelSort();

    if (this.inputMode === 'auto') {
      this.arrayData = this.sortService.generarArray(
        this.arraySize, this.minValue, this.maxValue,
      );
    } else {
      const parsed = this.parseManualValues();
      if (!parsed) return;
      this.arrayData = parsed;
    }

    this.originalArray = [...this.arrayData];
    this.executionTime = 0;
    this.chartService.updateChart(
      this.arrayData, this.selectedAlgorithm, this.sortOrder,
    );
    this.cdr.detectChanges();
  }

  private parseManualValues(): number[] | null {
    if (!this.manualInput.trim()) {
      alert('Por favor ingrese valores');
      return null;
    }
    const numbers = this.manualInput
      .split(',')
      .map((v) => v.trim())
      .filter(Boolean)
      .map(Number);
    if (numbers.some(isNaN)) {
      alert('Todos los valores deben ser números válidos');
      return null;
    }
    return numbers;
  }

  // --- Sort execution ---

  async startSort() {
    if (this.arrayData.length === 0) {
      alert('Primero genera un array');
      return;
    }

    if (this.isSorting && this.isPaused) {
      this.resumeSort();
      return;
    }

    if (this.isSorting) return;

    this.isSorting = true;
    this.isPaused = false;
    this.executionTime = 0;
    this.arrayData = [...this.originalArray];
    this.chartService.updateChart(
      this.arrayData, this.selectedAlgorithm, this.sortOrder,
    );

    this.sortCtx = {
      cancelled: false,
      paused: false,
      speedMultiplier: this.speedMultiplier,
      onStep: (arr, i, j) => this.onSortStep(arr, i, j),
    };

    this.startTime = performance.now();

    try {
      switch (this.selectedAlgorithm) {
        case 'selection':
          await this.sortService.selectionSort(
            this.arrayData, this.sortOrder, this.sortCtx,
          );
          break;
        case 'insertion':
          await this.sortService.insertionSort(
            this.arrayData, this.sortOrder, this.sortCtx,
          );
          break;
        case 'shell':
          await this.sortService.shellSort(
            this.arrayData, this.hValue, this.sortOrder, this.sortCtx,
          );
          break;
        case 'merge':
          await this.sortService.mergeSort(
            this.arrayData, this.sortOrder, this.sortCtx,
          );
          break;
      }

      if (!this.sortCtx.cancelled) {
        this.executionTime = performance.now() - this.startTime - this.totalPausedTime;
        this.chartService.updateChart(
          this.arrayData, this.selectedAlgorithm, this.sortOrder,
        );
      }
    } catch (error) {
      console.error('Error durante el ordenamiento:', error);
    } finally {
      this.isSorting = false;
      this.isPaused = false;
      this.sortCtx = null;
      cancelAnimationFrame(this.rafId);
      this.pendingStep = null;
      this.cdr.detectChanges();
    }
  }

  private onSortStep(arr: number[], i: number, j: number) {
    this.arrayData = arr;
    this.executionTime = performance.now() - this.startTime - this.totalPausedTime;

    if (this.speedMultiplier >= 5) {
      this.pendingStep = { arr, i, j };
      if (!this.rafId) {
        this.rafId = requestAnimationFrame(() => {
          this.rafId = 0;
          if (this.pendingStep) {
            this.chartService.updateChart(
              this.pendingStep.arr, this.selectedAlgorithm, this.sortOrder,
              this.pendingStep.i, this.pendingStep.j,
            );
            this.pendingStep = null;
          }
          this.cdr.detectChanges();
        });
      }
    } else {
      this.chartService.updateChart(
        arr, this.selectedAlgorithm, this.sortOrder, i, j,
      );
      this.cdr.detectChanges();
    }
  }

  togglePause() {
    if (!this.isSorting || !this.sortCtx) return;
    this.isPaused = !this.isPaused;
    this.sortCtx.paused = this.isPaused;
    if (this.isPaused) {
      this.totalPausedTime += performance.now() - this.startTime;
    }
  }

  private resumeSort() {
    if (!this.sortCtx) return;
    this.startTime = performance.now();
    this.isPaused = false;
    this.sortCtx.paused = false;
  }

  private cancelSort() {
    if (this.sortCtx) this.sortCtx.cancelled = true;
    this.isSorting = false;
    this.isPaused = false;
    this.sortCtx = null;
    cancelAnimationFrame(this.rafId);
    this.rafId = 0;
    this.pendingStep = null;
  }

  clearSort() {
    this.cancelSort();
    this.arrayData = [];
    this.originalArray = [];
    this.executionTime = 0;
    this.totalPausedTime = 0;
    this.chartService.updateChart([], this.selectedAlgorithm, this.sortOrder);
    this.cdr.detectChanges();
  }

  // --- File I/O ---

  async importFile(file: File) {
    try {
      const numbers = await this.fileService.importFromFile(file);
      this.arrayData = numbers;
      this.originalArray = [...numbers];
      this.arraySize = numbers.length;
      this.inputMode = 'manual';
      this.manualInput = numbers.join(', ');
      this.executionTime = 0;
      this.chartService.updateChart(
        this.arrayData, this.selectedAlgorithm, this.sortOrder,
      );
      this.cdr.detectChanges();
    } catch (error) {
      alert('Error al leer el archivo: ' + (error as Error).message);
    }
  }

  exportFile(format: 'json' | 'txt') {
    if (!this.arrayData.length) return;
    const name = prompt('Ingrese el nombre para el archivo (sin extensión):');
    if (!name) return;
    this.fileService.exportToFile(this.arrayData, format, name);
  }

  ngOnDestroy() {
    this.cancelSort();
    this.chartService.disposeChart();
  }
}
