import { Component } from "@angular/core";
import { RouterOutlet } from "@angular/router";
import { MyCanvasComponent } from "./src/my-canvas";

@Component({
	selector: "app-root",
	imports: [RouterOutlet, MyCanvasComponent],
	templateUrl: "./app.component.html",
	styleUrl: "./app.component.scss",
})
export class AppComponent {
	title = "Analisis-Algoritmos";
}
