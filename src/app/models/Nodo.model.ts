export class Nodo {
	private _x: number;
	private _y: number;
	private _radio: number;
	private _contador: number;
	private _selected: boolean;

	constructor(
		x: number,
		y: number,
		radio: number,
		contador: number,
		selected: boolean,
	) {
		this._x = x;
		this._y = y;
		this._radio = radio;
		this._contador = contador;
		this._selected = selected;
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
}
