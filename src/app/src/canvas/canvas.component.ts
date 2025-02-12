import {
	AfterViewInit,
	ChangeDetectionStrategy,
	Component,
} from "@angular/core";

@Component({
	selector: "app-canvas",
	imports: [],
	templateUrl: "./canvas.component.html",
	styleUrl: "./canvas.component.scss",
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CanvasComponent implements AfterViewInit {
	private c: HTMLCanvasElement | null = null;
	private ctx: CanvasRenderingContext2D | null = null;
	private isDrawing = false;
	private startX = 0;
	private startY = 0;

	ngAfterViewInit() {
		this.c = document.getElementById("whiteSpace") as HTMLCanvasElement;
		if (this.c) {
			this.ctx = this.c.getContext("2d");
			if (this.ctx) {
				// Set the canvas size to match the element size
				this.c.width = 100;
				this.c.height = 700;

				// Adjust for high DPI screens
				const scale = window.devicePixelRatio;
				this.c.width *= scale;
				this.c.height *= scale;
				this.ctx.scale(scale, scale);

				this.c.addEventListener("mousedown", this.onMouseDown.bind(this));
				this.c.addEventListener("mousemove", this.onMouseMove.bind(this));
				this.c.addEventListener("mouseup", this.onMouseUp.bind(this));
			} else {
				console.error("2D context not available");
			}
		} else {
			console.error("Canvas element not found");
		}
	}

	private onMouseDown(event: MouseEvent) {
		this.isDrawing = true;
		this.startX = event.offsetX;
		this.startY = event.offsetY;
	}

	private onMouseMove(event: MouseEvent) {
		if (!this.isDrawing) return;

		if (this.ctx) {
			this.ctx.clearRect(0, 0, this.c!.width, this.c!.height); // clear canvas
			this.ctx.beginPath();
			this.ctx.moveTo(this.startX, this.startY);
			this.ctx.lineTo(event.offsetX, event.offsetY);
			this.ctx.stroke();
		}
	}

	private onMouseUp(event: MouseEvent) {
		if (!this.isDrawing) return;

		this.isDrawing = false;
		if (this.ctx) {
			this.ctx.lineTo(event.offsetX, event.offsetY);
			this.ctx.stroke();
		}
	}
}
