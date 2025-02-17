import {
	ChangeDetectionStrategy,
	Component,
	ElementRef,
	ViewChild,
} from "@angular/core";
import { ButtonBarComponent } from "../button-bar";

@Component({
	selector: "app-graphs",
	imports: [ButtonBarComponent],
	templateUrl: "./graphs.component.html",
	styleUrl: "./graphs.component.scss",
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GraphsComponent {
	private nodeCount = 0;
	private nodes: HTMLElement[] = [];
	private connections: any[] = [];
	private connecting = false;
	private movingMode = false;
	private startNode: HTMLElement | null = null;
	private endNode: HTMLElement | null = null;

	@ViewChild("workspace", { static: true }) workspace!: ElementRef;
	@ViewChild("status", { static: true }) status!: ElementRef;
	@ViewChild("connectionModal", { static: true }) connectionModal!: ElementRef;
	@ViewChild("svgCanvas", { static: true }) svgCanvas!: ElementRef;
	@ViewChild("weight", { static: true }) weight!: ElementRef;

	protected createNode(event: MouseEvent) {
		this.nodeCount++;
		const node = document.createElement("div");
		node.classList.add("node");
		node.innerText = "Nodo " + this.nodeCount;
		node.style.left = `${event.clientX - 30}px`;
		node.style.top = `${event.clientY - 30}px`;
		node.onmousedown = (e) => this.selectNode(e, node);
		this.workspace.nativeElement.appendChild(node);
		this.nodes.push(node);
	}

	protected selectNode(event: MouseEvent, node: HTMLElement) {
		event.stopPropagation();
		if (this.movingMode) {
			node.onmousemove = (e) => this.moveNode(e, node);
			node.onmouseup = () => (node.onmousemove = null);
		} else if (this.connecting) {
			node.classList.add("selected");
			if (!this.startNode) {
				this.startNode = node;
			} else if (this.startNode !== node) {
				this.endNode = node;
				this.openModal();
			}
		}
	}

	protected moveNode(event: MouseEvent, node: HTMLElement) {
		node.style.left = `${event.clientX - 30}px`;
		node.style.top = `${event.clientY - 30}px`;
		this.updateConnections();
	}

	protected toggleMoveMode() {
		this.movingMode = !this.movingMode;
		this.connecting = false;
		this.status.nativeElement.innerText = this.movingMode
			? "Modo Mover"
			: "Modo Normal";
	}

	protected startConnection() {
		this.connecting = true;
		this.movingMode = false;
		this.status.nativeElement.innerText = "Seleccione dos nodos";
	}

	protected openModal() {
		this.connectionModal.nativeElement.style.display = "block";
	}

	protected closeModal() {
		this.connectionModal.nativeElement.style.display = "none";
	}

	protected confirmConnection(directed: boolean) {
		const weight = (this.weight.nativeElement as HTMLInputElement).value;
		this.createConnection(this.startNode!, this.endNode!, directed, weight);
		this.closeModal();
		this.startNode!.classList.remove("selected");
		this.endNode!.classList.remove("selected");
		this.startNode = null;
		this.endNode = null;
		this.connecting = false;
		this.status.nativeElement.innerText = "Modo Normal";
	}

	createConnection(
		start: HTMLElement,
		end: HTMLElement,
		directed: boolean,
		weight: string,
	): void {
		const svg = this.svgCanvas.nativeElement;
		const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
		path.setAttribute("stroke", "black");
		path.setAttribute("fill", "none");
		if (directed) {
			path.setAttribute("marker-end", "url(#arrowhead)");
		}

		const text = document.createElementNS("http://www.w3.org/2000/svg", "text");
		text.textContent = weight;
		svg.appendChild(path);
		svg.appendChild(text);

		const isCurved = this.connections.some(
			(conn) => conn.start === end && conn.end === start,
		);
		this.connections.push({ start, end, path, text, isCurved, weight });
		this.updateConnections();
	}

	updateConnections(): void {
		this.connections.forEach(({ start, end, path, text, isCurved, weight }) => {
			const startX = start.offsetLeft + 30;
			const startY = start.offsetTop + 30;
			const endX = end.offsetLeft + 30;
			const endY = end.offsetTop + 30;

			const midX = (startX + endX) / 2 + (isCurved ? 40 : 0);
			const midY = (startY + endY) / 2 - (isCurved ? 40 : 0);

			path.setAttribute(
				"d",
				`M ${startX} ${startY} Q ${midX} ${midY} ${endX} ${endY}`,
			);
			text.setAttribute("x", midX.toString());
			text.setAttribute("y", midY.toString());
		});
	}

	removeObject() {}
}
