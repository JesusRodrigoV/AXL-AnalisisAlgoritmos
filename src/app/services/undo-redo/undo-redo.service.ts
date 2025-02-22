import { Injectable } from '@angular/core';
import { Conexion, Nodo } from '@app/models';

interface Estado {
  nodos: Nodo[];
  conexiones: Conexion[];
  contador: number;
}

@Injectable({
  providedIn: 'root',
})
export class UndoRedoService {
  private historial: Estado[] = [];
  private posicionActual: number = -1;
  private maxHistorial: number = 50; // Límite máximo de estados guardados

  constructor() {}

  // Guarda un nuevo estado en el historial
  guardarEstado(nodos: Nodo[], conexiones: Conexion[], contador: number): void {
    // Crear copias profundas de los arrays para evitar referencias
    const nuevoEstado: Estado = {
      nodos: JSON.parse(JSON.stringify(nodos)),
      conexiones: JSON.parse(JSON.stringify(conexiones)),
      contador: contador,
    };

    // Eliminar los estados que están después de la posición actual
    this.historial = this.historial.slice(0, this.posicionActual + 1);

    // Agregar el nuevo estado
    this.historial.push(nuevoEstado);
    this.posicionActual++;

    // Mantener el límite de historial
    if (this.historial.length > this.maxHistorial) {
      this.historial.shift();
      this.posicionActual--;
    }
  }

  // Retorna el estado anterior
  undo(): Estado | null {
    if (this.posicionActual > 0) {
      this.posicionActual--;
      return JSON.parse(JSON.stringify(this.historial[this.posicionActual]));
    }
    return null;
  }

  // Retorna el estado siguiente
  redo(): Estado | null {
    if (this.posicionActual < this.historial.length - 1) {
      this.posicionActual++;
      return JSON.parse(JSON.stringify(this.historial[this.posicionActual]));
    }
    return null;
  }

  // Verifica si hay estados para deshacer
  puedeUndo(): boolean {
    return this.posicionActual > 0;
  }

  // Verifica si hay estados para rehacer
  puedeRedo(): boolean {
    return this.posicionActual < this.historial.length - 1;
  }

  // Limpia el historial
  limpiarHistorial(): void {
    this.historial = [];
    this.posicionActual = -1;
  }
}
