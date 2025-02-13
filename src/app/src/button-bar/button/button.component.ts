import { ChangeDetectionStrategy, Component, Input } from "@angular/core";
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

	get iconClasses(): string {
		return `bx ${this.iconClass}`;
	}
}
