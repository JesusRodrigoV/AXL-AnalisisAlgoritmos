import {
	ChangeDetectionStrategy,
	Component,
	EventEmitter,
	Output,
} from "@angular/core";
import { ButtonComponent } from "./button";

interface Button {
	iconClass: string;
	text: string;
	action: Function;
}

@Component({
	selector: "app-button-bar",
	imports: [ButtonComponent],
	templateUrl: "./button-bar.component.html",
	styleUrl: "./button-bar.component.scss",
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ButtonBarComponent {
	@Output() moveMode = new EventEmitter<void>();
	@Output() connectionMode = new EventEmitter<void>();
	@Output() removeMode = new EventEmitter<void>();

	protected buttons: Button[] = [
		{
			iconClass: "bx-move",
			text: "Mover vertice",
			action: () => this.moveMode.emit(),
		},
		{
			iconClass: "bx-network-chart",
			text: "Conectar nodos",
			action: () => this.connectionMode.emit(),
		},
		{
			iconClass: "bxs-eraser",
			text: "Borrar vertices",
			action: () => this.removeMode.emit(),
		},
	];
}
