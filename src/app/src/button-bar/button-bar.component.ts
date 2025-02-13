import { ChangeDetectionStrategy, Component } from "@angular/core";
import { ButtonComponent } from "./button";

interface Button {
	iconClass: string;
	text: string;
}

@Component({
	selector: "app-button-bar",
	imports: [ButtonComponent],
	templateUrl: "./button-bar.component.html",
	styleUrl: "./button-bar.component.scss",
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ButtonBarComponent {
	protected buttons: Button[] = [
		{
			iconClass: "bx-move",
			text: "Mover vertice",
		},
		{
			iconClass: "bx-network-chart",
			text: "Conectar nodos",
		},
		{
			iconClass: "bxs-eraser",
			text: "Borrar vertices",
		},
	];
}
