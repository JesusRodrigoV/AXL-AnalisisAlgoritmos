import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, ViewChild,  } from '@angular/core';
import { FormsModule } from '@angular/forms';

interface Edge {
  source: number;
  destination: number;
  weight: number;
}

@Component({
  selector: 'app-kruskal',
  imports: [FormsModule,CommonModule],
  templateUrl: './kruskal.component.html',
  styleUrl: './kruskal.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
})
export default class KruskalComponent {
  vertices: number = 0;
  edges: Edge[] = [];
  mst: Edge[] = [];
  @ViewChild('fileInput') fileInputRef!: ElementRef<HTMLInputElement>;

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
      this.mode === 'min' ? a.weight - b.weight : b.weight - a.weight
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

    const nodePositions: { [key: number]: { x: number, y: number } } = {};

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
      this.ctx.fillText((i+1).toString(), x - 5, y + 5);
    }

    // Dibuja aristas
    for (const edge of this.edges) {
      const from = nodePositions[edge.source];
      const to = nodePositions[edge.destination];

      if (from && to) {
        // Determinar si la arista está en el MST
        const isInMST = this.mst.some(
          (e) =>
            (e.source === edge.source && e.destination === edge.destination && e.weight === edge.weight) ||
            (e.source === edge.destination && e.destination === edge.source && e.weight === edge.weight)
        );

        // Línea
        this.ctx.beginPath();
        this.ctx.moveTo(from.x, from.y);
        this.ctx.lineTo(to.x, to.y);
        this.ctx.strokeStyle = isInMST ? 'green' : 'gray';
        this.ctx.lineWidth = isInMST ? 3 : 1;
        this.ctx.stroke();

        // Peso en la mitad
        const midX = (from.x + to.x) / 2;
        const midY = (from.y + to.y) / 2;
        this.ctx.fillStyle = isInMST ? 'green' : 'black';
        this.ctx.font = '14px Arial';
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

  public exportData(): void {
    const data = {
      vertices: this.vertices,
      edges: this.edges,
      mode: this.mode,
    };

    const fileName = prompt('Ingresa el nombre del archivo (sin extensión):', 'grafo') || 'grafo';
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = `${fileName}.json`;
    a.click();

    URL.revokeObjectURL(url);
  }

  public triggerFileInput(): void {
    this.fileInputRef.nativeElement.click();
  }

  public importData(event: Event): void {
    const input = event.target as HTMLInputElement;

    if (!input.files || input.files.length === 0) return;

    const file = input.files[0];
    const reader = new FileReader();

    reader.onload = () => {
      try {
        const json = JSON.parse(reader.result as string);
        if (
          typeof json.vertices === 'number' &&
          Array.isArray(json.edges)
        ) {
          this.vertices = json.vertices;
          this.edges = json.edges;
          this.mst = [];
          this.drawGraph();
          this.cdr.markForCheck();
        } else {
          alert('Archivo inválido: estructura incorrecta.');
        }
      } catch (error) {
        alert('Error al leer el archivo JSON.');
      }
    };

    reader.readAsText(file);
  }
}
