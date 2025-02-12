import { NgFor } from "@angular/common";
import { Component } from "@angular/core";

interface Node {
	id: number;
	x: number;
	y: number;
}

interface Edge {
	source: Node;
	target: Node;
}

@Component({
	selector: "app-graph",
	imports: [NgFor],
	templateUrl: "./graph.component.html",
	styleUrl: "./graph.component.scss",
})
export class GraphComponent {
	nodes: Node[] = [];
	edges: Edge[] = [];
	isDirected = false;
	selectedNode: Node | null = null;
	isDragging = false;

	onCanvasDblClick(event: MouseEvent) {
		const x = event.offsetX;
		const y = event.offsetY;
		this.addNode(x, y);
	}

	onCanvasMouseDown(event: MouseEvent) {
		if (event.target instanceof SVGCircleElement) {
			this.isDragging = true;
		}
	}

	onCanvasMouseUp(event: MouseEvent) {
		this.isDragging = false;
	}

	addNode(x: number, y: number) {
		const newNode: Node = { id: this.nodes.length, x, y };
		this.nodes.push(newNode);
	}

	onNodeMouseDown(event: MouseEvent, node: Node) {
		if (this.selectedNode) {
			this.edges.push({ source: this.selectedNode, target: node });
			this.selectedNode = null;
		} else {
			this.selectedNode = node;
		}
	}

	toggleDirected() {
		this.isDirected = !this.isDirected;
	}
}
