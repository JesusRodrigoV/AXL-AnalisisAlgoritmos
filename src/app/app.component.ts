import { Component } from "@angular/core";
import { RouterOutlet } from "@angular/router";
import { MyCanvasComponent } from "./src/my-canvas";
import { HelpComponent } from './components/help/help.component';
import { AdjacencyMatrixComponent } from "./src/adjacency-matrix/adjacency-matrix.component";

@Component({
	selector: "app-root",
	imports: [RouterOutlet, MyCanvasComponent,HelpComponent],
	templateUrl: "./app.component.html",
	styleUrl: "./app.component.scss",
})
export class AppComponent {
	title = "Analisis-Algoritmos";
}
