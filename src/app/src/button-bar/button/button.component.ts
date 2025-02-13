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
	imports: [MatButtonModule, MatTooltipModule],
	templateUrl: "./button.component.html",
	styleUrl: "./button.component.scss",
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ButtonComponent {
	@Input({ required: true }) iconClass = "";
	@Input({ required: true }) text = "";
	@Output() clicked = new EventEmitter<void>();

	onClick(): void {
		this.clicked.emit();
	}
	get iconClasses(): string {
		return `bx ${this.iconClass}`;
	}
}
