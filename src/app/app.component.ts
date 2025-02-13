import { Component } from "@angular/core";
import { RouterOutlet } from "@angular/router";
import { CanvasComponent } from "./src/canvas";
import { ButtonBarComponent } from "./src";
import { GraphsComponent } from "./src/graphs/graphs.component";
import { MyCanvasComponent } from "./src/my-canvas";

@Component({
	selector: "app-root",
	imports: [
		RouterOutlet,
		CanvasComponent,
		ButtonBarComponent,
		GraphsComponent,
		MyCanvasComponent,
	],
	templateUrl: "./app.component.html",
	styleUrl: "./app.component.scss",
})
export class AppComponent {
	title = "Analisis-Algoritmos";
}
