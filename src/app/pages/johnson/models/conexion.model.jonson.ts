import { Nodo } from './nodo.model.jonson';

export class Conexion {
  origen: Nodo;
  destino: Nodo;
  peso: number;

  constructor(origen: Nodo, destino: Nodo, peso: number) {
    this.origen = origen;
    this.destino = destino;
    this.peso = peso;
  }
}