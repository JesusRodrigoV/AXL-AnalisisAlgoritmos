import { NgIf, isPlatformBrowser } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  PLATFORM_ID,
  Inject,
  ChangeDetectorRef,
  inject,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatOptionModule } from '@angular/material/core';
import { MatDividerModule } from '@angular/material/divider';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { SortService } from '@app/services/sort';
import * as d3 from 'd3';

@Component({
  selector: 'app-sort',
  imports: [
    FormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatCardModule,
    MatDividerModule,
    MatOptionModule,
    MatSelectModule,
    NgIf,
    MatIconModule,
  ],
  standalone: true,
  templateUrl: './sort.component.html',
  styleUrl: './sort.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class SortComponent {
  array: number[] = [];
  sortedArray: number[] = [];
  sorting = false;
  sortTime = 0;
  arraySize = 10;
  minValue = 1;
  maxValue = 100;
  order: 'asc' | 'desc' = 'asc';
  private isBrowser: boolean;
  private chart!: d3.Selection<SVGSVGElement, unknown, HTMLElement, any>;
  private readonly margin = { top: 40, right: 40, bottom: 40, left: 40 };
  private sortService = inject(SortService);
  private cdr: ChangeDetectorRef = inject(ChangeDetectorRef);
  constructor(@Inject(PLATFORM_ID) private platformId: Object) {
    this.isBrowser = isPlatformBrowser(this.platformId);
  }

  private generateInitialArray(): number[] {
    return this.sortService.generateArray(
      this.arraySize,
      this.minValue,
      this.maxValue,
    );
  }
  generateArray(): void {
    this.array = this.sortService.generateArray(
      this.arraySize,
      this.minValue,
      this.maxValue,
    );
    this.sortedArray = [...this.array];
    if (this.isBrowser) {
      this.renderChart(this.array);
    }
  }

  async sortArray(): Promise<void> {
    if (!this.isBrowser) return;

    this.sorting = true;
    const startTime = performance.now();

    this.sortedArray = await this.sortService.selectionSort(
      [...this.sortedArray],
      this.order,
      (arr, index1, index2) => {
        this.sortedArray = [...arr];
        this.renderChart(this.sortedArray, index1, index2);
        this.cdr.detectChanges();
      },
    );

    this.sortTime = (performance.now() - startTime) / 1000;
    this.sorting = false;
    this.cdr.detectChanges();
  }

  sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
  renderChart(
    arr: number[],
    comparingIndex1?: number,
    comparingIndex2?: number,
  ): void {
    if (!this.isBrowser) return;

    try {
      const container = document.querySelector('.visualization-container');
      if (!container) return;

      const width = 1400; // Ancho fijo
      const height = 400; // Altura fija
      const chartWidth = width - this.margin.left - this.margin.right;
      const chartHeight = height - this.margin.top - this.margin.bottom;

      if (!this.chart || this.chart.empty()) {
        this.chart = d3
          .select('.visualization-container')
          .append('svg')
          .attr('width', width)
          .attr('height', height)
          .attr('viewBox', `0 0 ${width} ${height}`);
      }

      // Limpiar elementos previos
      this.chart.selectAll('*').remove();

      // Crear grupo principal
      const g = this.chart
        .append('g')
        .attr('transform', `translate(${this.margin.left},${this.margin.top})`);

      // Escalas
      const xScale = d3
        .scaleBand()
        .domain(arr.map((_, i) => i.toString()))
        .range([0, chartWidth])
        .padding(0.1);

      const yScale = d3
        .scaleLinear()
        .domain([0, this.maxValue]) // Usar el máximo valor del usuario
        .range([chartHeight, 0]);

      // Eje Y
      const yAxis = d3.axisLeft(yScale).ticks(5).tickFormat(d3.format('d'));

      g.append('g').call(yAxis).attr('class', 'y-axis');

      // Dibujar barras
      g.selectAll('rect')
        .data(arr)
        .enter()
        .append('rect')
        .attr('x', (_, i) => xScale(i.toString())!)
        .attr('y', (d) => yScale(d))
        .attr('width', xScale.bandwidth())
        .attr('height', (d) => chartHeight - yScale(d))
        .attr('fill', (_, i) =>
          i === comparingIndex1 || i === comparingIndex2
            ? '#ff4081'
            : '#673ab7',
        )
        .attr('rx', 3)
        .attr('ry', 3);

      // Agregar etiquetas con los valores debajo de las barras
      g.selectAll('.bar-label')
        .data(arr)
        .enter()
        .append('text')
        .attr('class', 'bar-label')
        .attr('x', (_, i) => xScale(i.toString())! + xScale.bandwidth() / 2)
        .attr('y', chartHeight + 20) // 20px debajo del eje X
        .attr('text-anchor', 'middle')
        .attr('font-size', '12px')
        .attr('fill', '#333')
        .text((d) => d);
    } catch (error) {
      console.error('Error rendering chart:', error);
    }
  }
}
