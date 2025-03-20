
<<<<<<< HEAD
=======
export class Conexion {
  desde: number;
  hasta: number;
  peso: number | undefined;
  dirigido: boolean;
  color?: string;

  constructor(desde: number, hasta: number, peso?: number, dirigido: boolean = false) {
    this.desde = desde;
    this.hasta = hasta;
    this.peso = peso;
    this.dirigido = dirigido;
    this.color = '#666'; // Color por defecto
  }
}
>>>>>>> Snippet
