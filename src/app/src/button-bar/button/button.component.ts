import { NgStyle } from "@angular/common";
import {
	ChangeDetectionStrategy,
	Component,
	EventEmitter,
	Input,
	Output,
} from "@angular/core";
import { MatButtonModule } from "@angular/material/button";
import { TooltipPosition, MatTooltipModule } from "@angular/material/tooltip";

@Component({
	selector: "app-button",
	imports: [MatButtonModule, MatTooltipModule, NgStyle],
	templateUrl: "./button.component.html",
	styleUrl: "./button.component.scss",
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ButtonComponent {
	@Input() label: string = "";
	@Input() iconClass = "";
	@Input() text = "";
	@Input({ required: true }) active: boolean = false;
	@Output() clicked = new EventEmitter<void>();

	onClick(): void {
		this.clicked.emit();
	}
	get iconClasses(): string {
		return `bx ${this.iconClass}`;
	}
}
