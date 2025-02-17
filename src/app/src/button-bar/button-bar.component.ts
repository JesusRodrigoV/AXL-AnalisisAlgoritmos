import {
	ChangeDetectionStrategy,
	Component,
	EventEmitter,
	Output,
} from "@angular/core";
import { ButtonComponent } from "./button";

interface Button {
	id: string;
	label: string;
	iconClass: string;
	text: string;
	active: boolean;
}

@Component({
	selector: "app-button-bar",
	imports: [ButtonComponent],
	templateUrl: "./button-bar.component.html",
	styleUrl: "./button-bar.component.scss",
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ButtonBarComponent {
	@Output() modeToggled = new EventEmitter<{ id: string; active: boolean }>();

	protected buttons: Button[] = [
		{
			id: "move",
			label: "Move",
			iconClass: "bx-move",
			text: "Mover vertice",
			active: false,
		},
		{
			id: "delete",
			label: "Delete",
			iconClass: "bxs-eraser",
			text: "Borrar vertices",
			active: false,
		},
	];

	toggleMode(button: Button) {
		button.active = !button.active;
		if (button.active) {
			this.buttons.forEach((b) => {
				if (b.id !== button.id) {
					b.active = false;
				}
			});
		}
		this.modeToggled.emit({ id: button.id, active: true });
	}
}
