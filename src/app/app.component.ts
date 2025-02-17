import { Component } from "@angular/core";
import { RouterOutlet } from "@angular/router";
import { CanvasComponent } from "./src/canvas";
import { ButtonBarComponent } from "./src";
import { GraphsComponent } from "./src/graphs/graphs.component";
import { MyCanvasComponent } from "./src/my-canvas";
import { AyudaComponent } from "./ayuda/ayuda.component"; // Importa AyudaComponent
import { CommonModule } from "@angular/common"; // Importa CommonModule para usar *ngIf, *ngFor, etc.

@Component({
	selector: "app-root",
	standalone: true, // Marca el componente como standalone
	imports: [
		CommonModule, // Agrega CommonModule
		RouterOutlet,
		CanvasComponent,
		ButtonBarComponent,
		GraphsComponent,
		MyCanvasComponent,
		AyudaComponent, // Agrega AyudaComponent a los imports
	],
	templateUrl: "./app.component.html",
	styleUrl: "./app.component.scss",
})
export class AppComponent {
	title = "Analisis-Algoritmos";
}