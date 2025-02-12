import { Component } from "@angular/core";
import { RouterOutlet } from "@angular/router";
import { GraphComponent } from "./src/graph";
import { CanvasComponent } from "./src/canvas";

@Component({
	selector: "app-root",
	imports: [RouterOutlet, GraphComponent, CanvasComponent],
	templateUrl: "./app.component.html",
	styleUrl: "./app.component.scss",
})
export class AppComponent {
	title = "Analisis-Algoritmos";
}
