import {
	ChangeDetectionStrategy,
	Component,
	ElementRef,
	inject,
	ViewChild,
} from "@angular/core";
import { MatButtonModule } from "@angular/material/button";
import { MatDialog } from "@angular/material/dialog";
import { ModalContentComponent } from "./modal-content";
import { ButtonBarComponent } from "../button-bar";
import { FormsModule } from "@angular/forms";
import { Conexion, Nodo } from "@app/models";

@Component({
	selector: "app-my-canvas",
	imports: [
		MatButtonModule,
		ModalContentComponent,
		ButtonBarComponent,
		FormsModule,
	],
	templateUrl: "./my-canvas.component.html",
	styleUrl: "./my-canvas.component.scss",
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MyCanvasComponent {
	@ViewChild("myCanvas", { static: true })
	canvas!: ElementRef<HTMLCanvasElement>;
	@ViewChild("fileInput", { static: false })
	fileInput!: ElementRef<HTMLInputElement>;
	readonly dialog = inject(MatDialog);
	modes: { [key: string]: boolean } = {
		move: false,
		delete: false,
		connect: false,
		add: false,
		edit: false,
	};
	modoConexion: boolean = false;
	private contador: number = 0;
	private nodos: Nodo[] = [];
	private conexiones: Conexion[] = [];
	arcoDirigido = false;
	peso = 0;
	private primerNodoSeleccionado: number | null = null;
	private segundoNodoSeleccionado: number | null = null;
	mostrarModal = false;
	colorFondo: string = "#ffffff";
	private radio: number = 30;

	onModeToggled(event: { id: string; active: boolean }) {
		console.log("Button toggled:", event);

		Object.keys(this.modes).forEach((key) => {
			this.modes[key] = false;
		});

		this.modes[event.id] = event.active;
		this.nodos.forEach((c) => (c.selected = false));
		this.primerNodoSeleccionado = null;

		// redibujar canvas
		const canvas = document.querySelector("canvas");
		const ctx = canvas?.getContext("2d");
		if (ctx) {
			this.dibujarNodo(ctx);
		}

		console.log("Current modes:", this.modes);
	}

	// método de doble clic en el canvas
	dobleClickCanvas(event: MouseEvent): void {
		const canvas = <HTMLCanvasElement>event.target;
		const ctx = canvas.getContext("2d");
		if (ctx) {
			const rect = canvas.getBoundingClientRect();
			const x = event.clientX - rect.left;
			const y = event.clientY - rect.top;
			this.contador++;
			this.nodos.push(new Nodo(x, y, this.radio, this.contador, false));
			this.dibujarNodo(ctx); // redibujar el nodo
		}
	}

	// método de un clic sobre el nodo
	clickCanvas(event: MouseEvent): void {
		const canvas = <HTMLCanvasElement>event.target;
		const ctx = canvas.getContext("2d");
		// verificamos si el contexto (ctx) se obtuvo correctamente
		if (ctx) {
			const rect = canvas.getBoundingClientRect();
			const x = event.clientX - rect.left;
			const y = event.clientY - rect.top;
			if (this.modes["connect"]) {
				console.log("Es tamos e el modo conexion");
				this.manejarConexion(x, y, ctx);
			} else if (this.modes["delete"]) {
				this.manejarEliminacion(x, y, ctx);
			}
		}
	}

	// método para manejar las conexiones entre nodos
	/*
	private manejarConexion(
		x: number,
		y: number,
		ctx: CanvasRenderingContext2D,
	): void {
		const nodoSeleccionado = this.nodos.find(
			(nodo) =>
				Math.sqrt(Math.pow(x - nodo.x, 2) + Math.pow(y - nodo.y, 2)) <
				nodo.radio,
		);
		if (nodoSeleccionado) {
			if (this.primerNodoSeleccionado === null) {
				this.primerNodoSeleccionado = nodoSeleccionado.contador;
				nodoSeleccionado.selected = true;
			} else if (this.primerNodoSeleccionado !== nodoSeleccionado.contador) {
				this.segundoNodoSeleccionado = nodoSeleccionado.contador;
				this.mostrarModal = true;
			}
			this.dibujarNodo(ctx);
		}
	}*/

	private manejarConexion(
		x: number,
		y: number,
		ctx: CanvasRenderingContext2D,
	): void {
		const nodoSeleccionado = this.nodos.find(
			(nodo) =>
				Math.sqrt(Math.pow(x - nodo.x, 2) + Math.pow(y - nodo.y, 2)) <
				nodo.radio,
		);
		if (nodoSeleccionado) {
			if (this.primerNodoSeleccionado === null) {
				this.primerNodoSeleccionado = nodoSeleccionado.contador;
				nodoSeleccionado.selected = true;
			} else if (this.primerNodoSeleccionado !== nodoSeleccionado.contador) {
				this.segundoNodoSeleccionado = nodoSeleccionado.contador;
				this.showModal();
			}
			this.dibujarNodo(ctx);
		}
	}

	// método para manejar la eliminación de conexiones y nodos
	private manejarEliminacion(
		x: number,
		y: number,
		ctx: CanvasRenderingContext2D,
	): void {
		const nodoIndex = this.nodos.findIndex(
			(circulo) =>
				Math.sqrt(Math.pow(x - circulo.x, 2) + Math.pow(y - circulo.y, 2)) <=
				circulo.radio,
		);

		if (nodoIndex !== -1) {
			const nodoEliminado = this.nodos[nodoIndex];

			this.conexiones = this.conexiones.filter(
				(conexion) =>
					conexion.desde !== nodoEliminado.contador &&
					conexion.hasta !== nodoEliminado.contador,
			);

			this.nodos.splice(nodoIndex, 1);
		} else {
			const conexionIndex = this.conexiones.findIndex((conexion) => {
				const desde = this.nodos.find((c) => c.contador === conexion.desde);
				const hasta = this.nodos.find((c) => c.contador === conexion.hasta);
				if (desde && hasta) {
					return this.estaCercaDeConexion(
						x,
						y,
						desde.x,
						desde.y,
						hasta.x,
						hasta.y,
						conexion,
					);
				}
				return false;
			});

			if (conexionIndex !== -1) {
				this.conexiones.splice(conexionIndex, 1);
			}
		}
		this.dibujarNodo(ctx);
	}

	private estaCercaDeConexion(
		x: number,
		y: number,
		x1: number,
		y1: number,
		x2: number,
		y2: number,
		conexion: { desde: number; hasta: number },
	): boolean {
		const bidireccional = this.conexiones.some(
			(c) => c.desde === conexion.hasta && c.hasta === conexion.desde,
		);
		if (bidireccional) {
			const controlX = (x1 + x2) / 2 + (y1 - y2) * 0.3;
			const controlY = (y1 + y2) / 2 + (x2 - x1) * 0.3;
			return this.estaCercaDeCurva(x, y, x1, y1, controlX, controlY, x2, y2);
		}
		return this.estaCercaDeLinea(x, y, x1, y1, x2, y2);
	}

	private estaCercaDeLinea(
		x: number,
		y: number,
		x1: number,
		y1: number,
		x2: number,
		y2: number,
	): boolean {
		// calculamos la distancia entre el punto (x, y) y la línea (x1, y1 → x2, y2)
		const distancia =
			Math.abs((y2 - y1) * x - (x2 - x1) * y + x2 * y1 - y2 * x1) /
			Math.sqrt(Math.pow(y2 - y1, 2) + Math.pow(x2 - x1, 2)); // fórmula de distancia punto-línea, derivada de la ecuación de la recta
		return distancia < 5; // si distancia es menor a 5, esto permite hacer clic cerca de la línea para seleccionarla
	}

	private estaCercaDeCurva(
		x: number,
		y: number,
		x1: number,
		y1: number,
		cx: number,
		cy: number,
		x2: number,
		y2: number,
	): boolean {
		for (let t = 0; t <= 1; t += 0.05) {
			const px = (1 - t) * (1 - t) * x1 + 2 * (1 - t) * t * cx + t * t * x2;
			const py = (1 - t) * (1 - t) * y1 + 2 * (1 - t) * t * cy + t * t * y2;
			if (Math.sqrt((px - x) ** 2 + (py - y) ** 2) < 5) {
				return true;
			}
		}
		return false;
	}

	// método para confirmar la conexión
	confirmarConexion(datos: { peso: number; dirigido: boolean }) {
		// verificamos si hay dos nodos seleccionados
		if (
			this.primerNodoSeleccionado !== null &&
			this.segundoNodoSeleccionado !== null
		) {
			this.conexiones.push(
				new Conexion(
					this.primerNodoSeleccionado,
					this.segundoNodoSeleccionado,
					datos.peso,
					datos.dirigido,
				),
			);
		}
		this.limpiarSeleccion();
	}

	// método para cancelar la conexión
	cancelarConexion() {
		this.limpiarSeleccion();
	}

	private limpiarSeleccion() {
		this.nodos.forEach((c) => (c.selected = false));
		this.primerNodoSeleccionado = null;
		this.segundoNodoSeleccionado = null;
		this.mostrarModal = false;

		const canvas = document.querySelector("canvas");
		const ctx = canvas?.getContext("2d");
		if (ctx) {
			this.dibujarNodo(ctx);
		}
	}

	// método de dibujar nodo
	dibujarNodo(ctx: CanvasRenderingContext2D): void {
		ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

		// Dibujar conexiones
		this.conexiones.forEach((conexion) => {
			const desde = this.nodos.find((c) => c.contador === conexion.desde);
			const hasta = this.nodos.find((c) => c.contador === conexion.hasta);
			if (desde && hasta) {
				console.log("Dibujando conexión desde:", desde, "hasta:", hasta);
				const bidireccional = this.conexiones.some(
					(c) => c.desde === conexion.hasta && c.hasta === conexion.desde,
				);
				ctx.beginPath();
				let midX, midY, controlX, controlY;
				if (bidireccional) {
					controlX = (desde.x + hasta.x) / 2 + (desde.y - hasta.y) * 0.3;
					controlY = (desde.y + hasta.y) / 2 + (hasta.x - desde.x) * 0.3;
					ctx.moveTo(desde.x, desde.y);
					ctx.quadraticCurveTo(controlX, controlY, hasta.x, hasta.y);
					midX = (desde.x + 2 * controlX + hasta.x) / 4;
					midY = (desde.y + 2 * controlY + hasta.y) / 4;
				} else {
					controlX = (desde.x + hasta.x) / 2;
					controlY = (desde.y + hasta.y) / 2;
					ctx.moveTo(desde.x, desde.y);
					ctx.lineTo(hasta.x, hasta.y);
					midX = controlX;
					midY = controlY;
				}
				ctx.strokeStyle = "#666";
				ctx.lineWidth = 2;
				ctx.stroke();

				if (conexion.dirigido) {
					this.dibujarFlechaCurva(
						ctx,
						desde.x,
						desde.y,
						hasta.x,
						hasta.y,
						controlX,
						controlY,
					);
				}
				// Dibujar peso de cada conexión en su propia posición
				ctx.fillStyle = "white";
				ctx.fillRect(midX - 10, midY - 10, 20, 20);
				ctx.font = "12px Arial";
				ctx.fillStyle = "black";
				ctx.textAlign = "center";
				ctx.textBaseline = "middle";
				ctx.fillText(conexion.peso.toString(), midX, midY);
			}
		});

		// Dibujar nodos
		this.nodos.forEach((circulo) => {
			console.log("Dibujando nodo:", circulo);
			ctx.beginPath();
			ctx.arc(circulo.x, circulo.y, circulo.radio, 0, Math.PI * 2);
			ctx.fillStyle = circulo.selected ? "#ff9800" : "yellow";
			ctx.fill();
			ctx.stroke();
			ctx.font = "20px Source Sans Pro,Arial,sans-serif";
			ctx.fillStyle = "black";
			ctx.textAlign = "center";
			ctx.textBaseline = "middle";
			ctx.fillText(circulo.contador.toString(), circulo.x, circulo.y);
		});
	}

	private dibujarFlechaCurva(
		ctx: CanvasRenderingContext2D,
		fromX: number,
		fromY: number,
		toX: number,
		toY: number,
		ctrlX: number,
		ctrlY: number,
	): void {
		const t = 0.9; // Punto cercano al final de la curva
		const x = (1 - t) * (1 - t) * fromX + 2 * (1 - t) * t * ctrlX + t * t * toX;
		const y = (1 - t) * (1 - t) * fromY + 2 * (1 - t) * t * ctrlY + t * t * toY;
		const angle = Math.atan2(toY - y, toX - x);
		const headLen = 10;
		ctx.beginPath();
		ctx.moveTo(
			x - headLen * Math.cos(angle - Math.PI / 6),
			y - headLen * Math.sin(angle - Math.PI / 6),
		);
		ctx.lineTo(x, y);
		ctx.lineTo(
			x - headLen * Math.cos(angle + Math.PI / 6),
			y - headLen * Math.sin(angle + Math.PI / 6),
		);
		ctx.strokeStyle = "#666";
		ctx.lineWidth = 2;
		ctx.stroke();
	}

	cambiarColorFondo() {
		const contexto = this.canvas.nativeElement.getContext("2d");
		if (contexto) {
			contexto.fillStyle = this.colorFondo;
			contexto.fillRect(
				0,
				0,
				this.canvas.nativeElement.width,
				this.canvas.nativeElement.height,
			);
		}
	}

	//MostrarModal
	showModal(): void {
		const dialogRef = this.dialog.open(ModalContentComponent, {
			height: "265px",
			width: "200px",
			data: { peso: this.peso, dirigido: this.arcoDirigido },
		});

		dialogRef.afterClosed().subscribe((result) => {
			if (result) {
				this.confirmarConexion({
					peso: result.peso,
					dirigido: result.dirigido,
				});
			} else {
				this.cancelarConexion();
			}
		});
	}

	//Metodo para exportar la informacion
	exportarJSON(): void {
		const data = {
			nodos: this.nodos,
			conexiones: this.conexiones,
		};
		const jsonData = JSON.stringify(data, null, 2);

		// Entrada de nombre del archivo
		const fileName = prompt(
			"Ingrese el nombre del archivo (sin extensión):",
			"grafo",
		);
		if (!fileName) {
			return;
		}

		const blob = new Blob([jsonData], { type: "application/json" });
		const url = URL.createObjectURL(blob);
		const a = document.createElement("a");
		a.href = url;
		a.download = `${fileName}.json`;
		a.click();
		URL.revokeObjectURL(url);
	}

	// Método para activar el selector de archivos
	seleccionarArchivo() {
		const fileInput = document.getElementById("fileInput") as HTMLInputElement;
		fileInput.click();
	}

	// Leer archivo JSON
	onFileSelected(event: any) {
		Object.keys(this.modes).forEach((key) => {
			this.modes[key] = false;
		});
		this.limpiarCanvas();
		const file = event.target.files[0];
		if (file) {
			const reader = new FileReader();
			reader.onload = (e: any) => {
				const json = JSON.parse(e.target.result);

				console.log("JSON importado:", json); // Verifica la estructura importada

				// Limpiar los nodos y conexiones existentes
				this.nodos = [];
				this.conexiones = [];

				// Agregar el contador a cada nodo al importar
				json.nodos.forEach((nodo: any, index: number) => {
					nodo.contador = index + 1;
				});
				this.nodos.push(...json.nodos);

				this.contador = this.nodos.length;
				console.log("Nodos después de importar:", this.nodos);

				// Mapear los nodos en las conexiones
				json.conexiones.forEach((conexion: any) => {
					const node1 = conexion._desde;
					const node2 = conexion._hasta;

					if (node1 !== -1 && node2 !== -1) {
						this.conexiones.push(
							new Conexion(node1, node2, conexion._peso, conexion._dirigido),
						);
					} else {
						console.warn("No se encontró una conexión válida para:", conexion);
					}
				});

				console.log("Conexiones después de importar:", this.conexiones);

				this.dibujar();
			};
			reader.readAsText(file);
		}
	}

	// Dibujar nodos y arcos a partir del JSON importado
	dibujar() {
		const canvas = document.getElementById("myCanvas") as HTMLCanvasElement;
		const ctx = canvas.getContext("2d");
		if (!ctx) return;

		ctx.clearRect(0, 0, canvas.width, canvas.height);

		// Verificar si hay nodos antes de dibujar
		if (this.nodos.length === 0) {
			console.warn("No hay nodos para dibujar");
			return;
		}
		console.log(this.nodos);
		console.log(this.conexiones);

		this.dibujarNodo(ctx);
	}

	limpiarCanvas() {
		const canvas = document.getElementById("myCanvas") as HTMLCanvasElement;
		const context = canvas.getContext("2d");
		if (context) {
			context.clearRect(0, 0, canvas.width, canvas.height);
		}
		console.log("Estoy limpiando");
		this.nodos = [];
		this.conexiones = [];
		this.contador = 0;
	}
}
