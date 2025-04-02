import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class SortService {
  generarArray(tamanio: number, minValor: number, maxValor: number): number[] {
    return Array.from(
      { length: tamanio },
      () => Math.floor(Math.random() * (maxValor - minValor + 1)) + minValor,
    );
  }

  async selectionSort(
    arr: number[],
    order: 'asc' | 'desc' = 'asc',
    onCompare?: (arr: number[], index1: number, index2: number) => void,
  ): Promise<number[]> {
    const copiedArray = [...arr];
    const delay = this.getDelay(copiedArray.length);

    for (let i = 0; i < copiedArray.length; i++) {
      let min = i;
      for (let j = i; j < copiedArray.length; j++) {
        if (
          (order === 'asc' && copiedArray[j] < copiedArray[min]) ||
          (order === 'desc' && copiedArray[j] > copiedArray[min])
        ) {
          min = j;
        }
      }
      if (min !== i) {
        [copiedArray[i], copiedArray[min]] = [copiedArray[min], copiedArray[i]];
        onCompare?.(copiedArray, i, min);
        await this.sleep(delay);
      }
    }

    return copiedArray;
  }

  async insertionSort(
    arr: number[],
    order: 'asc' | 'desc' = 'asc',
    onCompare?: (arr: number[], index1: number, index2: number) => void,
  ): Promise<number[]> {
    const copiedArray = [...arr];
    const delay = this.getDelay(copiedArray.length);

    for (let i = 1; i < copiedArray.length; i++) {
      let j = i;
      while (
        j > 0 &&
        ((order === 'asc' && copiedArray[j] < copiedArray[j - 1]) ||
          (order === 'desc' && copiedArray[j] > copiedArray[j - 1]))
      ) {
        [copiedArray[j], copiedArray[j - 1]] = [
          copiedArray[j - 1],
          copiedArray[j],
        ];
        onCompare?.(copiedArray, j, j - 1);
        await this.sleep(delay);
        j--;
      }
    }

    return copiedArray;
  }

  async shellSort(
    arr: number[],
    h: number,
    order: 'asc' | 'desc' = 'asc',
    onCompare?: (arr: number[], index1: number, index2: number) => void,
  ): Promise<number[]> {
    const copiedArray = [...arr];
    const delay = this.getDelay(copiedArray.length);

    while (h > 0) {
      for (let i = h; i < copiedArray.length; i++) {
        const temp = copiedArray[i];
        let j = i;

        while (
          j >= h &&
          ((order === 'asc' && copiedArray[j - h] > temp) ||
            (order === 'desc' && copiedArray[j - h] < temp))
        ) {
          copiedArray[j] = copiedArray[j - h];
          onCompare?.(copiedArray, j, j - h);
          await this.sleep(delay);
          j -= h;
        }

        if (j !== i) {
          copiedArray[j] = temp;
          onCompare?.(copiedArray, j, i);
          await this.sleep(delay);
        }
      }

      h = Math.floor(h / 2);
    }

    return copiedArray;
  }

  async mergeSort(
    arr: number[],
    order: 'asc' | 'desc' = 'asc',
    onCompare?: (arr: number[], index1: number, index2: number) => void,
  ): Promise<number[]> {
    const copiedArray = [...arr];
    const delay = this.getDelay(copiedArray.length);

    const mergeSortRecursive = async (
      start: number,
      end: number,
    ): Promise<void> => {
      if (start >= end - 1) return;

      const mid = start + Math.floor((end - start) / 2);
      await mergeSortRecursive(start, mid);
      await mergeSortRecursive(mid, end);

      const cache = Array(end - start).fill(0);
      let k = mid;
      let r = 0;

      for (let i = start; i < mid; r++, i++) {
        while (
          k < end &&
          ((order === 'asc' && copiedArray[k] < copiedArray[i]) ||
            (order === 'desc' && copiedArray[k] > copiedArray[i]))
        ) {
          cache[r] = copiedArray[k];
          r++;
          k++;
        }
        cache[r] = copiedArray[i];
      }

      for (let i = 0; i < k - start; i++) {
        copiedArray[i + start] = cache[i];
        if (onCompare) {
          onCompare(copiedArray, i + start, i + start);
          await this.sleep(delay);
        }
      }
    };

    await mergeSortRecursive(0, copiedArray.length);
    return copiedArray;
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  private getDelay(arrayLength: number): number {
    const BASE_DELAY = 5000;
    return BASE_DELAY / arrayLength;
  }
}
