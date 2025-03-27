import {
  Component,
  OnDestroy,
  ElementRef,
  ViewChild,
  AfterViewInit,
  Inject,
  PLATFORM_ID,
} from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatCardModule } from '@angular/material/card';
import * as echarts from 'echarts';
import { SortService } from '../../../../services/sort/sort.service';

@Component({
  selector: 'app-merge-sort',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatSelectModule,
    MatCardModule,
  ],
  templateUrl: './merge-sort.component.html',
  styleUrls: ['./merge-sort.component.scss'],
})
export class MergeSortComponent implements AfterViewInit, OnDestroy {
  @ViewChild('chartContainer') chartContainer!: ElementRef;

  arraySize: number = 10;
  minValue: number = 1;
  maxValue: number = 100;
  array: number[] = [];
  isSorting = false;
  sortingOrder: 'asc' | 'desc' = 'asc';
  private chart: echarts.ECharts | null = null;

  constructor(
    private sortService: SortService,
    @Inject(PLATFORM_ID) private platformId: Object,
  ) {}

  ngAfterViewInit(): void {
    if (
      isPlatformBrowser(this.platformId) &&
      this.chartContainer &&
      this.chartContainer.nativeElement
    ) {
      this.chart = echarts.init(this.chartContainer.nativeElement);
    }
  }

  ngOnDestroy(): void {
    this.isSorting = false;
    if (this.chart) {
      this.chart.dispose();
    }
  }

  private initChart(): void {
    if (this.chart && this.array.length > 0) {
      this.updateChart();
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

  generateArray(): void {
    if (!this.validateInputs()) return;

    this.array = this.sortService.generarArray(
      this.arraySize,
      this.minValue,
      this.maxValue,
    );
    if (this.chart) {
      this.updateChart();
    }
  }

  async startSort(): Promise<void> {
    if (this.isSorting) return;
    this.isSorting = true;

    try {
      await this.sortService.mergeSort(
        this.array,
        this.sortingOrder,
        (arr: number[], i: number, j: number) => {
          this.array = [...arr];
          this.updateChart(i, j);
        },
      );
    } finally {
      this.isSorting = false;
      this.updateChart();
    }
  }

  private updateChart(
    highlightIndex1?: number,
    highlightIndex2?: number,
  ): void {
    if (!this.chart) return;

    const data = this.array.map((value, index) => ({
      value,
      itemStyle: {
        color:
          index === highlightIndex1
            ? '#ff4444'
            : index === highlightIndex2
              ? '#ffbb00'
              : '#3398db',
      },
    }));

    const option = {
      animation: false,
      title: {
        text: `Merge Sort - ${
          this.sortingOrder === 'asc' ? 'Menor a Mayor' : 'Mayor a Menor'
        }`,
        left: 'center',
      },
      xAxis: {
        type: 'category',
        data: this.array.map((_, index) => (index + 1).toString()),
        axisLabel: {
          interval: 0,
        },
      },
      yAxis: {
        type: 'value',
        max: Math.max(...this.array) + 10,
      },
      series: [
        {
          type: 'bar',
          data,
          animation: false,
          animationDuration: 0,
          animationEasing: 'linear',
        },
      ],
      tooltip: {
        trigger: 'item',
        formatter: '{c}',
      },
    };

    this.chart.setOption(option);
  }
}
