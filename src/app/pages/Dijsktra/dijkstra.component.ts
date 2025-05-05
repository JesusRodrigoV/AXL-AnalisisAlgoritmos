import { ChangeDetectionStrategy, Component, ElementRef, ViewChild, inject, OnInit, AfterViewInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Conexion } from '@app/models/Conexion.model';
import { Nodo } from '@app/models/Nodo.model';
import { MatMenuModule } from '@angular/material/menu';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatCardModule } from '@angular/material/card';
import { ColorService } from '@app/services/color';
import { ExportImportService } from '@app/services/export-import';
import { UndoRedoService } from '@app/services/undo-redo';
import { ButtonBarComponent } from '@app/src/button-bar';
import { AdjacencyMatrixComponent } from '@app/src/adjacency-matrix';
import { HelpButtonComponent } from '@app/src/help-button';
import { HelpContent } from '@app/models/Help.model';
import { ModalContentComponent } from '@app/src/my-canvas/modal-content';

@Component({
  selector: 'app-dijkstra',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    FormsModule,
    MatMenuModule,
    MatIconModule,
    MatSelectModule,
    MatFormFieldModule,
    MatInputModule,
    MatCardModule,
    ButtonBarComponent,
    AdjacencyMatrixComponent,
    HelpButtonComponent,
    ModalContentComponent,
  ],
  templateUrl: './dijkstra.component.html',
  styleUrl: './dijkstra.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class DijkstraComponent implements OnInit, AfterViewInit, OnDestroy {
  private colorService: ColorService = inject(ColorService);
  private exportImportService: ExportImportService = inject(ExportImportService);
  private undoRedoService: UndoRedoService = inject(UndoRedoService);
  private cdr: ChangeDetectorRef = inject(ChangeDetectorRef);

  canvasWidth: number = 0;
  canvasHeight: number = 0;
  private resizeObserver!: ResizeObserver;

  @ViewChild('myCanvas', { static: true })
  canvas!: ElementRef<HTMLCanvasElement>;

  @ViewChild('canvasContainer', { static: true })
  canvasContainer!: ElementRef;

  readonly dialog = inject(MatDialog);
  modes: { [key: string]: boolean } = {
    move: false,
    delete: false,
    connect: false,
    add: false,
    edit: false,
    selectStart: false,
    selectEnd: false
  };
  modoConexion: boolean = false;
  private contador: number = 0;
  public nodos: Nodo[] = [];
  public conexiones: Conexion[] = [];
  arcoDirigido = false;
  peso = 0;
  private primerNodoSeleccionado: number | null = null;
  private segundoNodoSeleccionado: number | null = null;
  mostrarModal = false;
  colorFondo: string = '#ffffff';
  private readonly NODO_RADIO_BASE: number = 30;
  private radio: number = this.NODO_RADIO_BASE;

  // Nodo de inicio y fin para Dijkstra
  nodoInicio: number | null = null;
  nodoFin: number | null = null;

  helpContent: HelpContent = {
    title: 'Funcionalidades del Algoritmo de Dijkstra',
    description:
      'Guía de las principales funcionalidades disponibles en el simulador de Dijkstra.',

    steps: [
      {
        number: 1,
        title: 'Creación de Nodos',
        description: 'Haz doble clic en el canvas para crear nuevos nodos:',
        image: 'assets/conexion.png',
      },
      {
        number: 2,
        title: 'Conexión de Nodos',
        description: 'Usa el modo conexión para crear aristas entre nodos:',
        image: 'assets/export.png',
      },
      {
        number: 3,
        title: 'Selección de Nodos',
        description: 'Selecciona el nodo de inicio y fin para el algoritmo:',
        image: 'assets/import.png',
      },
      {
        number: 4,
        title: 'Ejecución del Algoritmo',
        description: 'Presiona el botón de ejecutar para encontrar el camino más corto:',
        image: 'assets/clean.png',
      },
    ],

    tips: [
      'Usa el modo conexión para crear relaciones entre nodos de manera visual',
      'Asegúrate de asignar pesos a las conexiones para obtener resultados precisos',
      'El camino más corto se mostrará en verde en el canvas',
      'Puedes exportar tu grafo para guardar tu trabajo',
      'Confirma siempre antes de eliminar elementos importantes',
    ],

    images: [
      {
        url: 'assets/conexion.png',
        caption: 'Modo Conexión - Creación de relaciones entre nodos',
        alt: 'Demostración del modo conexión',
      },
      {
        url: 'assets/clean.png',
        caption: 'Función de Limpieza - Reinicio del editor',
        alt: 'Botón de limpiar editor',
      },
    ],
  };

  constructor() {
    this.resizeObserver = new ResizeObserver(entries => {
      for (const entry of entries) {
        if (entry.target === this.canvasContainer.nativeElement) {
          this.canvasWidth = entry.contentRect.width;
          this.canvasHeight = entry.contentRect.height;
          const ctx = this.canvas.nativeElement.getContext('2d');
          if (ctx) {
            this.dibujarNodo(ctx);
          }
        }
      }
    });
  }

  ngOnInit() {
    this.canvasWidth = 800;
    this.canvasHeight = 600;
    this.contador = 0;
  }

  ngAfterViewInit() {
    if (this.canvasContainer) {
      this.resizeObserver.observe(this.canvasContainer.nativeElement);
    }
  }

  ngOnDestroy() {
    this.resizeObserver.disconnect();
  }

  onModeToggled(mode: string) {
    this.modes[mode] = !this.modes[mode];
  }

  menuContexto(event: MouseEvent) {
    event.preventDefault();
  }

  exportar() {
    const estado = {
      nodos: this.nodos,
      conexiones: this.conexiones
    };
    const blob = new Blob([JSON.stringify(estado)], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'dijkstra-graph.json';
    a.click();
    window.URL.revokeObjectURL(url);
  }

  seleccionarArchivo() {
    const fileInput = document.getElementById('fileInput') as HTMLInputElement;
    fileInput.click();
  }

  onFileSelected(event: Event) {
    const fileInput = event.target as HTMLInputElement;
    const file = fileInput.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const estado = JSON.parse(e.target?.result as string);
          this.nodos = estado.nodos;
          this.conexiones = estado.conexiones;
          this.contador = Math.max(...this.nodos.map(n => n.contador), 0);
          this.nodoInicio = null;
          this.nodoFin = null;
          this.redibujarCanvas();
        } catch (error) {
          console.error('Error al cargar el archivo:', error);
        }
      };
      reader.readAsText(file);
    }
  }

  limpiarCanvas() {
    this.nodos = [];
    this.conexiones = [];
    this.nodoInicio = null;
    this.nodoFin = null;
    this.contador = 0;
    this.redibujarCanvas();
  }

  dobleClickCanvas(event: MouseEvent): void {
    const canvas = <HTMLCanvasElement>event.target;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      const rect = canvas.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;
      
      this.contador++;
      const nombreNodo = String.fromCharCode(64 + this.contador); // A = 65, B = 66, etc.
      
      const nuevoNodo = new Nodo(
        x,
        y,
        this.NODO_RADIO_BASE,
        this.contador,
        false,
        nombreNodo,
        0,
        '#2196f3'
      );
      
      this.nodos = [...this.nodos, nuevoNodo];
      this.dibujarNodo(ctx);
      this.guardarEstado();
      this.cdr.detectChanges();
    }
  }

  clickCanvas(event: MouseEvent): void {
    const canvas = <HTMLCanvasElement>event.target;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      const rect = canvas.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;

      if (this.modes['selectStart']) {
        this.seleccionarNodoInicio(x, y);
      } else if (this.modes['selectEnd']) {
        this.seleccionarNodoFin(x, y);
      } else if (this.modes['connect']) {
        this.manejarConexion(x, y, ctx);
      } else if (this.modes['delete']) {
        this.manejarEliminacion(x, y, ctx);
      }
    }
  }

  private manejarConexion(x: number, y: number, ctx: CanvasRenderingContext2D): void {
    const nodoSeleccionado = this.nodos.find(
      (nodo) =>
        Math.sqrt(Math.pow(x - nodo.x, 2) + Math.pow(y - nodo.y, 2)) <
        nodo.radio,
    );
    if (nodoSeleccionado) {
      if (this.primerNodoSeleccionado === null) {
        this.primerNodoSeleccionado = nodoSeleccionado.contador;
        nodoSeleccionado.selected = true;
      } else {
        if (nodoSeleccionado.contador === this.primerNodoSeleccionado) {
          alert('No se puede conectar un nodo consigo mismo');
          this.limpiarSeleccion();
          return;
        }

        const existeConexion = this.conexiones.some(
          (conn) =>
            (conn.desde === this.primerNodoSeleccionado &&
              conn.hasta === nodoSeleccionado.contador) ||
            (conn.desde === nodoSeleccionado.contador &&
              conn.hasta === this.primerNodoSeleccionado),
        );

        if (existeConexion) {
          alert('Ya existe una conexión entre estos nodos');
          this.limpiarSeleccion();
          return;
        }

        this.segundoNodoSeleccionado = nodoSeleccionado.contador;
        this.showModal(this.primerNodoSeleccionado, this.segundoNodoSeleccionado);
      }
      this.dibujarNodo(ctx);
      this.guardarEstado();
    }
  }

  private manejarEliminacion(x: number, y: number, ctx: CanvasRenderingContext2D): void {
    const nodoIndex = this.nodos.findIndex(
      (circulo) =>
        Math.sqrt(Math.pow(x - circulo.x, 2) + Math.pow(y - circulo.y, 2)) <=
        circulo.radio,
    );

    if (nodoIndex !== -1) {
      const nodoEliminado = this.nodos[nodoIndex];

      // Eliminar todas las conexiones relacionadas con el nodo
      this.conexiones = this.conexiones.filter(
        (conexion) =>
          conexion.desde !== nodoEliminado.contador &&
          conexion.hasta !== nodoEliminado.contador,
      );

      // Eliminar el nodo
      this.nodos.splice(nodoIndex, 1);

      // Actualizar los contadores y nombres de los nodos restantes
      this.nodos.forEach((nodo, index) => {
        const nuevoContador = index + 1;
        const letra = String.fromCharCode(64 + nuevoContador); // A = 65, B = 66, etc.
        nodo.contador = nuevoContador;
        nodo.nombre = letra;
      });

      // Actualizar las conexiones para reflejar los nuevos contadores
      this.conexiones.forEach(conexion => {
        const nodoDesde = this.nodos.find(n => n.contador === conexion.desde);
        const nodoHasta = this.nodos.find(n => n.contador === conexion.hasta);
        if (nodoDesde) conexion.desde = nodoDesde.contador;
        if (nodoHasta) conexion.hasta = nodoHasta.contador;
      });

      this.contador = this.nodos.length;
      this.dibujarNodo(ctx);
      this.guardarEstado();
    }
  }

  private limpiarSeleccion(): void {
    this.primerNodoSeleccionado = null;
    this.segundoNodoSeleccionado = null;
    this.nodos.forEach(nodo => nodo.selected = false);
    const ctx = this.canvas.nativeElement.getContext('2d');
    if (ctx) {
      this.dibujarNodo(ctx);
    }
  }

  dibujarNodo(ctx: CanvasRenderingContext2D): void {
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

    this.radio = this.NODO_RADIO_BASE;

    ctx.fillStyle = this.colorFondo;
    ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);

    this.conexiones.forEach((conexion) => {
      const desde = this.nodos.find((c) => c.contador === conexion.desde);
      const hasta = this.nodos.find((c) => c.contador === conexion.hasta);
      if (desde && hasta) {
        ctx.beginPath();
        let dx = hasta.x - desde.x;
        let dy = hasta.y - desde.y;
        let distancia = Math.sqrt(dx * dx + dy * dy);
        let radio = 20;
        let offsetX = (dx / distancia) * radio;
        let offsetY = (dy / distancia) * radio;
        let startX = desde.x + offsetX;
        let startY = desde.y + offsetY;
        let endX = hasta.x - offsetX * 1.5;
        let endY = hasta.y - offsetY * 1.5;

        ctx.moveTo(startX, startY);
        ctx.lineTo(endX, endY);
        ctx.strokeStyle = conexion.color || '#666';
        ctx.lineWidth = 2;
        ctx.stroke();

        const angle = Math.atan2(dy, dx);
        const arrowLength = 15;
        const arrowAngle = Math.PI / 6;

        const arrowX = endX;
        const arrowY = endY;

        ctx.beginPath();
        ctx.moveTo(arrowX, arrowY);
        ctx.lineTo(
          arrowX - arrowLength * Math.cos(angle - arrowAngle),
          arrowY - arrowLength * Math.sin(angle - arrowAngle)
        );
        ctx.moveTo(arrowX, arrowY);
        ctx.lineTo(
          arrowX - arrowLength * Math.cos(angle + arrowAngle),
          arrowY - arrowLength * Math.sin(angle + arrowAngle)
        );
        ctx.strokeStyle = conexion.color || '#666';
        ctx.lineWidth = 2;
        ctx.stroke();

        const midX = (startX + endX) / 2;
        const midY = (startY + endY) / 2;
        ctx.fillStyle = 'white';
        ctx.fillRect(midX - 10, midY - 10, 20, 20);
        ctx.font = '12px Arial';
        ctx.fillStyle = 'black';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(conexion.peso.toString(), midX, midY);
      }
    });

    this.nodos.forEach((circulo) => {
      ctx.beginPath();
      ctx.arc(circulo.x, circulo.y, circulo.radio, 0, Math.PI * 2);
      ctx.fillStyle = circulo.selected ? '#ff9800' : 
                     circulo.contador === this.nodoInicio ? '#4caf50' : 
                     circulo.contador === this.nodoFin ? '#f44336' : 
                     circulo.color;
      ctx.fill();
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.font = '20px Source Sans Pro,Arial,sans-serif';
      ctx.fillStyle = 'black';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(
        circulo.nombre,
        circulo.x,
        circulo.y,
      );
    });
  }

  ejecutarDijkstra(): void {
    if (this.nodoInicio === null || this.nodoFin === null) {
      alert('Por favor, seleccione un nodo de inicio y un nodo de fin');
      return;
    }

    const distancias: { [key: number]: number } = {};
    const previos: { [key: number]: number | null } = {};
    const noVisitados = new Set<number>();

    this.nodos.forEach((nodo) => {
      distancias[nodo.contador] = Infinity;
      previos[nodo.contador] = null;
      noVisitados.add(nodo.contador);
    });
    distancias[this.nodoInicio] = 0;

    while (noVisitados.size > 0) {
      let nodoActual = -1;
      let menorDistancia = Infinity;
      noVisitados.forEach((nodo) => {
        if (distancias[nodo] < menorDistancia) {
          menorDistancia = distancias[nodo];
          nodoActual = nodo;
        }
      });

      if (nodoActual === -1) break;
      noVisitados.delete(nodoActual);

      if (nodoActual === this.nodoFin) break;

      this.conexiones.forEach((conexion) => {
        if (conexion.desde === nodoActual) {
          const nuevaDistancia = distancias[nodoActual] + conexion.peso;
          if (nuevaDistancia < distancias[conexion.hasta]) {
            distancias[conexion.hasta] = nuevaDistancia;
            previos[conexion.hasta] = nodoActual;
          }
        }
      });
    }

    // Actualizar los nombres de los nodos con sus distancias
    this.nodos.forEach(nodo => {
      if (distancias[nodo.contador] !== Infinity) {
        nodo.nombre = distancias[nodo.contador].toString();
      }
    });

    const camino: number[] = [];
    let actual = this.nodoFin;
    while (actual !== null) {
      camino.unshift(actual);
      actual = previos[actual]!;
    }

    // Dibujar el camino más corto en verde
    const ctx = this.canvas.nativeElement.getContext('2d');
    if (ctx) {
      // Primero dibujar todo el grafo
      this.dibujarNodo(ctx);
      
      // Luego dibujar el camino más corto en verde
      for (let i = 0; i < camino.length - 1; i++) {
        const desde = this.nodos.find(n => n.contador === camino[i]);
        const hasta = this.nodos.find(n => n.contador === camino[i + 1]);
        if (desde && hasta) {
          ctx.beginPath();
          ctx.moveTo(desde.x, desde.y);
          ctx.lineTo(hasta.x, hasta.y);
          ctx.strokeStyle = '#00ff00';
          ctx.lineWidth = 3;
          ctx.stroke();
        }
      }
    }

    alert(`La distancia mínima es: ${distancias[this.nodoFin]}`);
  }

  seleccionarNodoInicio(x: number, y: number): void {
    const nodoSeleccionado = this.nodos.find(
      (nodo) =>
        Math.sqrt(Math.pow(x - nodo.x, 2) + Math.pow(y - nodo.y, 2)) <
        nodo.radio
    );
    if (nodoSeleccionado) {
      this.nodoInicio = nodoSeleccionado.contador;
      this.modes['selectStart'] = false;
      const ctx = this.canvas.nativeElement.getContext('2d');
      if (ctx) {
        this.dibujarNodo(ctx);
      }
    }
  }

  seleccionarNodoFin(x: number, y: number): void {
    const nodoSeleccionado = this.nodos.find(
      (nodo) =>
        Math.sqrt(Math.pow(x - nodo.x, 2) + Math.pow(y - nodo.y, 2)) <
        nodo.radio
    );
    if (nodoSeleccionado) {
      this.nodoFin = nodoSeleccionado.contador;
      this.modes['selectEnd'] = false;
      const ctx = this.canvas.nativeElement.getContext('2d');
      if (ctx) {
        this.dibujarNodo(ctx);
      }
    }
  }

  onNodeSelectionChange() {
    this.cdr.detectChanges();
  }

  private guardarEstado(): void {
    this.undoRedoService.guardarEstado(
      [...this.nodos],
      [...this.conexiones],
      this.contador
    );
  }

  redibujarCanvas() {
    const ctx = this.canvas.nativeElement.getContext('2d');
    if (ctx) {
      this.dibujarNodo(ctx);
    }
  }

  showModal(desde: number, hasta: number): void {
    const dialogRef = this.dialog.open(ModalContentComponent, {
      width: '400px',
      data: {
        peso: 0,
        dirigido: false,
        showDirectedOption: true
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        const nuevaConexion = new Conexion(desde, hasta, result.peso, result.dirigido);
        this.conexiones.push(nuevaConexion);
        const ctx = this.canvas.nativeElement.getContext('2d');
        if (ctx) {
          this.dibujarNodo(ctx);
        }
        this.limpiarSeleccion();
      } else {
        this.limpiarSeleccion();
      }
    });
  }
}
