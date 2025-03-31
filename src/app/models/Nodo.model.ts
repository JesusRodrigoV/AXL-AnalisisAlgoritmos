export class Nodo {
  private _x: number;
  private _y: number;
  private _radio: number;
  private _contador: number;
  private _selected: boolean;
  private _nombre: string;
  private _color: string;
  esOrigen?: boolean = false;

  constructor(
    x: number,
    y: number,
    radio: number,
    contador: number,
    selected: boolean,
    nombre: string,
    color: string = 'yellow',
  ) {
    this._x = x;
    this._y = y;
    this._radio = radio;
    this._contador = contador;
    this._selected = selected;
    this._nombre = nombre;
    this._color = color;
  }

  get x(): number {
    return this._x;
  }

  set x(value: number) {
    this._x = value;
  }

  get y(): number {
    return this._y;
  }

  set y(value: number) {
    this._y = value;
  }

  get radio(): number {
    return this._radio;
  }

  set radio(value: number) {
    this._radio = value;
  }

  get contador(): number {
    return this._contador;
  }

  set contador(value: number) {
    this._contador = value;
  }

  get selected(): boolean {
    return this._selected;
  }

  set selected(value: boolean) {
    this._selected = value;
  }

  get nombre(): string {
    return this._nombre;
  }

  set nombre(value: string) {
    this._nombre = value;
  }

  get color(): string {
    return this._color;
  }

  set color(value: string) {
    this._color = value;
  }
}
