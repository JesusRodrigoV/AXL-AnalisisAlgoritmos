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

    for (let i = 0; i < copiedArray.length - 1; i++) {
      let extremeIndex = i;
      for (let j = i + 1; j < copiedArray.length; j++) {
        if (
          (order === 'asc' && copiedArray[j] < copiedArray[extremeIndex]) ||
          (order === 'desc' && copiedArray[j] > copiedArray[extremeIndex])
        ) {
          extremeIndex = j;
        }
        onCompare?.(copiedArray, i, j);
        await this.sleep(100);
      }
      [copiedArray[i], copiedArray[extremeIndex]] = [
        copiedArray[extremeIndex],
        copiedArray[i],
      ];
      onCompare?.(copiedArray, i, extremeIndex);
      await this.sleep(100);
    }

    return copiedArray;
  }

  async insertionSort(
    arr: number[],
    order: 'asc' | 'desc' = 'asc',
    onCompare?: (arr: number[], index1: number, index2: number) => void,
  ): Promise<number[]> {
    const copiedArray = [...arr];

    for (let i = 1; i < copiedArray.length; i++) {
      const current = copiedArray[i];
      let j = i - 1;

      while (
        j >= 0 &&
        ((order === 'asc' && copiedArray[j] > current) ||
          (order === 'desc' && copiedArray[j] < current))
      ) {
        copiedArray[j + 1] = copiedArray[j];
        onCompare?.(copiedArray, j, i);
        await this.sleep(100);
        j--;
      }

      copiedArray[j + 1] = current;
      onCompare?.(copiedArray, j + 1, i);
      await this.sleep(100);
    }

    return copiedArray;
  }

  async shellSort(
    arr: number[],
    h: number, // Se ingresa manualmente
    order: 'asc' | 'desc' = 'asc',
    onCompare?: (arr: number[], index1: number, index2: number) => void,
  ): Promise<number[]> {
    const copiedArray = [...arr];

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
          await this.sleep(100);
          j -= h;
        }

        copiedArray[j] = temp;
        onCompare?.(copiedArray, i, j);
        await this.sleep(100);
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
    const tempArray = new Array(copiedArray.length);

    const mergeSortRecursive = async (
      start: number,
      end: number,
    ): Promise<void> => {
      if (start >= end) return;

      const mid = Math.floor((start + end) / 2);

      await mergeSortRecursive(start, mid);
      await mergeSortRecursive(mid + 1, end);
      await merge(start, mid, end);
    };

    const merge = async (
      start: number,
      mid: number,
      end: number,
    ): Promise<void> => {
      let left = start;
      let right = mid + 1;
      let tempIndex = start;

      // Copiar al array temporal para preservar los elementos originales
      for (let i = start; i <= end; i++) {
        tempArray[i] = copiedArray[i];
      }

      while (left <= mid && right <= end) {
        const compareCondition =
          order === 'asc'
            ? tempArray[left] <= tempArray[right]
            : tempArray[left] >= tempArray[right];

        if (compareCondition) {
          copiedArray[tempIndex] = tempArray[left];
          left++;
        } else {
          copiedArray[tempIndex] = tempArray[right];
          right++;
        }

        // Visualizar la comparación actual
        if (onCompare) {
          onCompare(copiedArray, left, right);
          await this.sleep(100);
        }

        // Visualizar el cambio después de la comparación
        if (onCompare) {
          onCompare(copiedArray, tempIndex, compareCondition ? left : right);
          await this.sleep(100);
        }

        tempIndex++;
      }

      // Copiar los elementos restantes del lado izquierdo
      while (left <= mid) {
        copiedArray[tempIndex] = tempArray[left];
        if (onCompare) {
          onCompare(copiedArray, left, tempIndex);
          await this.sleep(100);
        }
        left++;
        tempIndex++;
      }
    };

    await mergeSortRecursive(0, copiedArray.length - 1);
    return copiedArray;
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
