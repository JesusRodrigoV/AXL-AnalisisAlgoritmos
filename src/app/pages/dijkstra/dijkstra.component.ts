import { ChangeDetectionStrategy, Component, ElementRef, ViewChild, inject, OnInit, AfterViewInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Conexion } from '@app/models/Conexion.model';
import { Nodo } from '@app/models/Nodo.model';
import { MatMenuModule } from '@angular/material/menu';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatCardModule } from '@angular/material/card';
import { ColorService } from '@app/services/color';
import { ExportImportService } from '@app/services/export-import';
import { GraphStoreService } from '@app/shared/services/graph-store.service';
import { GraphRenderer } from '@app/shared/services/graph-renderer.service';
import { HelpButtonComponent } from '@app/shared/components/help-button';
import { HelpContent } from '@app/models/Help.model';
import { ModalContentComponent } from '@app/shared/components/my-canvas/modal-content';
import { puntoEnNodo, puntoEnNodoOMenos, clearCanvas, drawArrowhead } from '@app/shared/services/graph-geometry';

@Component({
  selector: 'app-dijkstra',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    FormsModule,
    MatMenuModule,
    MatSelectModule,
    MatFormFieldModule,
    MatInputModule,
    MatCardModule,
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
  private store = inject(GraphStoreService);
  private renderer = inject(GraphRenderer);
  private cdr: ChangeDetectorRef = inject(ChangeDetectorRef);

  canvasWidth: number = 0;
  canvasHeight: number = 0;
  private resizeObserver!: ResizeObserver;

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
    selectStart: false,
    selectEnd: false
  };
  arcoDirigido = false;
  get nodos() { return this.store.nodos(); }
  peso = 0;
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
    this.store.contador.set(0);
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
    const newActive = !this.modes[mode];
    Object.keys(this.modes).forEach(key => {
      this.modes[key] = false;
    });
    this.modes[mode] = newActive;
    this.store.primerNodoSeleccionado.set(null);
    this.store.segundoNodoSeleccionado.set(null);
    this.redibujarCanvas();
  }

  menuContexto(event: MouseEvent) {
    event.preventDefault();
  }

  async exportar() {
    try {
      const estado = {
        nodos: this.store.nodos(),
        conexiones: this.store.conexiones()
      };
      
      // Crear el contenido del archivo
      const contenido = JSON.stringify(estado, null, 2);
      const blob = new Blob([contenido], { type: 'application/json' });
      
      // Verificar si el navegador soporta la API de File System Access
      if ('showSaveFilePicker' in window) {
        try {
          // @ts-ignore - TypeScript no tiene definiciones para esta API experimental
          const handle = await window.showSaveFilePicker({
            suggestedName: 'grafo-dijkstra.json',
            types: [{
              description: 'Archivos JSON',
              accept: { 'application/json': ['.json'] },
            }],
          });
          
          // Crear un stream de escritura
          const writable = await handle.createWritable();
          await writable.write(blob);
          await writable.close();
        } catch (err) {
          // Si el usuario cancela la operación o el navegador no soporta la API
          this.descargarArchivoAlternativo(blob, 'grafo-dijkstra.json');
        }
      } else {
        // Método alternativo para navegadores que no soportan la API
        this.descargarArchivoAlternativo(blob, 'grafo-dijkstra.json');
      }
    } catch (error) {
      console.error('Error al exportar:', error);
      alert('Ocurrió un error al exportar el archivo');
    }
  }

  private descargarArchivoAlternativo(blob: Blob, nombreDefault: string) {
    // Pedir al usuario el nombre del archivo
    let nombreArchivo = prompt('Ingrese el nombre del archivo:', nombreDefault) || nombreDefault;
    
    // Asegurarse de que tenga la extensión .json
    if (!nombreArchivo.endsWith('.json')) {
      nombreArchivo = nombreArchivo + '.json';
    }
    
    // Descargar usando el método tradicional
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = nombreArchivo;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  }

  seleccionarArchivo() {
    this.fileInput.nativeElement.click();
  }

  onFileSelected(event: Event) {
    const fileInput = event.target as HTMLInputElement;
    const file = fileInput.files?.[0];
    
    if (file) {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        try {
          const estado = JSON.parse(e.target?.result as string);
          
          if (!estado.nodos || !estado.conexiones) {
            throw new Error('El archivo no tiene el formato correcto');
          }
          
          this.store.importFromJSON(estado, this.NODO_RADIO_BASE);
          this.nodoInicio = null;
          this.nodoFin = null;
          this.redibujarCanvas();
          this.cdr.markForCheck();
          
        } catch (error) {
          console.error('Error al cargar el archivo:', error);
          alert('Error al cargar el archivo: ' + (error instanceof Error ? error.message : 'Formato inválido'));
        } finally {
          fileInput.value = '';
        }
      };
      
      reader.onerror = () => {
        alert('Error al leer el archivo');
        fileInput.value = '';
      };
      
      reader.readAsText(file);
    }
  }

  limpiarCanvas() {
    this.store.clear();
    this.nodoInicio = null;
    this.nodoFin = null;
    this.redibujarCanvas();
  }

  dobleClickCanvas(event: MouseEvent): void {
    const canvas = <HTMLCanvasElement>event.target;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      const rect = canvas.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;

      // 1. ¿Doble clic sobre un nodo? Editar nombre
      const nodo = this.store.nodos().find(
        (n) => puntoEnNodo(x, y, n.x, n.y, n.radio)
      );
      if (nodo) {
        const nuevoNombre = prompt('Ingrese el nuevo nombre para el nodo:', nodo.nombre);
        if (nuevoNombre !== null && nuevoNombre.trim() !== '') {
          nodo.nombre = nuevoNombre.trim();
          this.redibujarCanvas();
          this.store.saveSnapshot();
        }
        return;
      }

      // 2. ¿Doble clic cerca del peso de una conexión? Editar peso
      for (const conexion of this.store.conexiones()) {
        const desde = this.store.nodos().find((c) => c.contador === conexion.desde);
        const hasta = this.store.nodos().find((c) => c.contador === conexion.hasta);
        if (desde && hasta) {
          // Calcular posición del peso (igual que en dibujarNodo)
          const esBidireccional = !conexion.dirigido || this.store.conexiones().some(
            (c) => c.desde === conexion.hasta && c.hasta === conexion.desde
          );
          const angle = Math.atan2(hasta.y - desde.y, hasta.x - desde.x);
          const offset = esBidireccional ? 10 : 0;
          const offsetX = offset * Math.cos(angle + Math.PI / 2);
          const offsetY = offset * Math.sin(angle + Math.PI / 2);
          const startX = desde.x + offsetX;
          const startY = desde.y + offsetY;
          const endX = hasta.x + offsetX;
          const endY = hasta.y + offsetY;
          const midX = (startX + endX) / 2 + offsetY * 0.6;
          const midY = (startY + endY) / 2 - offsetX * 0.6;
          // Si el doble clic está cerca del peso
          if (Math.abs(x - midX) < 15 && Math.abs(y - midY) < 15) {
            const nuevoPeso = prompt('Ingrese el nuevo peso para la conexión:', String(conexion.peso));
            if (nuevoPeso !== null && !isNaN(Number(nuevoPeso))) {
              conexion.peso = Number(nuevoPeso);
              this.redibujarCanvas();
              this.store.saveSnapshot();
            }
            return;
          }
        }
      }

      // Si no es sobre nodo ni peso, crear nodo nuevo (comportamiento original)
      const nombreNodo = String.fromCharCode(64 + this.store.contador() + 1);
      this.store.addNodoAt(x, y, this.NODO_RADIO_BASE, '#2196f3', nombreNodo);
      this.dibujarNodo(ctx);
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
    const result = this.store.trySelectForConnection(x, y, false);
    if (!result || !result.found) {
      this.dibujarNodo(ctx);
      return;
    }

    if (!result.ready && result.desde !== 0 && result.desde === result.hasta) {
      alert('No se puede conectar un nodo consigo mismo');
      this.limpiarSeleccion();
      this.dibujarNodo(ctx);
      return;
    }

    if (!result.ready && result.desde !== 0) {
      alert('Ya existe una conexión en esta dirección');
      this.limpiarSeleccion();
      this.dibujarNodo(ctx);
      return;
    }

    if (result.ready) {
      this.showModal(result.desde, result.hasta);
    }

    this.dibujarNodo(ctx);
  }

  private manejarEliminacion(x: number, y: number, ctx: CanvasRenderingContext2D): void {
    const nodoIndex = this.store.nodos().findIndex(
      (circulo) => puntoEnNodoOMenos(x, y, circulo.x, circulo.y, circulo.radio)
    );

    if (nodoIndex !== -1) {
      const nodoEliminado = this.store.nodos()[nodoIndex];
      this.store.removeNodo(nodoEliminado.contador);

      // Reset selection if the deleted node was selected
      if (this.nodoInicio === nodoEliminado.contador) this.nodoInicio = null;
      if (this.nodoFin === nodoEliminado.contador) this.nodoFin = null;

      this.dibujarNodo(ctx);
    }
  }

  private limpiarSeleccion(): void {
    this.store.primerNodoSeleccionado.set(null);
    this.store.segundoNodoSeleccionado.set(null);
    this.store.nodos().forEach(nodo => nodo.selected = false);
    const ctx = this.canvas.nativeElement.getContext('2d');
    if (ctx) {
      this.dibujarNodo(ctx);
    }
  }

  dibujarNodo(ctx: CanvasRenderingContext2D): void {
    this.renderer.clearAndFill(ctx, ctx.canvas, this.colorFondo);
    this.renderer.drawConnections(ctx, this.store.conexiones(), this.store.nodos(), 'offset');
    this.renderer.drawNodes(ctx, this.store.nodos(), (nodo) =>
      nodo.selected ? '#ff9800' :
      nodo.contador === this.nodoInicio ? '#4caf50' :
      nodo.contador === this.nodoFin ? '#f44336' :
      nodo.color
    );
  }

  ejecutarDijkstra(modo: 'min' | 'max' = 'min'): void {
    if (this.nodoInicio === null || this.nodoFin === null) {
      alert('Por favor, seleccione un nodo de inicio y un nodo de fin');
      return;
    }

    const distancias: { [key: number]: number } = {};
    const previos: { [key: number]: number | null } = {};
    const noVisitados = new Set<number>();

    // Inicialización
    this.store.nodos().forEach((nodo) => {
      distancias[nodo.contador] = modo === 'min' ? Infinity : -Infinity;
      previos[nodo.contador] = null;
      noVisitados.add(nodo.contador);
    });
    distancias[this.nodoInicio] = 0;

    // Construir lista de conexiones considerando inversas si no es dirigido
    const conexionesConInversas: Conexion[] = [];

    this.store.conexiones().forEach((conexion) => {
      conexionesConInversas.push(conexion);

      // Agregar la inversa si NO es dirigida
      if (!conexion.dirigido) {
        const inversa = new Conexion(
          conexion.hasta,
          conexion.desde,
          conexion.peso,
          conexion.dirigido
        );
        inversa.color = conexion.color;
        conexionesConInversas.push(inversa);
      }
    });

    // Algoritmo de Dijkstra
    const visitados: Set<number> = new Set();
    while (visitados.size < this.store.nodos().length) {
      let nodoActual: number | null = null;
      let mejorDistancia = modo === 'min' ? Infinity : -Infinity;
      noVisitados.forEach((nodo) => {
        if ((modo === 'min' && distancias[nodo] < mejorDistancia) ||
            (modo === 'max' && distancias[nodo] > mejorDistancia)) {
          mejorDistancia = distancias[nodo];
          nodoActual = nodo;
        }
      });
      if (nodoActual === null) break;
      noVisitados.delete(nodoActual);
      visitados.add(nodoActual);
      if (nodoActual === this.nodoFin) break;

      conexionesConInversas.forEach((conexion) => {
        if (conexion.desde === nodoActual) {
          const nuevaDistancia = distancias[nodoActual] + conexion.peso;
          if ((modo === 'min' && nuevaDistancia < distancias[conexion.hasta]) ||
              (modo === 'max' && nuevaDistancia > distancias[conexion.hasta])) {
            distancias[conexion.hasta] = nuevaDistancia;
            previos[conexion.hasta] = nodoActual;
          }
        }
      });
    }

    // Restaurar nombres originales
    this.store.nodos().forEach((nodo, index) => {
      nodo.nombre = String.fromCharCode(65 + index);
    });

    // Mostrar distancias en los nodos
    this.store.nodos().forEach(nodo => {
      const d = distancias[nodo.contador];
      if (d !== Infinity && d !== -Infinity) {
        nodo.nombre += ` (${d})`;
      }
    });

    // Reconstruir camino más corto
    const camino: number[] = [];
    let actual = this.nodoFin;
    while (actual !== null) {
      camino.unshift(actual);
      actual = previos[actual]!;
    }

    // Dibujar camino encontrado
    const ctx = this.canvas.nativeElement.getContext('2d');
    if (ctx) {
      this.dibujarNodo(ctx);

      for (let i = 0; i < camino.length - 1; i++) {
        const desde = this.store.nodos().find(n => n.contador === camino[i]);
        const hasta = this.store.nodos().find(n => n.contador === camino[i + 1]);
        if (desde && hasta) {
          let conexionReal = this.store.conexiones().find(
            c => c.desde === desde.contador && c.hasta === hasta.contador
          );
          let invertida = false;
          if (!conexionReal) {
            conexionReal = this.store.conexiones().find(
              c => c.desde === hasta.contador && c.hasta === desde.contador
            );
            invertida = true;
          }

          const angle = Math.atan2(hasta.y - desde.y, hasta.x - desde.x);
          let offset = 0;
          if (conexionReal) {
            const esBidireccional = this.store.conexiones().some(
              c => c.desde === hasta.contador && c.hasta === desde.contador
            ) && this.store.conexiones().some(
              c => c.desde === desde.contador && c.hasta === hasta.contador
            );
            offset = esBidireccional ? 10 : 0;
          }

          const offsetSign = invertida ? -1 : 1;
          const offsetX = offset * Math.cos(angle + Math.PI / 2) * offsetSign;
          const offsetY = offset * Math.sin(angle + Math.PI / 2) * offsetSign;
          const startX = desde.x + offsetX;
          const startY = desde.y + offsetY;
          const endX = hasta.x + offsetX;
          const endY = hasta.y + offsetY;

          ctx.beginPath();
          ctx.moveTo(startX, startY);
          ctx.lineTo(endX, endY);
          ctx.strokeStyle = modo === 'min' ? '#00ff00' : '#ff0000';
          ctx.lineWidth = 3;
          ctx.stroke();

          if (conexionReal) {
            const distanciaFlecha = hasta.radio + 2;
            const arrowX = endX - distanciaFlecha * Math.cos(angle);
            const arrowY = endY - distanciaFlecha * Math.sin(angle);
            drawArrowhead(ctx, arrowX, arrowY, angle, 20, Math.PI / 6, modo === 'min' ? '#00ff00' : '#ff0000');
          }
        }
      }
    }
  }

  seleccionarNodoInicio(x: number, y: number): void {
    const nodoSeleccionado = this.store.nodos().find(
      (nodo) => puntoEnNodo(x, y, nodo.x, nodo.y, nodo.radio)
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
    const nodoSeleccionado = this.store.nodos().find(
      (nodo) => puntoEnNodo(x, y, nodo.x, nodo.y, nodo.radio)
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

  undo(): void {
    this.store.undo();
    this.redibujarCanvas();
  }

  redo(): void {
    this.store.redo();
    this.redibujarCanvas();
  }

  redibujarCanvas() {
    const ctx = clearCanvas(this.canvas.nativeElement, this.colorFondo);
    if (!ctx) return;
    this.dibujarNodo(ctx);
    this.cdr.detectChanges();
  }

  showModal(desde: number, hasta: number): void {
    const dialogRef = this.dialog.open(ModalContentComponent, {
      width: '400px',
      data: {
        peso: 0,
        dirigido: true,
        showBidirectionalOption: true
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        if (result.peso < 0) {
          alert('El peso no puede ser negativo');
          this.limpiarSeleccion();
          return;
        }

        this.store.addConexion(new Conexion(desde, hasta, result.peso, true));

        if (result.bidireccional && result.pesoInverso !== undefined) {
          if (result.pesoInverso < 0) {
            alert('El peso inverso no puede ser negativo');
            this.limpiarSeleccion();
            return;
          }
          this.store.addConexion(new Conexion(hasta, desde, result.pesoInverso, true));
        }

        this.redibujarCanvas();
        this.limpiarSeleccion();
      } else {
        this.limpiarSeleccion();
      }
    });
  }

  // Editar el nombre de un nodo seleccionado desde el menú contextual
  editarNombreNodo(nodo: any) {
    const nuevoNombre = prompt('Ingrese el nuevo nombre para el nodo:', nodo.nombre);
    if (nuevoNombre !== null && nuevoNombre.trim() !== '') {
      nodo.nombre = nuevoNombre.trim();
      this.redibujarCanvas();
      this.store.saveSnapshot();
    }
  }

  // Editar el peso de una conexión seleccionada desde el menú contextual
  editarPesoConexion(conexion: any) {
    const nuevoPeso = prompt('Ingrese el nuevo peso para la conexión:', String(conexion.peso));
    if (nuevoPeso !== null && !isNaN(Number(nuevoPeso))) {
      conexion.peso = Number(nuevoPeso);
      this.redibujarCanvas();
      this.store.saveSnapshot();
    }
  }

  // Devuelve true si el modo está activo (para usar en la clase del botón)
  isModoActivo(modo: string): boolean {
    return !!this.modes[modo];
  }
}