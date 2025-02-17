import {
	ChangeDetectionStrategy,
	Component,
	ElementRef,
	inject,
	OnInit,
	ViewChild,
} from "@angular/core";
import { MatButtonModule } from "@angular/material/button";
import { MatDialog } from "@angular/material/dialog";
import { ModalContentComponent } from "./modal-content";
import { ButtonBarComponent } from "../button-bar";
import { FormsModule } from "@angular/forms";

interface Node {
	x: number;
	y: number;
}

interface Arco {
	node1: Node;
	node2: Node;
	dirigido: boolean;
	peso: number;
}

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
export class MyCanvasComponent implements OnInit {
	@ViewChild("myCanvas", { static: true })
	canvas!: ElementRef<HTMLCanvasElement>;
	//Entrada de archivos
	@ViewChild("fileInput", { static: false })
	fileInput!: ElementRef<HTMLInputElement>;
	//Variable de manejo de canvas
	private ctx!: CanvasRenderingContext2D;

	readonly dialog = inject(MatDialog);
	nodes: Node[] = [];
	selectedNode: Node | null = null;
	arcos: Arco[] = [];
	arcoDirigido = false;
	peso = 0;
	tempNode: Node | null = null;
	moveMode = false;
	deleteMode = false;
	draggingNode: Node | null = null;
	colorFondo: string = "#ffffff";
	modes: { [key: string]: boolean } = {
		move: false,
		delete: false,
		add: false,
		edit: false,
	};

	ngOnInit(): void {
		const canvas = document.getElementById("myCanvas") as HTMLCanvasElement;
		const context = canvas.getContext("2d") as CanvasRenderingContext2D;

		canvas.addEventListener("mousedown", (e) => {
			if (this.modes["move"]) {
				const x = e.clientX - canvas.offsetLeft;
				const y = e.clientY - canvas.offsetTop;
				this.draggingNode = this.getNodeAt(x, y, this.nodes);
			}
		});

		canvas.addEventListener("mousemove", (e) => {
			if (this.modes["move"] && this.draggingNode) {
				this.draggingNode.x = e.clientX - canvas.offsetLeft;
				this.draggingNode.y = e.clientY - canvas.offsetTop;

				context.clearRect(0, 0, canvas.width, canvas.height);
				this.drawArcos(context, this.arcos);
				this.drawNodes(context, this.nodes);
			}
		});

		canvas.addEventListener("mouseup", () => {
			this.draggingNode = null;
		});

		canvas.addEventListener("click", (e) => {
			if (this.modes["move"]) return;

			const x = e.clientX - canvas.offsetLeft;
			const y = e.clientY - canvas.offsetTop;
			const clickedNode = this.getNodeAt(x, y, this.nodes);

			if (this.modes["delete"]) {
				if (clickedNode !== null) {
					const nodeIndex = this.nodes.indexOf(clickedNode);
					this.nodes.splice(nodeIndex, 1);
					this.arcos = this.arcos.filter(
						(arco) => arco.node1 !== clickedNode && arco.node2 !== clickedNode,
					);
				} else {
					let arcToDelete: number | null = null;
					let minDistance = Infinity;

					for (let i = 0; i < this.arcos.length; i++) {
						const arco = this.arcos[i];
						let distance: number;

						if (this.hasBidirectionalConnection(arco, this.arcos)) {
							const steps = 20;
							let minCurveDistance = Infinity;

							for (let t = 0; t <= 1; t += 1 / steps) {
								const midX = (arco.node1.x + arco.node2.x) / 2;
								const midY = (arco.node1.y + arco.node2.y) / 2;

								const dx = arco.node2.x - arco.node1.x;
								const dy = arco.node2.y - arco.node1.y;
								const normalX = -dy;
								const normalY = dx;
								const length = Math.sqrt(normalX * normalX + normalY * normalY);
								const curveOffset = 50;

								const controlX = midX + (normalX / length) * curveOffset;
								const controlY = midY + (normalY / length) * curveOffset;

								const curveX =
									Math.pow(1 - t, 2) * arco.node1.x +
									2 * (1 - t) * t * controlX +
									Math.pow(t, 2) * arco.node2.x;
								const curveY =
									Math.pow(1 - t, 2) * arco.node1.y +
									2 * (1 - t) * t * controlY +
									Math.pow(t, 2) * arco.node2.y;

								const curveDistance = Math.sqrt(
									Math.pow(x - curveX, 2) + Math.pow(y - curveY, 2),
								);

								minCurveDistance = Math.min(minCurveDistance, curveDistance);
							}

							distance = minCurveDistance;
						} else {
							const A = { x: arco.node1.x, y: arco.node1.y };
							const B = { x: arco.node2.x, y: arco.node2.y };
							const P = { x: x, y: y };

							const AB = { x: B.x - A.x, y: B.y - A.y };
							const AP = { x: P.x - A.x, y: P.y - A.y };
							const ab2 = AB.x * AB.x + AB.y * AB.y;
							const ap_ab = AP.x * AB.x + AP.y * AB.y;
							let t = ap_ab / ab2;
							t = Math.max(0, Math.min(1, t));

							const closest = {
								x: A.x + AB.x * t,
								y: A.y + AB.y * t,
							};

							distance = Math.sqrt(
								Math.pow(P.x - closest.x, 2) + Math.pow(P.y - closest.y, 2),
							);
						}

						if (distance < minDistance && distance < 20) {
							minDistance = distance;
							arcToDelete = i;
						}
					}

					if (arcToDelete !== null) {
						this.arcos.splice(arcToDelete, 1);
					}
				}

				context.clearRect(0, 0, canvas.width, canvas.height);
				this.drawArcos(context, this.arcos);
				this.drawNodes(context, this.nodes);
				return;
			}

			if (clickedNode !== null) {
				if (this.selectedNode === null) {
					this.selectedNode = clickedNode;
				} else {
					this.tempNode = clickedNode;
				}
			} else if (this.selectedNode === null) {
				this.nodes.push({ x, y });
			}

			context.clearRect(0, 0, canvas.width, canvas.height);

			if (this.selectedNode !== null && this.tempNode !== null) {
				this.peso = 0;
				this.arcoDirigido = false;
				this.showModal();
			}

			this.drawArcos(context, this.arcos);
			this.drawNodes(context, this.nodes);
		});
	}

	ngAfterViewInit() {
		//Obtener el contexto de canvas para poderlo usar fuera del metodo ngOnInit
		if (this.canvas) {
			this.ctx = this.canvas.nativeElement.getContext("2d")!;
		}
	}

	//ObtnerNodoPorPosicion
	getNodeAt(x: number, y: number, nodes: Node[]): Node | null {
		for (const node of nodes) {
			const a = x - node.x;
			const b = y - node.y;
			const c = Math.sqrt(a * a + b * b);
			if (c < 90) {
				return node;
			}
		}
		return null;
	}
	//DibujarNodos
	drawNodes(ctx: CanvasRenderingContext2D, nodes: Node[]): void {
		for (const [index, node] of nodes.entries()) {
			ctx.strokeStyle = node === this.selectedNode ? "#FF0000" : "#000000";
			ctx.beginPath();
			ctx.lineWidth = 3;
			ctx.fillStyle = "#FFFFFF";
			ctx.arc(node.x, node.y, 20, 0, 2 * Math.PI);
			ctx.stroke();
			ctx.fill();
			ctx.fillStyle = node === this.selectedNode ? "#FF0000" : "#000000";
			ctx.font = "20px Arial";
			ctx.fillText(index.toString(), node.x - 5, node.y + 5);
		}
	}
	//VerificarArcoBidireccional
	hasBidirectionalConnection(arco: Arco, arcos: Arco[]): boolean {
		return arcos.some(
			(a) =>
				a !== arco &&
				((a.node1 === arco.node1 && a.node2 === arco.node2) ||
					(a.node1 === arco.node2 && a.node2 === arco.node1)),
		);
	}
	//DibujarArcos
	drawArcos(ctx: CanvasRenderingContext2D, arcos: Arco[]): void {
		const radius = 20;

		for (const arco of arcos) {
			const isBidirectional = this.hasBidirectionalConnection(arco, arcos);

			let angle = Math.atan2(
				arco.node2.y - arco.node1.y,
				arco.node2.x - arco.node1.x,
			);

			let startX = arco.node1.x;
			let startY = arco.node1.y;
			let endX = arco.node2.x;
			let endY = arco.node2.y;

			ctx.beginPath();
			if (isBidirectional) {
				const midX = (startX + endX) / 2;
				const midY = (startY + endY) / 2;
				const dx = endX - startX;
				const dy = endY - startY;
				const normalX = -dy;
				const normalY = dx;
				const length = Math.sqrt(normalX * normalX + normalY * normalY);
				const curveOffset = 50;

				const controlX = midX + (normalX / length) * curveOffset;
				const controlY = midY + (normalY / length) * curveOffset;

				const startAngle = Math.atan2(controlY - startY, controlX - startX);
				const endAngle = Math.atan2(controlY - endY, controlX - endX);

				startX = arco.node1.x + radius * Math.cos(startAngle);
				startY = arco.node1.y + radius * Math.sin(startAngle);
				endX = arco.node2.x + radius * Math.cos(endAngle);
				endY = arco.node2.y + radius * Math.sin(endAngle);

				ctx.moveTo(startX, startY);
				ctx.quadraticCurveTo(controlX, controlY, endX, endY);

				if (arco.dirigido) {
					const t = 0.95;
					const arrowX =
						(1 - t) * (1 - t) * startX +
						2 * (1 - t) * t * controlX +
						t * t * endX;
					const arrowY =
						(1 - t) * (1 - t) * startY +
						2 * (1 - t) * t * controlY +
						t * t * endY;

					const tangentX =
						2 * (1 - t) * (controlX - startX) + 2 * t * (endX - controlX);
					const tangentY =
						2 * (1 - t) * (controlY - startY) + 2 * t * (endY - controlY);
					const arrowAngle = Math.atan2(tangentY, tangentX);

					const arrowSize = 10;
					ctx.moveTo(arrowX, arrowY);
					ctx.lineTo(
						arrowX - arrowSize * Math.cos(arrowAngle - Math.PI / 6),
						arrowY - arrowSize * Math.sin(arrowAngle - Math.PI / 6),
					);
					ctx.moveTo(arrowX, arrowY);
					ctx.lineTo(
						arrowX - arrowSize * Math.cos(arrowAngle + Math.PI / 6),
						arrowY - arrowSize * Math.sin(arrowAngle + Math.PI / 6),
					);
				}
			} else {
				startX = arco.node1.x + radius * Math.cos(angle);
				startY = arco.node1.y + radius * Math.sin(angle);
				endX = arco.node2.x - radius * Math.cos(angle);
				endY = arco.node2.y - radius * Math.sin(angle);

				ctx.moveTo(startX, startY);
				ctx.lineTo(endX, endY);

				if (arco.dirigido) {
					const arrowSize = 10;
					ctx.lineTo(
						endX - arrowSize * Math.cos(angle - Math.PI / 6),
						endY - arrowSize * Math.sin(angle - Math.PI / 6),
					);
					ctx.moveTo(endX, endY);
					ctx.lineTo(
						endX - arrowSize * Math.cos(angle + Math.PI / 6),
						endY - arrowSize * Math.sin(angle + Math.PI / 6),
					);
				}
			}

			ctx.strokeStyle = "#000000";
			ctx.stroke();

			if (arco.peso !== undefined && arco.peso !== 0) {
				ctx.font = "20px Arial";

				let textX, textY;
				if (isBidirectional) {
					const midT = 0.5;
					textX =
						(1 - midT) * (1 - midT) * startX +
						2 *
							(1 - midT) *
							midT *
							((startX + endX) / 2 + (endY - startY) / 4) +
						midT * midT * endX;
					textY =
						(1 - midT) * (1 - midT) * startY +
						2 *
							(1 - midT) *
							midT *
							((startY + endY) / 2 - (endX - startX) / 4) +
						midT * midT * endY;
				} else {
					textX = (startX + endX) / 2;
					textY = (startY + endY) / 2 - 10;
				}

				const padding = 4;
				const textWidth = ctx.measureText(arco.peso.toString()).width;
				ctx.fillStyle = "#FFFFFF";
				ctx.fillRect(
					textX - textWidth / 2 - padding,
					textY - 10 - padding,
					textWidth + padding * 2,
					20 + padding * 2,
				);

				ctx.fillStyle = "#000000";
				ctx.textAlign = "center";
				ctx.textBaseline = "middle";
				ctx.fillText(arco.peso.toString(), textX, textY);
			}
		}
		console.log(this.arcos);
	}
	//CambiarColorFondo
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
				this.arcoDirigido = result.dirigido;
				this.peso = result.peso;
				this.arcos.push({
					node1: this.selectedNode!,
					node2: this.tempNode!,
					dirigido: this.arcoDirigido,
					peso: this.peso,
				});
				this.selectedNode = null;
				this.tempNode = null;
				const canvas = document.getElementById("myCanvas") as HTMLCanvasElement;
				const context = canvas.getContext("2d") as CanvasRenderingContext2D;
				context.clearRect(0, 0, canvas.width, canvas.height);
				this.drawArcos(context, this.arcos);
				this.drawNodes(context, this.nodes);
			}
		});
	}

	onModeToggled(event: { id: string; active: boolean }) {
		console.log("Button toggled:", event);

		// Reset all modes
		Object.keys(this.modes).forEach((key) => {
			this.modes[key] = false;
		});

		// Set the active mode
		this.modes[event.id] = event.active;

		console.log("Current modes:", this.modes);
	}

	//Metodo para exportar la informacion
	exportarJSON(): void {
		const data = {
			nodos: this.nodes,
			arcos: this.arcos,
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
		// Cancelar cualquier modo activo (mover o eliminar)
		this.moveMode = false;
		this.deleteMode = false;

		// Limpiar selecciones
		this.selectedNode = null;
		this.tempNode = null;
		this.draggingNode = null;

		//Proceso de creacion de archivos
		const file = event.target.files[0];
		if (file) {
			const reader = new FileReader();
			reader.onload = (e: any) => {
				const json = JSON.parse(e.target.result);

				// Limpiar los nodos y arcos existentes
				this.nodes = [];
				this.arcos = [];

				// Agregar los nodos importados
				this.nodes.push(...json.nodos);

				// Mapear los nodos en los arcos a los nodos en la lista nodes
				json.arcos.forEach((arco: any) => {
					const node1 = this.nodes.find(
						(node) => node.x === arco.node1.x && node.y === arco.node1.y,
					);
					const node2 = this.nodes.find(
						(node) => node.x === arco.node2.x && node.y === arco.node2.y,
					);

					if (node1 && node2) {
						this.arcos.push({
							node1,
							node2,
							dirigido: arco.dirigido,
							peso: arco.peso,
						});
					}
				});

				this.dibujar();
			};
			reader.readAsText(file);
		}
	}

	// Dibujar nodos y arcos a partir del json importado
	dibujar() {
		if (!this.ctx) return;
		this.ctx.clearRect(
			0,
			0,
			this.canvas.nativeElement.width,
			this.canvas.nativeElement.height,
		);
		this.drawArcos(this.ctx, this.arcos);
		this.drawNodes(this.ctx, this.nodes);
	}
	limpiarCanvas() {
		const canvas = document.getElementById("myCanvas") as HTMLCanvasElement;
		const context = canvas.getContext("2d");
		if (context) {
			context.clearRect(0, 0, canvas.width, canvas.height);
		}
	}
}
