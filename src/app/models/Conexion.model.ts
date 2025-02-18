export class Conexion {
	private _desde: number;
	private _hasta: number;
	private _peso: number;
	private _dirigido: boolean;

	constructor(desde: number, hasta: number, peso: number, dirigido: boolean) {
		this._desde = desde;
		this._hasta = hasta;
		this._peso = peso;
		this._dirigido = dirigido;
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
}
