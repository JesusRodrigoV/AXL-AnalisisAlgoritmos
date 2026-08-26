import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class ArrayFileService {
  async importFromFile(file: File): Promise<number[]> {
    const ext = file.name.split('.').pop()?.toLowerCase();
    const content = await file.text();

    if (ext === 'json') {
      const data = JSON.parse(content);
      if (!Array.isArray(data)) {
        throw new Error('El archivo JSON debe contener un array');
      }
      const numbers = data.map(Number);
      if (numbers.some(isNaN)) {
        throw new Error('El archivo contiene valores no numéricos');
      }
      return numbers;
    }

    if (ext === 'txt') {
      const numbers = content
        .split(/[,\n]/)
        .map((s) => s.trim())
        .filter(Boolean)
        .map(Number);
      if (numbers.some(isNaN)) {
        throw new Error('El archivo contiene valores no numéricos');
      }
      return numbers;
    }

    throw new Error('Formato no soportado. Use JSON o TXT');
  }

  exportToFile(data: number[], format: 'json' | 'txt', filename: string): void {
    let content: string;
    let mimeType: string;
    const name = filename || 'array';

    if (format === 'json') {
      content = JSON.stringify(data, null, 2);
      mimeType = 'application/json';
    } else {
      content = data.join(',');
      mimeType = 'text/plain';
    }

    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${name}.${format}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
}
