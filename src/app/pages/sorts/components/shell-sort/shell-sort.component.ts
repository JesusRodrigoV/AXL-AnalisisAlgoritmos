import {
  Component,
  ViewChild,
  ElementRef,
  OnInit,
  AfterViewInit,
  OnDestroy,
  Inject,
  PLATFORM_ID,
} from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import * as echarts from 'echarts';
import { SortService } from '@app/services/sort/sort.service';

@Component({
  selector: 'app-shell-sort',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
  ],
  templateUrl: './shell-sort.component.html',
  styleUrls: ['./shell-sort.component.scss'],
})
export class ShellSortComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('chartContainer') chartContainer!: ElementRef;

  array: number[] = [];
  arraySize: number = 20;
  minValue: number = 1;
  maxValue: number = 100;
  hValue: number = 10; // Valor inicial de h
  sortOrder: 'asc' | 'desc' = 'asc';
  sorting: boolean = false;
  private chart: echarts.ECharts | null = null;

  constructor(
    private sortService: SortService,
    @Inject(PLATFORM_ID) private platformId: Object,
  ) {}

  ngOnInit(): void {}

  ngAfterViewInit(): void {
    this.initChart();
  }

  private initChart(): void {
    if (
      isPlatformBrowser(this.platformId) &&
      this.chartContainer?.nativeElement
    ) {
      if (this.chart) {
        this.chart.dispose();
      }
      this.chart = echarts.init(this.chartContainer.nativeElement);
      // Ajustar el tamaño del gráfico cuando la ventana cambie de tamaño
      window.addEventListener('resize', () => {
        this.chart?.resize();
      });
    }
  }

  ngOnDestroy(): void {
    if (this.chart) {
      this.chart.dispose();
    }
  }

  generateArray(): void {
    if (!this.chart) {
      this.initChart();
    }

    this.array = this.sortService.generarArray(
      this.arraySize,
      this.minValue,
      this.maxValue,
    );
    // Ajustar h si es necesario
    if (this.hValue > this.arraySize) {
      this.hValue = Math.floor(this.arraySize / 2);
    }
    this.updateChart();
  }

  isValidHValue(): boolean {
    return this.hValue > 0 && this.hValue <= this.arraySize;
  }

  async sort(): Promise<void> {
    if (!this.array.length || this.sorting || !this.isValidHValue()) return;

    this.sorting = true;
    try {
      await this.sortService.shellSort(
        this.array,
        this.hValue,
        this.sortOrder,
        (arr: number[], i: number, j: number) => {
          this.array = [...arr];
          this.updateChart(i, j);
        },
      );
    } finally {
      this.sorting = false;
      this.updateChart();
    }
  }

  private updateChart(
    highlightIndex1: number = -1,
    highlightIndex2: number = -1,
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
        text: `Shell Sort - ${
          this.sortOrder === 'asc' ? 'Menor a mayor' : 'Mayor a menor'
        }`,
        left: 'center',
      },
      tooltip: {
        trigger: 'item',
        formatter: '{c}',
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
    };

    this.chart.setOption(option);
  }
}
