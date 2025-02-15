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
	mode: boolean;
}

@Component({
	selector: "app-button-bar",
	imports: [ButtonComponent],
	templateUrl: "./button-bar.component.html",
	styleUrl: "./button-bar.component.scss",
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ButtonBarComponent {
	@Output() moveModeToggled = new EventEmitter<boolean>();
	@Output() deleteModeToggled = new EventEmitter<boolean>();

	moveMode = false;
	deleteMode = false;

	toggleMoveMode() {
		this.moveMode = !this.moveMode;
		if (this.moveMode) {
			this.deleteMode = false;
		}
		this.moveModeToggled.emit(this.moveMode);
	}

	toggleDeleteMode() {
		this.deleteMode = !this.deleteMode;
		if (this.deleteMode) {
			this.moveMode = false;
		}
		this.deleteModeToggled.emit(this.deleteMode);
	}
	protected buttons: Button[] = [
		{
			iconClass: "bx-move",
			text: "Mover vertice",
			mode: this.moveMode,
		},
		{
			iconClass: "bxs-eraser",
			text: "Borrar vertices",
			mode: this.deleteMode,
		},
	];
}
