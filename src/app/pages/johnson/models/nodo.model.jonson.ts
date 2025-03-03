export class Nodo {
    id: string; // Identificador único del nodo
    x: number;  // Posición en el eje X
    y: number;  // Posición en el eje Y
    label: string; // Etiqueta del nodo
    tiempoInicio: number; // Tiempo de inicio (para el algoritmo de Johnson)
    tiempoFin: number; // Tiempo de fin (para el algoritmo de Johnson)
  
    constructor(id: string, x: number, y: number, label: string) {
      this.id = id;
      this.x = x;
      this.y = y;
      this.label = label;
      this.tiempoInicio = 0;
      this.tiempoFin = 0;
    }
  }