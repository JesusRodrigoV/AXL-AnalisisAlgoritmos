import { Injectable } from '@angular/core';
import { Nodo } from '@app/models/Nodo.model';
import { Conexion } from '@app/models/Conexion.model';
import { drawArrowhead } from './graph-geometry';

export interface NodeColorResolver {
  (nodo: Nodo): string;
}

@Injectable({ providedIn: 'root' })
export class GraphRenderer {

  clearAndFill(
    ctx: CanvasRenderingContext2D,
    canvas: HTMLCanvasElement,
    colorFondo: string,
  ): void {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = colorFondo;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }

  drawConnections(
    ctx: CanvasRenderingContext2D,
    conexiones: Conexion[],
    nodos: Nodo[],
    style: 'curve' | 'offset' = 'curve',
  ): void {
    const nodoMap = new Map<number, Nodo>();
    nodos.forEach(n => nodoMap.set(n.contador, n));

    conexiones.forEach(conexion => {
      const desde = nodoMap.get(conexion.desde);
      const hasta = nodoMap.get(conexion.hasta);
      if (!desde || !hasta) return;

      if (conexion.desde === conexion.hasta) {
        this.drawLoop(ctx, desde, conexion);
        return;
      }

      const esBidireccional = conexiones.some(
        c => c.desde === conexion.hasta && c.hasta === conexion.desde
      );

      if (style === 'curve') {
        this.drawCurvedConnection(ctx, desde, hasta, conexion, esBidireccional);
      } else {
        this.drawOffsetConnection(ctx, desde, hasta, conexion, esBidireccional);
      }
    });
  }

  private drawCurvedConnection(
    ctx: CanvasRenderingContext2D,
    desde: Nodo,
    hasta: Nodo,
    conexion: Conexion,
    esBidireccional: boolean,
  ): void {
    const dx = hasta.x - desde.x;
    const dy = hasta.y - desde.y;
    const distancia = Math.sqrt(dx * dx + dy * dy);
    if (distancia === 0) return;

    const radio = 20;
    const offsetX = (dx / distancia) * radio;
    const offsetY = (dy / distancia) * radio;
    const startX = desde.x + offsetX;
    const startY = desde.y + offsetY;
    const endX = hasta.x - offsetX * 1.5;
    const endY = hasta.y - offsetY * 1.5;

    ctx.beginPath();
    let midX: number;
    let midY: number;

    if (esBidireccional) {
      const controlX = (startX + endX) / 2 + (startY - endY) * 0.3;
      const controlY = (startY + endY) / 2 + (endX - startX) * 0.3;
      ctx.moveTo(startX, startY);
      ctx.quadraticCurveTo(controlX, controlY, endX, endY);
      midX = (startX + 2 * controlX + endX) / 4;
      midY = (startY + 2 * controlY + endY) / 4;
    } else {
      midX = (startX + endX) / 2;
      midY = (startY + endY) / 2;
      ctx.moveTo(startX, startY);
      ctx.lineTo(endX, endY);
    }

    ctx.strokeStyle = conexion.color || '#666';
    ctx.lineWidth = 2;
    ctx.stroke();

    if (conexion.dirigido) {
      const angle = Math.atan2(dy, dx);
      drawArrowhead(ctx, endX, endY, angle, 10, Math.PI / 6, '#666');
    }

    this.drawWeightLabel(ctx, midX, midY, conexion.peso);
  }

  private drawOffsetConnection(
    ctx: CanvasRenderingContext2D,
    desde: Nodo,
    hasta: Nodo,
    conexion: Conexion,
    esBidireccional: boolean,
  ): void {
    const angle = Math.atan2(hasta.y - desde.y, hasta.x - desde.x);
    const offset = esBidireccional ? 10 : 0;
    const offsetX = offset * Math.cos(angle + Math.PI / 2);
    const offsetY = offset * Math.sin(angle + Math.PI / 2);

    const startX = desde.x + offsetX;
    const startY = desde.y + offsetY;
    const endX = hasta.x + offsetX;
    const endY = hasta.y + offsetY;

    ctx.beginPath();
    ctx.moveTo(startX, startY);
    ctx.lineTo(endX, endY);
    ctx.strokeStyle = conexion.color || '#666';
    ctx.lineWidth = 2;
    ctx.stroke();

    if (conexion.dirigido) {
      const distanciaFlecha = hasta.radio + 2;
      const arrowX = endX - distanciaFlecha * Math.cos(angle);
      const arrowY = endY - distanciaFlecha * Math.sin(angle);
      drawArrowhead(ctx, arrowX, arrowY, angle, 20, Math.PI / 6, conexion.color || '#666');
    }

    const midX = (startX + endX) / 2 + offsetY * 0.6;
    const midY = (startY + endY) / 2 - offsetX * 0.6;
    this.drawWeightLabel(ctx, midX, midY, conexion.peso);
  }

  private drawLoop(
    ctx: CanvasRenderingContext2D,
    nodo: Nodo,
    conexion: Conexion,
  ): void {
    const radio = nodo.radio;
    const centerX = nodo.x;
    const centerY = nodo.y;

    ctx.beginPath();
    ctx.save();
    ctx.translate(centerX, centerY - radio);
    ctx.scale(1, 0.5);
    ctx.arc(0, 0, radio, 0, Math.PI * 2);
    ctx.restore();
    ctx.strokeStyle = '#666';
    ctx.lineWidth = 2;
    ctx.stroke();

    if (conexion.dirigido) {
      const angle = Math.PI / 6;
      const arrowX = centerX + radio * Math.cos(angle);
      const arrowY = centerY - radio - radio * Math.sin(angle) * 0.5;
      const tangentAngle = Math.PI / 2 - angle;
      const headLen = 10;
      ctx.beginPath();
      ctx.moveTo(arrowX, arrowY);
      ctx.lineTo(
        arrowX - headLen * Math.cos(tangentAngle - Math.PI / 6),
        arrowY + headLen * Math.sin(tangentAngle - Math.PI / 6),
      );
      ctx.moveTo(arrowX, arrowY);
      ctx.lineTo(
        arrowX - headLen * Math.cos(tangentAngle + Math.PI / 6),
        arrowY + headLen * Math.sin(tangentAngle + Math.PI / 6),
      );
      ctx.strokeStyle = '#666';
      ctx.lineWidth = 2;
      ctx.stroke();
    }

    const pesoX = centerX;
    const pesoY = centerY - radio * 2;
    this.drawWeightLabel(ctx, pesoX, pesoY, conexion.peso);
  }

  drawNodes(
    ctx: CanvasRenderingContext2D,
    nodos: Nodo[],
    resolveColor: NodeColorResolver,
    font: string = '20px Source Sans Pro,Arial,sans-serif',
  ): void {
    nodos.forEach(nodo => {
      ctx.beginPath();
      ctx.arc(nodo.x, nodo.y, nodo.radio, 0, Math.PI * 2);
      ctx.fillStyle = resolveColor(nodo);
      ctx.fill();
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.font = font;
      ctx.fillStyle = 'black';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(
        nodo.nombre || nodo.contador.toString(),
        nodo.x,
        nodo.y,
      );
    });
  }

  private drawWeightLabel(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    peso: number,
  ): void {
    const label = (peso ?? 0).toString();
    ctx.fillStyle = 'white';
    ctx.fillRect(x - 10, y - 10, 20, 20);
    ctx.font = '12px Arial';
    ctx.fillStyle = 'black';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(label, x, y);
  }
}
