import { ChangeDetectionStrategy, Component, Input } from "@angular/core";

@Component({
	selector: "app-button",
	imports: [],
	templateUrl: "./button.component.html",
	styleUrl: "./button.component.scss",
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ButtonComponent {
	@Input() iconClass = "";
	@Input() text = "";
}
