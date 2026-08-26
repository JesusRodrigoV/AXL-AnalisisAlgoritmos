export function distanciaPuntoALinea(
  x: number, y: number,
  x1: number, y1: number,
  x2: number, y2: number,
): number {
  return Math.abs((y2 - y1) * x - (x2 - x1) * y + x2 * y1 - y2 * x1) /
    Math.sqrt(Math.pow(y2 - y1, 2) + Math.pow(x2 - x1, 2));
}

export function puntoCercaDeLinea(
  x: number, y: number,
  x1: number, y1: number,
  x2: number, y2: number,
  tolerancia: number = 5,
): boolean {
  return distanciaPuntoALinea(x, y, x1, y1, x2, y2) < tolerancia;
}

export function puntoCercaDeCurva(
  x: number, y: number,
  x1: number, y1: number,
  cx: number, cy: number,
  x2: number, y2: number,
  tolerancia: number = 5,
): boolean {
  for (let t = 0; t <= 1; t += 0.05) {
    const px = (1 - t) * (1 - t) * x1 + 2 * (1 - t) * t * cx + t * t * x2;
    const py = (1 - t) * (1 - t) * y1 + 2 * (1 - t) * t * cy + t * t * y2;
    if (Math.sqrt((px - x) ** 2 + (py - y) ** 2) < tolerancia) {
      return true;
    }
  }
  return false;
}

export function puntoCercaDeBucle(
  x: number, y: number,
  nodoX: number, nodoY: number, nodoRadio: number,
  tolerancia: number = 25,
): boolean {
  const dx = x - nodoX;
  const dy = (y - (nodoY - nodoRadio)) * 2;
  return dx * dx + dy * dy <= nodoRadio * nodoRadio + tolerancia;
}

export function puntoEnNodo(
  x: number, y: number,
  nodoX: number, nodoY: number, nodoRadio: number,
): boolean {
  return Math.sqrt(Math.pow(x - nodoX, 2) + Math.pow(y - nodoY, 2)) < nodoRadio;
}

export function puntoEnNodoOMenos(
  x: number, y: number,
  nodoX: number, nodoY: number, nodoRadio: number,
): boolean {
  return Math.sqrt(Math.pow(x - nodoX, 2) + Math.pow(y - nodoY, 2)) <= nodoRadio;
}

export function calcularControlPuntos(
  startX: number, startY: number,
  endX: number, endY: number,
): { controlX: number; controlY: number } {
  return {
    controlX: (startX + endX) / 2 + (startY - endY) * 0.3,
    controlY: (startY + endY) / 2 + (endX - startX) * 0.3,
  };
}

export function calcularPuntoMedio(
  startX: number, startY: number,
  endX: number, endY: number,
  controlX: number, controlY: number,
  esBidireccional: boolean,
): { midX: number; midY: number } {
  if (esBidireccional) {
    return {
      midX: (startX + 2 * controlX + endX) / 4,
      midY: (startY + 2 * controlY + endY) / 4,
    };
  }
  return {
    midX: (startX + endX) / 2,
    midY: (startY + endY) / 2,
  };
}

export function clearCanvas(
  canvas: HTMLCanvasElement,
  colorFondo: string = '#ffffff',
): CanvasRenderingContext2D | null {
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = colorFondo;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  return ctx;
}

export function drawArrowhead(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  angle: number,
  length: number = 20,
  headAngle: number = Math.PI / 6,
  color: string = '#666',
): void {
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(
    x - length * Math.cos(angle - headAngle),
    y - length * Math.sin(angle - headAngle)
  );
  ctx.lineTo(
    x - length * Math.cos(angle + headAngle),
    y - length * Math.sin(angle + headAngle)
  );
  ctx.closePath();
  ctx.fillStyle = color;
  ctx.fill();
}
