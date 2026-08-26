import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
  EventEmitter,
  HostListener,
  inject,
  Input,
  Output,
  ViewChild,
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { ModalContentComponent } from './modal-content';
import { ButtonBarComponent } from '../button-bar';
import { FormsModule } from '@angular/forms';
import { Conexion, Nodo } from '@app/models';
import { MatMenu, MatMenuModule, MatMenuTrigger } from '@angular/material/menu';
import { ColorService } from '@app/services/color';
import { ExportImportService } from '@app/services/export-import';
import { GraphStoreService } from '@app/shared/services/graph-store.service';
import { GraphRenderer } from '@app/shared/services/graph-renderer.service';
import { ExportModalComponent } from '../export-modal';
import {
  puntoCercaDeLinea,
  puntoCercaDeCurva,
  puntoCercaDeBucle,
  puntoEnNodoOMenos,
} from '@app/shared/services/graph-geometry';

@Component({
  selector: 'app-my-canvas',
  imports: [
    MatButtonModule,
    ButtonBarComponent,
    FormsModule,
    MatMenuModule,
  ],
  templateUrl: './my-canvas.component.html',
  styleUrl: './my-canvas.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MyCanvasComponent {
  private cdr: ChangeDetectorRef = inject(ChangeDetectorRef);
  private colorService: ColorService = inject(ColorService);
  private exportImportService: ExportImportService =
    inject(ExportImportService);
  readonly store = inject(GraphStoreService);
  private renderer = inject(GraphRenderer);

  canvasWidth: number = 0;
  canvasHeight: number = 0;

  @Input() forceDirected: boolean = false; // Para forzar conexiones dirigidas

  @ViewChild('canvasMenu') canvasMenu!: MatMenu;
  @ViewChild('nodeMenu') nodeMenu!: MatMenu;
  @ViewChild('connectionMenu') connectionMenu!: MatMenu;
  @ViewChild('menuTrigger') menuTrigger!: MatMenuTrigger;
  menuPosition = { x: '0', y: '0' };
  selectedElement: {
    type: 'node' | 'connection' | 'canvas';
    data: any;
  } | null = null;

  @ViewChild('myCanvas', { static: true })
  canvas!: ElementRef<HTMLCanvasElement>;

  @ViewChild('canvasContainer', { static: true })
  canvasContainer!: ElementRef;
  @ViewChild('fileInput', { static: false })
  fileInput!: ElementRef<HTMLInputElement>;
  readonly dialog = inject(MatDialog);
  modes: { [key: string]: boolean } = {
    move: false,
    delete: false,
    connect: false,
    add: false,
    edit: false,
  };
  modoConexion: boolean = false;
  arcoDirigido = false;
  peso = 0;
  mostrarModal = false;
  colorFondo: string = '#ffffff';
  private readonly NODO_RADIO_BASE: number = 30; // Radio base fijo para los nodos
  private radio: number = this.NODO_RADIO_BASE; // Radio actual que se usará para dibujar

  @Output() actualizarMatriz = new EventEmitter<void>();
  @Output() nodosActualizados = new EventEmitter<Nodo[]>();
  @Output() conexionActualizada = new EventEmitter<Conexion[]>();

  // Maneja el cambio de modo de la herramienta seleccionada
  onModeToggled(event: { id: string; active: boolean }) {
    Object.keys(this.modes).forEach((key) => {
      this.modes[key] = false;
    });

    this.modes[event.id] = event.active;
    this.store.limpiarSeleccion();

    const ctx = this.canvas.nativeElement?.getContext('2d');
    if (ctx) {
      this.dibujarNodo(ctx);
    }
    this.store.saveSnapshot();
  }

  // Crea un nuevo nodo en la posición donde se realizó doble clic
  dobleClickCanvas(event: MouseEvent): void {
    const canvas = <HTMLCanvasElement>event.target;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      const rect = canvas.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;
      this.store.addNodoAt(x, y, this.radio);
      this.dibujarNodo(ctx);
    }
  }

  // Maneja los eventos de clic en el canvas para diferentes modos (conexión, eliminación)
  clickCanvas(event: MouseEvent): void {
    const canvas = <HTMLCanvasElement>event.target;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      const rect = canvas.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;
      if (this.modes['connect']) {
        this.manejarConexion(x, y, ctx);
      } else if (this.modes['delete']) {
        this.manejarEliminacion(x, y, ctx);
      }
    }
  }

  // Gestiona la selección de nodos para crear conexiones entre ellos
  private manejarConexion(
    x: number,
    y: number,
    ctx: CanvasRenderingContext2D,
  ): void {
    const result = this.store.trySelectForConnection(x, y, true);
    if (!result || !result.found) {
      this.dibujarNodo(ctx);
      return;
    }

    if (result.desde === result.hasta && result.desde !== 0) {
      alert('No se puede conectar un nodo consigo mismo');
      this.limpiarSeleccion();
      this.dibujarNodo(ctx);
      return;
    }

    if (!result.ready && result.desde !== 0) {
      alert('Ya existe una conexión entre estos nodos');
      this.limpiarSeleccion();
      this.dibujarNodo(ctx);
      return;
    }

    if (result.ready) {
      this.showModal();
    }

    this.dibujarNodo(ctx);
    this.actualizarMatriz.emit();
    this.store.saveSnapshot();
  }

  // Elimina nodos y sus conexiones asociadas o elimina conexiones individuales
  private manejarEliminacion(
    x: number,
    y: number,
    ctx: CanvasRenderingContext2D,
  ): void {
    const nodoIndex = this.store.nodos().findIndex(
      (circulo) => puntoEnNodoOMenos(x, y, circulo.x, circulo.y, circulo.radio),
    );

    if (nodoIndex !== -1) {
      const nodoEliminado = this.store.nodos()[nodoIndex];
      this.store.removeNodo(nodoEliminado.contador);
    } else {
      const conexion = this.store.conexiones().find((c) => {
        const desde = this.store.nodos().find((n) => n.contador === c.desde);
        const hasta = this.store.nodos().find((n) => n.contador === c.hasta);
        if (desde && hasta) {
          return this.estaCercaDeConexion(
            x,
            y,
            desde.x,
            desde.y,
            hasta.x,
            hasta.y,
            c,
          );
        }
        return false;
      });

      if (conexion) {
        this.store.removeConexion(conexion.desde, conexion.hasta);
      }
    }
    this.dibujarNodo(ctx);
    this.actualizarMatriz.emit();
  }

  // Verifica si un punto (x,y) está cerca de una conexión, ya sea recta o curva
  private estaCercaDeConexion(
    x: number,
    y: number,
    x1: number,
    y1: number,
    x2: number,
    y2: number,
    conexion: { desde: number; hasta: number },
  ): boolean {
    // Si es una autoconexión (bucle)
    if (conexion.desde === conexion.hasta) {
      const nodo = this.store.nodos().find((n) => n.contador === conexion.desde);
      if (nodo) {
        const pesoX = nodo.x;
        const pesoY = nodo.y - nodo.radio * 2;
        const distanciaPeso = Math.sqrt(
          Math.pow(x - pesoX, 2) + Math.pow(y - pesoY, 2),
        );
        if (distanciaPeso <= 10) {
          return true;
        }
        return puntoCercaDeBucle(x, y, nodo.x, nodo.y, nodo.radio);
      }
      return false;
    }

    const bidireccional = this.store.conexiones().some(
      (c) => c.desde === conexion.hasta && c.hasta === conexion.desde,
    );
    if (bidireccional) {
      const controlX = (x1 + x2) / 2 + (y1 - y2) * 0.3;
      const controlY = (y1 + y2) / 2 + (x2 - x1) * 0.3;
      return puntoCercaDeCurva(x, y, x1, y1, controlX, controlY, x2, y2);
    }
    return puntoCercaDeLinea(x, y, x1, y1, x2, y2);
  }

  // Crea una nueva conexión entre dos nodos seleccionados
  confirmarConexion(datos: { peso: number; dirigido: boolean }) {
    const desde = this.store.primerNodoSeleccionado();
    const hasta = this.store.segundoNodoSeleccionado();
    if (desde !== null && hasta !== null) {
      const nuevaConexion = new Conexion(
        desde,
        hasta,
        datos.peso,
        this.forceDirected ? true : datos.dirigido,
      );
      this.store.addConexion(nuevaConexion);

      const nodoOrigen = this.store.nodos().find(
        (n) => n.contador === desde,
      );
      if (nodoOrigen) {
        nodoOrigen.esOrigen = true;
      }
    }
    this.limpiarSeleccion();
    this.actualizarMatriz.emit();
  }

  cancelarConexion() {
    this.limpiarSeleccion();
  }

  //Limpia el estado de selección de nodos y actualiza el canvas
  private limpiarSeleccion() {
    this.store.limpiarSeleccion();
    this.mostrarModal = false;

    const ctx = this.canvas.nativeElement?.getContext('2d');
    if (ctx) {
      this.dibujarNodo(ctx);
    }
    this.actualizarMatriz.emit();
  }

  //Dibuja todos los nodos y conexiones en el canvas
  dibujarNodo(ctx: CanvasRenderingContext2D): void {
    const minDimension = Math.min(ctx.canvas.width, ctx.canvas.height);
    this.radio = Math.min(this.NODO_RADIO_BASE, minDimension / 20);
    this.radio = Math.max(this.radio, 20);

    this.renderer.clearAndFill(ctx, ctx.canvas, this.colorFondo);
    this.renderer.drawConnections(ctx, this.store.conexiones(), this.store.nodos(), 'curve');
    this.renderer.drawNodes(ctx, this.store.nodos(), (nodo) =>
      nodo.selected ? '#ff9800' : nodo.color
    );

    if (this.store.nodos().length > 0) {
      this.nodosActualizados.emit([...this.store.nodos()]);
    }
    if (this.store.conexiones().length > 0) {
      this.conexionActualizada.emit([...this.store.conexiones()]);
    }
    this.actualizarMatriz.emit();
  }
  // Cambia el color de fondo del canvas
  cambiarColorFondo(): void {
    this.colorService.cambiarColorFondo(
      this.canvas.nativeElement,
      this.colorFondo,
      (color: string) => {
        this.colorFondo = color;
        const ctx = this.canvas.nativeElement.getContext('2d');
        if (ctx) {
          this.dibujarNodo(ctx);
        }

        this.store.saveSnapshot();
      },
    );
  }
  //Cambiar el color de un nodo
  cambiarColorNodo(): void {
    if (this.selectedElement?.type === 'node') {
      this.colorService.cambiarColorNodo(this.selectedElement.data, () => {
        const ctx = this.canvas.nativeElement.getContext('2d');
        if (ctx) {
          this.dibujarNodo(ctx);
        }

        this.store.saveSnapshot();
      });
    }
  }

  // Abre un modal para configurar una nueva conexión
  showModal(): void {
    const dialogRef = this.dialog.open(ModalContentComponent, {
      height: '265px',
      width: '200px',
      data: {
        peso: this.peso,
        dirigido: this.forceDirected ? true : this.arcoDirigido,
        showDirectedOption: !this.forceDirected, // Ocultar opción si está forzado
      },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.confirmarConexion({
          peso: result.peso,
          dirigido: result.dirigido,
        });
      } else {
        this.cancelarConexion();
      }
    });
  }

  // Exporta el grafo actual a un archivo JSON
  async exportar(): Promise<void> {
    const dialogRef = this.dialog.open(ExportModalComponent, {
      width: '300px',
    });

    dialogRef.afterClosed().subscribe(async (result: 'json' | 'png') => {
      if (result === 'json') {
        await this.exportImportService.exportToJSON(
          this.store.nodos(),
          this.store.conexiones(),
        );
      } else if (result === 'png') {
        await this.exportImportService.exportToPNG(this.canvas.nativeElement);
      }
    });
  }

  // Activa el selector de archivos para importar un grafo
  seleccionarArchivo() {
    this.fileInput.nativeElement.click();
  }

  // Procesa el archivo seleccionado y carga el grafo
  async onFileSelected(event: any) {
    Object.keys(this.modes).forEach((key) => {
      this.modes[key] = false;
    });
    this.limpiarCanvas();

    const file = event.target.files[0];
    if (file) {
      try {
        const raw = await new Promise<any>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = (e) => resolve(JSON.parse(e.target?.result as string));
          reader.onerror = () => reject(new Error('Error al leer el archivo'));
          reader.readAsText(file);
        });

        this.store.importFromJSON(raw, this.radio);

        if (this.forceDirected) {
          this.store.conexiones().forEach(c => c.dirigido = true);
        }

        this.actualizarMatriz.emit();
        setTimeout(() => {
          this.dibujar();
          this.actualizarMatriz.emit();
          this.cdr.detectChanges();
        }, 10);
      } catch (error) {
        console.error('Error al procesar el archivo:', error);
      }
    }
  }

  // Dibuja el grafo completo en el canvas
  dibujar(): void {
    this.actualizarMatriz.emit();
    const ctx = this.canvas.nativeElement.getContext('2d');
    if (!ctx || this.store.nodos().length === 0) {
      return;
    }
    this.dibujarNodo(ctx);
    this.store.saveSnapshot();
  }

  // Maneja el menú contextual al hacer clic derecho en el canvas
  menuContexto(event: MouseEvent) {
    event.preventDefault();

    const canvas = <HTMLCanvasElement>event.target;
    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    // Primero verifica si se hizo clic en un nodo
    const nodo = this.store.nodos().find(
      (n) => puntoEnNodoOMenos(x, y, n.x, n.y, n.radio),
    );

    if (nodo) {
      this.selectedElement = { type: 'node', data: nodo };
    } else {
      // Si no es un nodo, verifica si es una conexión
      const conexion = this.store.conexiones().find((c) => {
        const desde = this.store.nodos().find((n) => n.contador === c.desde);
        const hasta = this.store.nodos().find((n) => n.contador === c.hasta);
        if (desde && hasta) {
          return this.estaCercaDeConexion(
            x,
            y,
            desde.x,
            desde.y,
            hasta.x,
            hasta.y,
            c,
          );
        }
        return false;
      });

      if (conexion) {
        this.selectedElement = { type: 'connection', data: conexion };
      } else {
        this.selectedElement = { type: 'canvas', data: null };
      }
    }

    if (this.menuTrigger) {
      this.menuTrigger.menuData = { selectedElement: this.selectedElement };
      this.menuPosition = {
        x: `${event.clientX}px`,
        y: `${event.clientY}px`,
      };
      this.menuTrigger.openMenu();
    }
  }
  // Permite editar el nombre de un nodo seleccionado
  editarNombre(): void {
    if (this.selectedElement?.type === 'node') {
      const nodo = this.selectedElement.data;
      const nuevoNombre = prompt('Ingrese el nuevo nombre:', nodo.nombre);
      if (nuevoNombre !== null) {
        nodo.nombre = nuevoNombre;
        const ctx = this.canvas.nativeElement.getContext('2d');
        if (ctx) {
          this.dibujarNodo(ctx);
        }
        this.actualizarMatriz.emit();
        this.store.saveSnapshot();
      }
    }
  }

  // Elimina un nodo seleccionado y sus conexiones
  eliminarNodo(): void {
    if (this.selectedElement?.type === 'node') {
      const nodo = this.selectedElement.data;
      this.store.removeNodo(nodo.contador);
      const ctx = this.canvas.nativeElement.getContext('2d');
      if (ctx) {
        this.dibujarNodo(ctx);
      }
      this.actualizarMatriz.emit();
    }
  }

  // Edita el peso de una conexión seleccionada
  editarPeso(): void {
    if (this.selectedElement?.type === 'connection') {
      const conexion = this.selectedElement.data;
      const nuevoPeso = prompt(
        'Ingrese el nuevo peso:',
        conexion.peso?.toString(),
      );
      if (nuevoPeso !== null) {
        if (isNaN(Number(nuevoPeso))) {
          alert('Ingrese un numero valido');
          return;
        }
        conexion.peso = Number(nuevoPeso);
        const ctx = this.canvas.nativeElement.getContext('2d');
        if (ctx) {
          this.dibujarNodo(ctx);
        }
      }
      this.actualizarMatriz.emit();
      this.store.saveSnapshot();
    }
  }

  // Cambia la dirección de una conexión seleccionada
  toggleDirigido(): void {
    if (this.selectedElement?.type === 'connection') {
      const conexion = this.selectedElement.data;
      conexion.dirigido = !conexion.dirigido;
      const ctx = this.canvas.nativeElement.getContext('2d');
      if (ctx) {
        this.dibujarNodo(ctx);
      }
      this.actualizarMatriz.emit();
      this.store.saveSnapshot();
    }
  }

  // Elimina una conexión seleccionada
  eliminarConexion(): void {
    if (this.selectedElement?.type === 'connection') {
      const conexion = this.selectedElement.data;
      this.store.removeConexion(conexion.desde, conexion.hasta);
      const ctx = this.canvas.nativeElement.getContext('2d');
      if (ctx) {
        this.dibujarNodo(ctx);
      }
    }
  }

  // Limpia completamente el canvas y reinicia el estado del grafo
  limpiarCanvas() {
    this.store.clear();

    const ctx = this.canvas.nativeElement.getContext('2d');
    if (ctx) {
      ctx.fillStyle = this.colorFondo;
      ctx.fillRect(
        0,
        0,
        this.canvas.nativeElement.width,
        this.canvas.nativeElement.height,
      );
    }

    this.nodosActualizados.emit([]);
    this.conexionActualizada.emit([]);
    this.actualizarMatriz.emit();
  }

  undo(): void {
    this.store.undo();
    const ctx = this.canvas.nativeElement.getContext('2d');
    if (ctx) {
      this.dibujarNodo(ctx);
    }
    this.actualizarMatriz.emit();
  }

  redo(): void {
    this.store.redo();
    const ctx = this.canvas.nativeElement.getContext('2d');
    if (ctx) {
      this.dibujarNodo(ctx);
    }
    this.actualizarMatriz.emit();
  }

  render(): void {
    const ctx = this.canvas.nativeElement.getContext('2d');
    if (ctx) {
      this.dibujarNodo(ctx);
    }
  }

  // Actualiza el tamaño del canvas cuando el contenedor cambia de tamaño
  private updateCanvasSize(): void {
    if (!this.canvasContainer) return;

    const container = this.canvasContainer.nativeElement;
    const rect = container.getBoundingClientRect();

    this.canvasWidth = rect.width;
    this.canvasHeight = rect.height;

    const canvas = this.canvas.nativeElement;
    canvas.width = this.canvasWidth;
    canvas.height = this.canvasHeight;

    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.fillStyle = this.colorFondo;
      ctx.fillRect(0, 0, this.canvasWidth, this.canvasHeight);
      this.dibujarNodo(ctx);
    }
  }

  // Añadir método para actualizar el tamaño cuando la ventana cambia
  @HostListener('window:resize')
  onResize(): void {
    this.updateCanvasSize();
  }

  ngAfterViewInit() {
    this.updateCanvasSize();
  }
}
