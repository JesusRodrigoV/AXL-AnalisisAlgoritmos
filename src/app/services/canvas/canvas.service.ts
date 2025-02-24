import { Injectable } from '@angular/core';
import { Conexion, Nodo } from '@app/models';

@Injectable({
  providedIn: 'root',
})
export class CanvasService {
  private radio: number = 30;

  dibujarNodo(
    ctx: CanvasRenderingContext2D,
    nodos: Nodo[],
    conexiones: Conexion[],
    colorFondo: string,
  ): void {
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    ctx.fillStyle = colorFondo;
    ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);

    // Dibujar conexiones
    conexiones.forEach((conexion) => {
      const desde = nodos.find((c) => c.contador === conexion.desde);
      const hasta = nodos.find((c) => c.contador === conexion.hasta);
      if (desde && hasta) {
        if (conexion.desde === conexion.hasta) {
          this.dibujarBucle(ctx, desde, conexion, colorFondo);
        } else {
          this.dibujarConexion(ctx, desde, hasta, conexion, colorFondo);
        }
      }
    });

    // Dibujar nodos
    nodos.forEach((circulo) => {
      ctx.beginPath();
      ctx.arc(circulo.x, circulo.y, circulo.radio, 0, Math.PI * 2);
      ctx.fillStyle = circulo.selected ? '#ff9800' : circulo.color;
      ctx.fill();
      ctx.stroke();
      ctx.font = '20px Source Sans Pro,Arial,sans-serif';
      ctx.fillStyle = 'black';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(
        circulo.nombre || circulo.contador.toString(),
        circulo.x,
        circulo.y,
      );
    });
  }

  private dibujarConexion(
    ctx: CanvasRenderingContext2D,
    desde: Nodo,
    hasta: Nodo,
    conexion: Conexion,
    colorFondo: string,
  ): void {
    ctx.beginPath();
    const bidireccional = this.esBidireccional(desde, hasta, conexion);
    let midX, midY, controlX, controlY;

    if (bidireccional) {
      controlX = (desde.x + hasta.x) / 2 + (desde.y - hasta.y) * 0.3;
      controlY = (desde.y + hasta.y) / 2 + (hasta.x - desde.x) * 0.3;
      ctx.moveTo(desde.x, desde.y);
      ctx.quadraticCurveTo(controlX, controlY, hasta.x, hasta.y);
      midX = (desde.x + 2 * controlX + hasta.x) / 4;
      midY = (desde.y + 2 * controlY + hasta.y) / 4;
    } else {
      controlX = (desde.x + hasta.x) / 2;
      controlY = (desde.y + hasta.y) / 2;
      ctx.moveTo(desde.x, desde.y);
      ctx.lineTo(hasta.x, hasta.y);
      midX = controlX;
      midY = controlY;
    }

    ctx.strokeStyle = '#666';
    ctx.lineWidth = 2;
    ctx.stroke();

    if (conexion.dirigido) {
      this.dibujarFlechaCurva(
        ctx,
        desde.x,
        desde.y,
        hasta.x,
        hasta.y,
        controlX,
        controlY,
      );
    }

    this.dibujarPeso(ctx, midX, midY, conexion.peso ?? 0, colorFondo);
  }

  private dibujarBucle(
    ctx: CanvasRenderingContext2D,
    nodo: Nodo,
    conexion: Conexion,
    colorFondo: string,
  ): void {
    const radio = nodo.radio;
    const centerX = nodo.x;
    const centerY = nodo.y;

    // Dibujar óvalo
    ctx.beginPath();
    ctx.save();
    ctx.translate(centerX, centerY - radio);
    ctx.scale(1, 0.5);
    ctx.arc(0, 0, radio, 0, Math.PI * 2);
    ctx.restore();
    ctx.strokeStyle = '#666';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Dibujar flecha si es dirigido
    if (conexion.dirigido) {
      const angle = Math.PI / 6;
      const arrowX = centerX + radio * Math.cos(angle);
      const arrowY = centerY - radio - radio * Math.sin(angle) * 0.5;
      const tangentAngle = Math.PI / 2 - angle;
      this.dibujarPuntaFlecha(ctx, arrowX, arrowY, tangentAngle);
    }

    // Dibujar peso
    const pesoX = centerX;
    const pesoY = centerY - radio * 2;
    this.dibujarPeso(ctx, pesoX, pesoY, conexion.peso ?? 0, colorFondo);
  }

  private dibujarFlechaCurva(
    ctx: CanvasRenderingContext2D,
    fromX: number,
    fromY: number,
    toX: number,
    toY: number,
    ctrlX: number,
    ctrlY: number,
  ): void {
    const t = 0.9;
    const x = (1 - t) * (1 - t) * fromX + 2 * (1 - t) * t * ctrlX + t * t * toX;
    const y = (1 - t) * (1 - t) * fromY + 2 * (1 - t) * t * ctrlY + t * t * toY;
    const angle = Math.atan2(toY - y, toX - x);
    this.dibujarPuntaFlecha(ctx, x, y, angle);
  }

  private dibujarPuntaFlecha(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    angle: number,
  ): void {
    const headLen = 10;
    ctx.beginPath();
    ctx.moveTo(
      x - headLen * Math.cos(angle - Math.PI / 6),
      y - headLen * Math.sin(angle - Math.PI / 6),
    );
    ctx.lineTo(x, y);
    ctx.lineTo(
      x - headLen * Math.cos(angle + Math.PI / 6),
      y - headLen * Math.sin(angle + Math.PI / 6),
    );
    ctx.strokeStyle = '#666';
    ctx.lineWidth = 2;
    ctx.stroke();
  }

  private dibujarPeso(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    peso: number,
    colorFondo: string,
  ): void {
    ctx.fillStyle = colorFondo;
    ctx.fillRect(x - 10, y - 10, 20, 20);
    ctx.font = '12px Arial';
    ctx.fillStyle = 'black';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(peso.toString(), x, y);
  }

  private esBidireccional(
    desde: Nodo,
    hasta: Nodo,
    conexion: Conexion,
    conexiones: Conexion[],
  ): boolean {
    return conexiones.some(
      (c) => c.desde === conexion.hasta && c.hasta === conexion.desde,
    );
  }

  estaCercaDeConexion(
    x: number,
    y: number,
    x1: number,
    y1: number,
    x2: number,
    y2: number,
    conexion: { desde: number; hasta: number },
  ): boolean {
    if (conexion.desde === conexion.hasta) {
      return this.estaCercaDeBucle(x, y, x1, y1, this.radio);
    }

    const bidireccional = this.esBidireccional(
      { x: x1, y: y1 } as Nodo,
      { x: x2, y: y2 } as Nodo,
      conexion,
      this.conexiones,
    );
    if (bidireccional) {
      const controlX = (x1 + x2) / 2 + (y1 - y2) * 0.3;
      const controlY = (y1 + y2) / 2 + (x2 - x1) * 0.3;
      return this.estaCercaDeCurva(x, y, x1, y1, controlX, controlY, x2, y2);
    }
    return this.estaCercaDeLinea(x, y, x1, y1, x2, y2);
  }

  private estaCercaDeBucle(
    x: number,
    y: number,
    nodoX: number,
    nodoY: number,
    radio: number,
  ): boolean {
    const pesoX = nodoX;
    const pesoY = nodoY - radio * 2;
    const distanciaPeso = Math.sqrt(
      Math.pow(x - pesoX, 2) + Math.pow(y - pesoY, 2),
    );
    if (distanciaPeso <= 10) {
      return true;
    }

    const dx = x - nodoX;
    const dy = (y - (nodoY - radio)) * 2;
    return dx * dx + dy * dy <= radio * radio + 25;
  }

  private estaCercaDeLinea(
    x: number,
    y: number,
    x1: number,
    y1: number,
    x2: number,
    y2: number,
  ): boolean {
    const distancia =
      Math.abs((y2 - y1) * x - (x2 - x1) * y + x2 * y1 - y2 * x1) /
      Math.sqrt(Math.pow(y2 - y1, 2) + Math.pow(x2 - x1, 2));
    return distancia < 5;
  }

  private estaCercaDeCurva(
    x: number,
    y: number,
    x1: number,
    y1: number,
    cx: number,
    cy: number,
    x2: number,
    y2: number,
  ): boolean {
    for (let t = 0; t <= 1; t += 0.05) {
      const px = (1 - t) * (1 - t) * x1 + 2 * (1 - t) * t * cx + t * t * x2;
      const py = (1 - t) * (1 - t) * y1 + 2 * (1 - t) * t * cy + t * t * y2;
      if (Math.sqrt((px - x) ** 2 + (py - y) ** 2) < 5) {
        return true;
      }
    }
    return false;
  }
}
