import { Injectable } from '@angular/core';
import * as echarts from 'echarts';

@Injectable({ providedIn: 'root' })
export class SortChartService {
  private chart: echarts.ECharts | null = null;
  private nativeElement: HTMLElement | null = null;
  private lastAlgorithm = '';
  private currentData: number[] = [];
  private baseOption: any = null;

  initChart(element: HTMLElement): void {
    this.nativeElement = element;
    if (!this.chart) {
      this.chart = echarts.init(element);
    }
  }

  private ensureChart(): echarts.ECharts | null {
    if (this.chart && !this.chart.isDisposed()) {
      return this.chart;
    }
    if (this.nativeElement) {
      this.chart = echarts.init(this.nativeElement);
      this.baseOption = null;
      return this.chart;
    }
    return null;
  }

  updateChart(
    data: number[],
    algorithm: string,
    sortOrder: 'asc' | 'desc',
    highlightIndex1?: number,
    highlightIndex2?: number,
  ): void {
    if (this.lastAlgorithm !== algorithm && this.chart && !this.chart.isDisposed()) {
      this.chart.dispose();
      this.chart = null;
      this.baseOption = null;
      this.lastAlgorithm = algorithm;
    }

    const chart = this.ensureChart();
    if (!chart) return;

    if (data.length === 0) {
      chart.setOption(this.buildEmptyOption(), true);
      this.baseOption = null;
      this.currentData = [];
      return;
    }

    const dataChanged = data !== this.currentData || data.length !== this.currentData.length;

    if (dataChanged || !this.baseOption) {
      this.currentData = data;
      this.baseOption = this.buildBaseOption(data, algorithm, sortOrder);
      chart.setOption(this.baseOption, true);
    }

    const seriesData = this.buildSeriesData(data, highlightIndex1, highlightIndex2);
    chart.setOption({ series: [{ data: seriesData }] });

    const title = this.buildTitle(algorithm, sortOrder);
    chart.setOption({ title: { text: title } });
  }

  disposeChart(): void {
    if (this.chart) {
      this.chart.dispose();
      this.chart = null;
    }
    this.nativeElement = null;
    this.baseOption = null;
    this.currentData = [];
  }

  private buildTitle(algorithm: string, sortOrder: 'asc' | 'desc'): string {
    const name = algorithm.charAt(0).toUpperCase() + algorithm.slice(1);
    const order = sortOrder === 'asc' ? 'Menor a Mayor' : 'Mayor a Menor';
    return `${name} Sort - ${order}`;
  }

  private buildSeriesData(
    data: number[],
    highlightIndex1?: number,
    highlightIndex2?: number,
  ) {
    return data.map((value, index) => ({
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
  }

  private buildEmptyOption() {
    return {
      animation: false,
      title: {
        text: 'Algoritmos de Ordenamiento',
        left: 'center',
        top: 10,
        textStyle: { fontSize: 16, fontWeight: 'bold' },
      },
      grid: {
        left: '3%', right: '4%', bottom: '8%', top: '15%',
        containLabel: true,
      },
      xAxis: {
        type: 'category', data: [], show: false,
        axisLine: { show: false }, axisTick: { show: false }, axisLabel: { show: false },
      },
      yAxis: {
        type: 'value', show: false,
        axisLine: { show: false }, axisTick: { show: false },
        axisLabel: { show: false }, splitLine: { show: false },
      },
      dataZoom: [],
      tooltip: { show: false },
      series: [{ data: [], type: 'bar', animation: false }],
    };
  }

  private buildBaseOption(
    data: number[],
    algorithm: string,
    sortOrder: 'asc' | 'desc',
  ) {
    return {
      animation: false,
      title: {
        text: this.buildTitle(algorithm, sortOrder),
        left: 'center',
        top: 10,
        textStyle: { fontSize: 16, fontWeight: 'bold' },
      },
      tooltip: {
        trigger: 'axis',
        formatter: (params: any) => {
          const dataIndex = params[0].dataIndex;
          return `Posición: ${dataIndex + 1}<br/>Valor: ${params[0].value}`;
        },
        axisPointer: { type: 'shadow' },
      },
      grid: {
        left: '3%', right: '4%', bottom: '8%', top: '15%',
        containLabel: true,
      },
      dataZoom: [
        {
          type: 'slider',
          show: data.length > 50,
          xAxisIndex: 0,
          start: 0, end: 100,
          height: 20, bottom: 0,
          borderColor: 'transparent',
        },
        { type: 'inside', xAxisIndex: 0, start: 0, end: 100 },
      ],
      xAxis: {
        type: 'category',
        data: data.map((_, i) => (i + 1).toString()),
        axisLabel: {
          interval: Math.floor(data.length / 50),
          rotate: data.length > 30 ? 45 : 0,
          hideOverlap: true, fontSize: 10,
        },
        axisTick: { alignWithLabel: true },
      },
      yAxis: {
        type: 'value',
        max: Math.max(...data) + 10,
        splitLine: { lineStyle: { type: 'dashed' } },
      },
      series: [
        {
          data: this.buildSeriesData(data),
          type: 'bar',
          animation: false,
          animationDuration: 0,
          animationEasing: 'linear',
        },
      ],
    };
  }
}
