import { Nodo } from './nodo.model.jonson';

export class Conexion {
  origen: Nodo;
  destino: Nodo;
  peso: number;
  holgura?: number; // Agrega esta propiedad
  rutaCritica?: boolean; // Agrega esta propiedad

  constructor(origen: Nodo, destino: Nodo, peso: number) {
    this.origen = origen;
    this.destino = destino;
    this.peso = peso;
  }
}