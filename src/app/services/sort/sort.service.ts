import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class SortService {
  generateArray(size: number, minValue: number, maxValue: number): number[] {
    return Array.from(
      { length: size },
      () => Math.floor(Math.random() * (maxValue - minValue + 1)) + minValue,
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

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
