import {
	ChangeDetectionStrategy,
	Component,
	inject,
	OnInit,
} from "@angular/core";
import { MatButtonModule } from "@angular/material/button";
import { MatDialog } from "@angular/material/dialog";
import { ModalContentComponent } from "./modal-content";

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
	imports: [MatButtonModule, ModalContentComponent],
	templateUrl: "./my-canvas.component.html",
	styleUrl: "./my-canvas.component.scss",
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MyCanvasComponent implements OnInit {
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

	//Logica
	ngOnInit(): void {
		const canvas = document.getElementById("myCanvas") as HTMLCanvasElement;
		const context = canvas.getContext("2d") as CanvasRenderingContext2D;

		// Crear contenedor para botones
		const buttonContainer = document.createElement("div");
		buttonContainer.style.margin = "10px";
		canvas.parentNode?.insertBefore(buttonContainer, canvas);

		// Botón de mover
		const moveButton = document.createElement("button");
		moveButton.classList.add("node");
		moveButton.textContent = "Modo Mover";
		moveButton.style.margin = "0 10px 0 0";
		moveButton.style.padding = "5px 10px";
		buttonContainer.appendChild(moveButton);

		// Botón de eliminar
		const deleteButton = document.createElement("button");
		deleteButton.textContent = "Modo Eliminar";
		deleteButton.style.padding = "5px 10px";
		buttonContainer.appendChild(deleteButton);

		moveButton.addEventListener("click", () => {
			this.moveMode = !this.moveMode;
			if (this.moveMode) {
				this.deleteMode = false;
				deleteButton.textContent = "Modo Eliminar";
				deleteButton.style.backgroundColor = "";
			}
			moveButton.textContent = this.moveMode
				? "Desactivar Mover"
				: "Modo Mover";
			moveButton.style.backgroundColor = this.moveMode ? "#ff9999" : "";
			this.selectedNode = null;
			this.tempNode = null;
		});

		deleteButton.addEventListener("click", () => {
			this.deleteMode = !this.deleteMode;
			if (this.deleteMode) {
				this.moveMode = false;
				moveButton.textContent = "Modo Mover";
				moveButton.style.backgroundColor = "";
			}
			deleteButton.textContent = this.deleteMode
				? "Desactivar Eliminar"
				: "Modo Eliminar";
			deleteButton.style.backgroundColor = this.deleteMode ? "#ff9999" : "";
			this.selectedNode = null;
			this.tempNode = null;
		});

		canvas.addEventListener("mousedown", (e) => {
			if (this.moveMode) {
				const x = e.clientX - canvas.offsetLeft;
				const y = e.clientY - canvas.offsetTop;
				this.draggingNode = this.getNodeAt(x, y, this.nodes);
			}
		});

		canvas.addEventListener("mousemove", (e) => {
			if (this.moveMode && this.draggingNode) {
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
			if (this.moveMode) return;

			const x = e.clientX - canvas.offsetLeft;
			const y = e.clientY - canvas.offsetTop;
			const clickedNode = this.getNodeAt(x, y, this.nodes);

			if (this.deleteMode) {
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

	drawNodes(ctx: CanvasRenderingContext2D, nodes: Node[]): void {
		for (const [index, node] of nodes.entries()) {
			ctx.strokeStyle = node === this.selectedNode ? "#FF0000" : "#000000";
			ctx.beginPath();
			ctx.lineWidth = 2;
			ctx.fillStyle = "#FFFFFF";
			ctx.arc(node.x, node.y, 40, 0, 2 * Math.PI);
			ctx.stroke();
			ctx.fill();
			ctx.fillStyle = node === this.selectedNode ? "#FF0000" : "#000000";
			ctx.font = "30px Arial";
			ctx.fillText(index.toString(), node.x - 5, node.y + 5);
		}
	}

	hasBidirectionalConnection(arco: Arco, arcos: Arco[]): boolean {
		return arcos.some(
			(a) =>
				a !== arco &&
				((a.node1 === arco.node1 && a.node2 === arco.node2) ||
					(a.node1 === arco.node2 && a.node2 === arco.node1)),
		);
	}

	drawArcos(ctx: CanvasRenderingContext2D, arcos: Arco[]): void {
		const radius = 40;

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
}
