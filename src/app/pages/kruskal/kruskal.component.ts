import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
  ViewChild,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatOption } from '@angular/material/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatListModule } from '@angular/material/list';
import { MatSelectModule } from '@angular/material/select';
import { HelpContent } from '@app/models/Help.model';
import { HelpButtonComponent } from '@app/src/help-button';

interface Edge {
  source: number;
  destination: number;
  weight: number;
}

@Component({
  selector: 'app-kruskal',
  imports: [
    FormsModule,
    CommonModule,
    MatCardModule,
    MatFormFieldModule,
    MatListModule,
    MatOption,
    MatSelectModule,
    MatButtonModule,
    MatInputModule,
    HelpButtonComponent,
  ],
  templateUrl: './kruskal.component.html',
  styleUrl: './kruskal.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class KruskalComponent {
  helpContent: HelpContent = {
    title: 'Algoritmo de Kruskal',
    description:
      'El algoritmo de Kruskal es un algoritmo de teoría de grafos para encontrar el árbol de expansión mínima (MST) de un grafo conexo y ponderado. Esto significa que encuentra un subconjunto de las aristas que forma un árbol que incluye todos los vértices, donde el peso total de todas las aristas en el árbol es minimizado.',
    steps: [
      {
        number: 1,
        title: 'Configuración Inicial',
        description:
          'Ingresa el número de vértices que tendrá tu grafo. Este será el número total de nodos que podrás conectar.',
      },
      {
        number: 2,
        title: 'Agregar Aristas',
        description:
          'Agrega las aristas que conectarán los vértices. Para cada arista necesitas especificar:\n- Vértice de origen (1 hasta n)\n- Vértice de destino (1 hasta n)\n- Peso de la arista (cualquier número)',
      },
      {
        number: 3,
        title: 'Seleccionar Modo',
        description:
          'Elige si quieres encontrar el árbol de expansión mínima (minimizar) o máxima (maximizar).',
      },
      {
        number: 4,
        title: 'Ejecutar Algoritmo',
        description:
          "Presiona 'Resolver Kruskal' para que el algoritmo encuentre el árbol de expansión óptimo según el modo seleccionado.",
      },
    ],
    images: [
      {
        url: '/assets/help/kruskal-example.png',
        caption: 'Ejemplo de un árbol de expansión mínima',
        alt: 'Imagen mostrando un grafo antes y después de aplicar Kruskal',
      },
    ],
    tips: [
      'Los vértices se numeran desde 1 hasta N, donde N es el número total de vértices',
      'Asegúrate de que el grafo esté conectado para obtener un árbol de expansión válido',
      'Los pesos pueden ser números positivos o negativos',
      'Puedes visualizar el grafo en tiempo real mientras agregas las aristas',
      "Usa el botón 'Limpiar' para empezar desde cero si necesitas rehacer el grafo",
    ],
  };
  vertices: number = 0;
  edges: Edge[] = [];
  mst: Edge[] = [];

  newSource: number | null = null;
  newDestination: number | null = null;
  newWeight: number | null = null;
  mode: 'min' | 'max' = 'min'; // 'min' por defecto

  private parent: number[] = [];

  @ViewChild('graphCanvas', { static: true })
  canvasRef!: ElementRef<HTMLCanvasElement>;

  private ctx!: CanvasRenderingContext2D;

  constructor(private cdr: ChangeDetectorRef) {}

  ngAfterViewInit() {
    const canvas = this.canvasRef.nativeElement;
    this.ctx = canvas.getContext('2d')!;
    this.drawGraph();
  }

  private find(u: number): number {
    if (this.parent[u] !== u) {
      this.parent[u] = this.find(this.parent[u]);
    }
    return this.parent[u];
  }

  private union(u: number, v: number): void {
    const uRoot = this.find(u);
    const vRoot = this.find(v);
    if (uRoot !== vRoot) {
      this.parent[uRoot] = vRoot;
    }
  }

  public runKruskal(): void {
    if (this.vertices <= 0) return;

    this.parent = Array.from({ length: this.vertices }, (_, i) => i);

    const sortedEdges = [...this.edges].sort((a, b) =>
      this.mode === 'min' ? a.weight - b.weight : b.weight - a.weight,
    );

    const result: Edge[] = [];

    for (const edge of sortedEdges) {
      if (this.find(edge.source) !== this.find(edge.destination)) {
        result.push(edge);
        this.union(edge.source, edge.destination);
      }
    }

    this.mst = result;
    this.cdr.markForCheck();
    this.drawGraph();
  }

  public addEdge(): void {
    if (
      this.newSource !== null &&
      this.newDestination !== null &&
      this.newWeight !== null
    ) {
      // Convertir de 1-based a 0-based
      const adjustedSource = this.newSource - 1;
      const adjustedDestination = this.newDestination - 1;

      this.edges = [
        ...this.edges,
        {
          source: adjustedSource,
          destination: adjustedDestination,
          weight: this.newWeight,
        },
      ];

      this.newSource = null;
      this.newDestination = null;
      this.newWeight = null;
      this.cdr.markForCheck();
      this.drawGraph();
    }
  }

  public clearData(): void {
    this.vertices = 0;
    this.edges = [];
    this.mst = [];
    this.newSource = null;
    this.newDestination = null;
    this.newWeight = null;
    this.cdr.markForCheck();
    this.clearCanvas();
  }

  private drawGraph(): void {
    if (!this.ctx) return;

    this.clearCanvas();

    const centerX = 300;
    const centerY = 300;
    const radius = 200;

    const nodePositions: { [key: number]: { x: number; y: number } } = {};

    // Dibuja nodos en círculo
    for (let i = 0; i < this.vertices; i++) {
      const angle = (2 * Math.PI * i) / this.vertices;
      const x = centerX + radius * Math.cos(angle);
      const y = centerY + radius * Math.sin(angle);
      nodePositions[i] = { x, y };

      // Dibuja nodo
      this.ctx.beginPath();
      this.ctx.arc(x, y, 20, 0, 2 * Math.PI);
      this.ctx.fillStyle = '#ADD8E6'; // azul claro
      this.ctx.fill();
      this.ctx.stroke();

      // Número del nodo
      this.ctx.fillStyle = 'black';
      this.ctx.font = '14px Arial';
      this.ctx.fillText((i + 1).toString(), x - 5, y + 5);
    }

    // Dibuja aristas
    for (const edge of this.edges) {
      const from = nodePositions[edge.source];
      const to = nodePositions[edge.destination];

      if (from && to) {
        // Línea
        this.ctx.beginPath();
        this.ctx.moveTo(from.x, from.y);
        this.ctx.lineTo(to.x, to.y);
        this.ctx.strokeStyle = 'gray';
        this.ctx.stroke();

        // Peso en la mitad
        const midX = (from.x + to.x) / 2;
        const midY = (from.y + to.y) / 2;
        this.ctx.fillStyle = 'black';
        this.ctx.fillText(edge.weight.toString(), midX, midY);
      }
    }
  }

  private clearCanvas(): void {
    if (this.ctx) {
      this.ctx.clearRect(0, 0, 600, 600);
    }
  }

  public onVertexCountChange(): void {
    this.drawGraph();
    this.cdr.markForCheck();
  }
}
