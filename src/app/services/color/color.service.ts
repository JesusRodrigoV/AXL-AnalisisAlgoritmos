import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class ColorService {
  private defaultBackgroundColor: string = '#ffffff';
  private defaultNodeColor: string = '#ffff00';

  cambiarColorFondo(
    canvas: HTMLCanvasElement,
    currentColor: string,
    onColorChange: (color: string) => void,
  ): void {
    const colorInput = document.createElement('input');
    colorInput.type = 'color';
    colorInput.value = currentColor || this.defaultBackgroundColor;

    document.body.appendChild(colorInput);

    colorInput.addEventListener('change', (event) => {
      const newColor = (event.target as HTMLInputElement).value;
      const ctx = canvas.getContext('2d');

      if (ctx) {
        ctx.fillStyle = newColor;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }

      onColorChange(newColor);
      document.body.removeChild(colorInput);
    });

    colorInput.click();
  }

  cambiarColorNodo(nodo: any, onColorChange: () => void): void {
    const colorInput = document.createElement('input');
    colorInput.type = 'color';
    colorInput.value = nodo.color || this.defaultNodeColor;

    colorInput.addEventListener('change', (event) => {
      nodo.color = (event.target as HTMLInputElement).value;
      onColorChange();
    });

    colorInput.click();
  }
}
