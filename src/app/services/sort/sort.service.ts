import { Injectable } from '@angular/core';

export interface SortContext {
  cancelled: boolean;
  paused: boolean;
  speedMultiplier: number;
  onStep: (arr: number[], i: number, j: number) => void;
}

@Injectable({ providedIn: 'root' })
export class SortService {
  private static readonly BASE_DELAY = 3000;

  generarArray(tamanio: number, minValor: number, maxValor: number): number[] {
    return Array.from(
      { length: tamanio },
      () => Math.floor(Math.random() * (maxValor - minValor + 1)) + minValor,
    );
  }

  getDelay(arrayLength: number, speedMultiplier = 1): number {
    return Math.max(0, SortService.BASE_DELAY / arrayLength / speedMultiplier);
  }

  async selectionSort(
    arr: number[],
    order: 'asc' | 'desc',
    ctx: SortContext,
  ): Promise<number[]> {
    const copiedArray = [...arr];
    const n = copiedArray.length;

    for (let i = 0; i < n && !ctx.cancelled; i++) {
      let min = i;
      for (let j = i + 1; j < n && !ctx.cancelled; j++) {
        await this.waitForPause(ctx);
        if (ctx.cancelled) break;

        if (
          (order === 'asc' && copiedArray[j] < copiedArray[min]) ||
          (order === 'desc' && copiedArray[j] > copiedArray[min])
        ) {
          min = j;
        }
        ctx.onStep(copiedArray, i, j);
        await this.sleep(this.getDelay(n, ctx.speedMultiplier));
      }

      if (ctx.cancelled) break;
      if (min !== i) {
        [copiedArray[i], copiedArray[min]] = [copiedArray[min], copiedArray[i]];
        ctx.onStep(copiedArray, i, min);
        await this.sleep(this.getDelay(n, ctx.speedMultiplier));
      }
    }

    return copiedArray;
  }

  async insertionSort(
    arr: number[],
    order: 'asc' | 'desc',
    ctx: SortContext,
  ): Promise<number[]> {
    const copiedArray = [...arr];
    const n = copiedArray.length;

    for (let i = 1; i < n && !ctx.cancelled; i++) {
      let j = i;
      while (
        j > 0 &&
        !ctx.cancelled &&
        ((order === 'asc' && copiedArray[j] < copiedArray[j - 1]) ||
          (order === 'desc' && copiedArray[j] > copiedArray[j - 1]))
      ) {
        await this.waitForPause(ctx);
        if (ctx.cancelled) break;

        [copiedArray[j], copiedArray[j - 1]] = [copiedArray[j - 1], copiedArray[j]];
        ctx.onStep(copiedArray, j, j - 1);
        await this.sleep(this.getDelay(n, ctx.speedMultiplier));
        j--;
      }
    }

    return copiedArray;
  }

  async shellSort(
    arr: number[],
    h: number,
    order: 'asc' | 'desc',
    ctx: SortContext,
  ): Promise<number[]> {
    const copiedArray = [...arr];
    const n = copiedArray.length;

    while (h > 0 && !ctx.cancelled) {
      for (let i = h; i < n && !ctx.cancelled; i++) {
        const temp = copiedArray[i];
        let j = i;

        while (
          j >= h &&
          !ctx.cancelled &&
          ((order === 'asc' && copiedArray[j - h] > temp) ||
            (order === 'desc' && copiedArray[j - h] < temp))
        ) {
          await this.waitForPause(ctx);
          if (ctx.cancelled) break;

          copiedArray[j] = copiedArray[j - h];
          ctx.onStep(copiedArray, j, j - h);
          await this.sleep(this.getDelay(n, ctx.speedMultiplier));
          j -= h;
        }

        if (ctx.cancelled) break;
        if (j !== i) {
          copiedArray[j] = temp;
          ctx.onStep(copiedArray, j, i);
          await this.sleep(this.getDelay(n, ctx.speedMultiplier));
        }
      }

      h = Math.floor(h / 2);
    }

    return copiedArray;
  }

  async mergeSort(
    arr: number[],
    order: 'asc' | 'desc',
    ctx: SortContext,
  ): Promise<number[]> {
    const copiedArray = [...arr];
    const n = copiedArray.length;

    const mergeSortRecursive = async (start: number, end: number): Promise<void> => {
      if (start >= end - 1 || ctx.cancelled) return;

      const mid = start + Math.floor((end - start) / 2);
      await mergeSortRecursive(start, mid);
      await mergeSortRecursive(mid, end);

      const cache = Array(end - start).fill(0);
      let k = mid;
      let r = 0;

      for (let i = start; i < mid && !ctx.cancelled; r++, i++) {
        while (
          k < end &&
          ((order === 'asc' && copiedArray[k] < copiedArray[i]) ||
            (order === 'desc' && copiedArray[k] > copiedArray[i]))
        ) {
          await this.waitForPause(ctx);
          if (ctx.cancelled) break;

          cache[r] = copiedArray[k];
          r++;
          k++;
        }
        if (ctx.cancelled) break;
        cache[r] = copiedArray[i];
      }

      if (ctx.cancelled) return;

      for (let i = 0; i < k - start; i++) {
        await this.waitForPause(ctx);
        if (ctx.cancelled) break;

        copiedArray[i + start] = cache[i];
        ctx.onStep(copiedArray, i + start, i + start);
        await this.sleep(this.getDelay(n, ctx.speedMultiplier));
      }
    };

    await mergeSortRecursive(0, n);
    return copiedArray;
  }

  private async waitForPause(ctx: SortContext): Promise<void> {
    while (ctx.paused && !ctx.cancelled) {
      await this.sleep(100);
    }
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
