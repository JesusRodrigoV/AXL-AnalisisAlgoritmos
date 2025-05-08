export class Conexion {
  private _desde: number;
  private _hasta: number;
  private _peso: number;
  private _dirigido: boolean;
  private _color: string;

  constructor(desde: number, hasta: number, peso: number, dirigido: boolean) {
    this._desde = desde;
    this._hasta = hasta;
    this._peso = peso;
    this._dirigido = dirigido;
    this._color = '#666';
  }

  // Método para serialización
  toJSON() {
    return {
      desde: this._desde,
      hasta: this._hasta,
      peso: this._peso,
      dirigido: this._dirigido,
      color: this._color,
    };
  }

  // Método estático para deserialización
  static fromJSON(json: any): Conexion {
    const desde = json._desde || json.desde;
    const hasta = json._hasta || json.hasta;
    const peso = json._peso || json.peso;
    const dirigido = json._dirigido ?? json.dirigido ?? false; // Usar operador nullish para manejar false explícito

    const conexion = new Conexion(desde, hasta, peso, dirigido);
    conexion._dirigido = dirigido; // Asegurar que se mantiene el valor correcto

    if (json._color || json.color) {
      conexion._color = json._color || json.color;
    }
    return conexion;
  }

  get desde(): number {
    return this._desde;
  }

  set desde(value: number) {
    this._desde = value;
  }

  get hasta(): number {
    return this._hasta;
  }

  set hasta(value: number) {
    this._hasta = value;
  }

  get peso(): number {
    return this._peso;
  }

  set peso(value: number) {
    this._peso = value;
  }

  get dirigido(): boolean {
    return this._dirigido;
  }

  set dirigido(value: boolean) {
    this._dirigido = value;
  }
  
  get color(): string {
    return this._color;
  }
  
  set color(value: string) {
    this._color = value;
  }
  
}
