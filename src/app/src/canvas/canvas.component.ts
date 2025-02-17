import {
	AfterViewInit,
	ChangeDetectionStrategy,
	Component,
	OnInit,
} from "@angular/core";
import Konva from "konva";
import { ButtonBarComponent } from "../button-bar";

@Component({
	selector: "app-canvas",
	imports: [ButtonBarComponent],
	templateUrl: "./canvas.component.html",
	styleUrl: "./canvas.component.scss",
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CanvasComponent implements OnInit {
	private stage!: Konva.Stage;
	private layer!: Konva.Layer;
	private nodes: { node: Konva.Circle; text: Konva.Text }[] = [];
	private edges: {
		node1: Konva.Circle;
		node2: Konva.Circle;
		line: Konva.Line;
	}[] = [];
	private selectedNode: Konva.Circle | null = null;
	private tempLine: Konva.Line | null = null;
	private deleteMode: boolean = false;

	ngOnInit(): void {
		const width = window.innerWidth;
		const height = window.innerHeight;
		this.stage = new Konva.Stage({ container: "container", width, height });
		this.layer = new Konva.Layer();
		this.stage.add(this.layer);

		this.initializeCanvas();
		//this.initializeTutorial();
	}

	protected initializeCanvas() {
		this.stage.on("dblclick", (e) => {
			if (e.target === this.stage) {
				const pos = this.stage.getPointerPosition();
				if (!pos) return;
				const node = new Konva.Circle({
					x: pos.x,
					y: pos.y,
					radius: 0,
					fill: "#f4a261",
					stroke: "#264653",
					strokeWidth: 3,
					draggable: true,
				});

				const text = new Konva.Text({
					x: pos.x,
					y: pos.y,
					text: `Nodo ${this.nodes.length + 1}`,
					fontSize: 18,
					fill: "white",
					align: "center",
					verticalAlign: "middle",
				});

				node.to({
					radius: 35,
					duration: 0.3,
					easing: Konva.Easings.EaseOut,
					onUpdate: () => {
						text.x(node.x() - text.width() / 2);
						text.y(node.y() - text.height() / 2);
					},
				});

				text.opacity(0);
				text.to({ opacity: 1, duration: 0.3 });

				text.on("click", () => {
					let newName = prompt(
						"Ingrese el nuevo nombre del nodo:",
						text.text(),
					);
					if (newName) {
						text.text(newName);
						text.x(node.x() - text.width() / 2);
						text.y(node.y() - text.height() / 2);
						this.layer.draw();
					}
				});

				node.on("dragmove", () => {
					text.x(node.x() - text.width() / 2);
					text.y(node.y() - text.height() / 2);

					this.edges.forEach((edge) => {
						if (edge.node1 === node || edge.node2 === node) {
							edge.line.points([
								edge.node1.x(),
								edge.node1.y(),
								edge.node2.x(),
								edge.node2.y(),
							]);
						}
					});
				});

				node.on("contextmenu", (e) => {
					e.evt.preventDefault();
					if (this.deleteMode) {
						node.destroy();
						text.destroy();

						this.edges = this.edges.filter((edge) => {
							if (edge.node1 === node || edge.node2 === node) {
								edge.line.destroy();
								return false;
							}
							return true;
						});

						this.layer.draw();
					}
				});

				this.nodes.push({ node, text });
				this.layer.add(node, text);
				this.layer.draw();
			}
		});

		this.stage.on("contextmenu", (e) => {
			e.evt.preventDefault();

			if (this.deleteMode) {
				return;
			}

			if (e.target instanceof Konva.Circle) {
				if (this.selectedNode) {
					return;
				}

				this.selectedNode = e.target;

				this.tempLine = new Konva.Line({
					points: [
						this.selectedNode.x(),
						this.selectedNode.y(),
						this.selectedNode.x(),
						this.selectedNode.y(),
					],
					stroke: "#e76f51",
					strokeWidth: 3,
					lineCap: "round",
					lineJoin: "round",
					dash: [10, 5],
				});

				this.layer.add(this.tempLine);
				this.layer.draw();

				this.stage.on("mousemove", (e) => {
					if (this.tempLine) {
						const pos = this.stage.getPointerPosition();
						if (!pos || !this.selectedNode) return;
						this.tempLine.points([
							this.selectedNode.x(),
							this.selectedNode.y(),
							pos.x,
							pos.y,
						]);
						this.layer.draw();
					}
				});

				this.stage.on("mouseup", (e) => {
					if (this.tempLine) {
						const pos = this.stage.getPointerPosition();
						if (!pos) return;
						let targetNode = this.nodes.find((n) => {
							let dx = n.node.x() - pos.x;
							let dy = n.node.y() - pos.y;
							return Math.sqrt(dx * dx + dy * dy) < 35;
						});

						if (targetNode && targetNode.node !== this.selectedNode) {
							if (!this.selectedNode) return;
							const line = new Konva.Line({
								points: [
									this.selectedNode.x(),
									this.selectedNode.y(),
									targetNode.node.x(),
									targetNode.node.y(),
								],
								stroke: "#e76f51",
								strokeWidth: 3,
								lineCap: "round",
								lineJoin: "round",
							});

							this.edges.push({
								node1: this.selectedNode,
								node2: targetNode.node,
								line,
							});
							this.layer.add(line);
							this.layer.draw();
						}

						this.tempLine.destroy();
						this.tempLine = null;

						this.selectedNode = null;

						this.stage.off("mousemove");
						this.stage.off("mouseup");
					}
				});
			}
		});

		document.addEventListener("keydown", (e) => {
			if (e.key === "e") {
				this.deleteMode = !this.deleteMode; // Alternar el modo de eliminacion
				alert(
					this.deleteMode
						? "Modo de eliminación activado"
						: "Modo de eliminación desactivado",
				);
			}
		});
	}
	private initializeTutorial(): void {
		const tutorialSteps = [
			{
				text: "Bienvenido al tutorial de grafos.",
				video: "assets/videos/paso1.mp4",
			},
			{
				text: "Doble clic en cualquier parte para crear un nodo.",
				video: "videos/paso2.mp4",
			},
			{
				text: "Haz clic derecho sobre un nodo para iniciar una arista.",
				video: "videos/paso3.mp4",
			},
			{
				text: "Presiona 'e' para activar el modo de eliminación.",
				video: "videos/paso4.mp4",
			},
			{
				text: "¡Disfruta creando y editando grafos!",
				video: "videos/paso5.gif",
			},
		];

		let currentStep = 0;

		const tutorialOverlay = document.getElementById("tutorial-overlay");
		const tutorialText = document.getElementById("tutorial-text");
		const tutorialVideo = document.getElementById(
			"tutorial-video",
		) as HTMLVideoElement;
		const tutorialSource = tutorialVideo.querySelector("source");
		const openTutorialButton = document.getElementById("open-tutorial");
		const prevButton = document.getElementById(
			"prev-step",
		) as HTMLButtonElement;
		const nextButton = document.getElementById(
			"next-step",
		) as HTMLButtonElement;
		const closeButton = document.getElementById("close-tutorial");
		if (
			!tutorialOverlay ||
			!tutorialText ||
			!tutorialVideo ||
			!tutorialSource ||
			!openTutorialButton ||
			!prevButton ||
			!nextButton ||
			!closeButton
		) {
			console.error("Algo falta en el DOM");
			return;
		}

		function updateTutorial() {
			if (
				!tutorialOverlay ||
				!tutorialText ||
				!tutorialVideo ||
				!tutorialSource ||
				!openTutorialButton ||
				!prevButton ||
				!nextButton ||
				!closeButton
			) {
				console.error("One or more tutorial elements are missing from the DOM");
				return;
			}
			tutorialText.textContent = tutorialSteps[currentStep].text;
			tutorialSource.src = tutorialSteps[currentStep].video;
			tutorialVideo.load();
			prevButton.disabled = currentStep === 0;
			nextButton.disabled = currentStep === tutorialSteps.length - 1;
		}

		openTutorialButton.addEventListener("click", () => {
			tutorialOverlay.style.display = "flex";
			currentStep = 0;
			updateTutorial();
		});

		closeButton.addEventListener("click", () => {
			tutorialOverlay.style.display = "none";
		});

		prevButton.addEventListener("click", () => {
			if (currentStep > 0) {
				currentStep--;
				updateTutorial();
			}
		});

		nextButton.addEventListener("click", () => {
			if (currentStep < tutorialSteps.length - 1) {
				currentStep++;
				updateTutorial();
			}
		});

		updateTutorial();
	}
	toggleMoveMode() {}
	startConnection() {}
	removeObject() {}
}
