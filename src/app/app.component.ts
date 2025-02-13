import { Component } from "@angular/core";
import { RouterOutlet } from "@angular/router";
import { CanvasComponent } from "./src/canvas";
import { ButtonBarComponent } from "./src";

@Component({
	selector: "app-root",
	imports: [RouterOutlet, CanvasComponent, ButtonBarComponent],
	templateUrl: "./app.component.html",
	styleUrl: "./app.component.scss",
})
export class AppComponent {
	title = "Analisis-Algoritmos";
}
