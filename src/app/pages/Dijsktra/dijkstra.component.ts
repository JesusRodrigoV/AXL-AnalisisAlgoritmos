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

  async exportar() {
    try {
      const estado = {
        nodos: this.nodos,
        conexiones: this.conexiones
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
          console.log('Guardado cancelado o no soportado, usando método alternativo');
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
      nombreArchivo = nombreArchivo + '.json'; // Usamos nueva asignación en lugar de +=
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
          
          // Validar la estructura básica del archivo
          if (!estado.nodos || !estado.conexiones) {
            throw new Error('El archivo no tiene el formato correcto');
          }
          
          // Crear nuevos arrays para forzar la detección de cambios
          const nuevosNodos = estado.nodos.map((nodo: any) => {
            return new Nodo(
              nodo.x,
              nodo.y,
              nodo.radio || this.NODO_RADIO_BASE,
              nodo.contador,
              nodo.selected || false,
              nodo.nombre,
              nodo.valor || 0,
              nodo.color || '#2196f3'
            );
          });
          
          const nuevasConexiones = estado.conexiones.map((conn: any) => {
            return new Conexion(
              conn.desde,
              conn.hasta,
              conn.peso,
              conn.dirigido || false,
            );
          });
          
          // Asignar los nuevos arrays
          this.nodos = nuevosNodos;
          this.conexiones = nuevasConexiones;
          
          // Actualizar el contador
          this.contador = this.nodos.length > 0 
            ? Math.max(...this.nodos.map(n => n.contador)) 
            : 0;
          
          // Resetear selecciones
          this.nodoInicio = null;
          this.nodoFin = null;
          this.primerNodoSeleccionado = null;
          this.segundoNodoSeleccionado = null;
          
          // Forzar el redibujado del canvas
          this.redibujarCanvas();
          
          // Forzar la detección de cambios
          this.cdr.markForCheck();
          
        } catch (error) {
          console.error('Error al cargar el archivo:', error);
          alert('Error al cargar el archivo: ' + (error instanceof Error ? error.message : 'Formato inválido'));
        } finally {
          // Resetear el input para permitir cargar el mismo archivo nuevamente
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
      (nodo) => Math.sqrt(Math.pow(x - nodo.x, 2) + Math.pow(y - nodo.y, 2)) < nodo.radio
    );
  
    if (nodoSeleccionado) {
      if (this.primerNodoSeleccionado === null) {
        this.primerNodoSeleccionado = nodoSeleccionado.contador;
        nodoSeleccionado.selected = true;
      } else {
        // Permitir múltiples conexiones entre los mismos nodos (incluso inversas)
        const existeMismaConexion = this.conexiones.some(
          (conn) => conn.desde === this.primerNodoSeleccionado && 
                    conn.hasta === nodoSeleccionado.contador
        );
  
        if (existeMismaConexion) {
          alert('Ya existe una conexión en esta dirección');
          this.limpiarSeleccion();
          return;
        }
  
        this.segundoNodoSeleccionado = nodoSeleccionado.contador;
        this.showModal(this.primerNodoSeleccionado, this.segundoNodoSeleccionado);
      }
      this.dibujarNodo(ctx);
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
  
        // --- Nuevo: Calcular si existe conexión inversa ---
        const esBidireccional = this.conexiones.some(
          (c) => c.desde === conexion.hasta && c.hasta === conexion.desde
        );
  
        // --- Ajustar el desplazamiento (offset) ---
        const offset = esBidireccional ? 10 : 0; // Desplazamiento si hay conexión inversa
        const angle = Math.atan2(hasta.y - desde.y, hasta.x - desde.x);
        
        // Puntos de inicio/final con desplazamiento perpendicular
        const offsetX = offset * Math.cos(angle + Math.PI / 2);
        const offsetY = offset * Math.sin(angle + Math.PI / 2);
  
        const startX = desde.x + offsetX;
        const startY = desde.y + offsetY;
        const endX = hasta.x + offsetX;
        const endY = hasta.y + offsetY;
  
        // Dibujar línea principal (con desplazamiento si es bidireccional)
        ctx.moveTo(startX, startY);
        ctx.lineTo(endX, endY);
        ctx.strokeStyle = conexion.color || '#666';
        ctx.lineWidth = 2;
        ctx.stroke();
  
        // Dibujar flecha (siempre dirigida)
        const arrowLength = 20;
        const arrowAngle = Math.PI / 6;
        // Calcular el punto final ajustado (antes de tocar el nodo)
        const distanciaFlecha = hasta.radio + 2; // 2px extra para separación visual
        const arrowX = endX - distanciaFlecha * Math.cos(angle);
        const arrowY = endY - distanciaFlecha * Math.sin(angle);

  
        ctx.beginPath();
        ctx.moveTo(arrowX, arrowY);
        ctx.lineTo(
          arrowX - arrowLength * Math.cos(angle - arrowAngle),
          arrowY - arrowLength * Math.sin(angle - arrowAngle)
        );
        ctx.lineTo(
          arrowX - arrowLength * Math.cos(angle + arrowAngle),
          arrowY - arrowLength * Math.sin(angle + arrowAngle)
        );
        ctx.closePath();
        ctx.fillStyle = conexion.color || '#666';
        ctx.fill();
  
        // Dibujar peso (centrado en la línea)
        const midX = (startX + endX) / 2 + offsetY * 0.6; // Ajuste para evitar superposición
        const midY = (startY + endY) / 2 - offsetX * 0.6;
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

  ejecutarDijkstra(modo: 'min' | 'max' = 'min'): void {
    if (this.nodoInicio === null || this.nodoFin === null) {
      alert('Por favor, seleccione un nodo de inicio y un nodo de fin');
      return;
    }
  
    const distancias: { [key: number]: number } = {};
    const previos: { [key: number]: number | null } = {};
    const noVisitados = new Set<number>();
  
    // Inicialización
    this.nodos.forEach((nodo) => {
      distancias[nodo.contador] = modo === 'min' ? Infinity : -Infinity;
      previos[nodo.contador] = null;
      noVisitados.add(nodo.contador);
    });
    distancias[this.nodoInicio] = 0;
  
    while (noVisitados.size > 0) {
      let nodoActual = -1;
      let distanciaComparacion = modo === 'min' ? Infinity : -Infinity;
      
      noVisitados.forEach((nodo) => {
        if ((modo === 'min' && distancias[nodo] < distanciaComparacion) || 
            (modo === 'max' && distancias[nodo] > distanciaComparacion)) {
          distanciaComparacion = distancias[nodo];
          nodoActual = nodo;
        }
      });
  
      if (nodoActual === -1) break;
      noVisitados.delete(nodoActual);
  
      if (nodoActual === this.nodoFin) break;
  
      this.conexiones.forEach((conexion) => {
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
  
    // Restaurar nombres originales antes de mostrar distancias
    this.nodos.forEach((nodo, index) => {
      nodo.nombre = String.fromCharCode(65 + index);
    });
  
    // Mostrar distancias en los nodos
    this.nodos.forEach(nodo => {
      if (distancias[nodo.contador] !== Infinity && distancias[nodo.contador] !== -Infinity) {
        nodo.nombre += ` (${distancias[nodo.contador]})`;
      }
    });
  
    const camino: number[] = [];
    let actual = this.nodoFin;
    while (actual !== null) {
      camino.unshift(actual);
      actual = previos[actual]!;
    }
  
    // Dibujar el camino encontrado
    const ctx = this.canvas.nativeElement.getContext('2d');
    if (ctx) {
      this.dibujarNodo(ctx);
      
      for (let i = 0; i < camino.length - 1; i++) {
        const desde = this.nodos.find(n => n.contador === camino[i]);
        const hasta = this.nodos.find(n => n.contador === camino[i + 1]);
        if (desde && hasta) {
          ctx.beginPath();
          ctx.moveTo(desde.x, desde.y);
          ctx.lineTo(hasta.x, hasta.y);
          ctx.strokeStyle = modo === 'min' ? '#00ff00' : '#ff0000'; // Verde para min, rojo para max
          ctx.lineWidth = 3;
          ctx.stroke();
        }
      }
    }
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
    const canvas = this.canvas.nativeElement;
    const ctx = canvas.getContext('2d');
    
    if (!ctx) return;
  
    // Limpiar canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Establecer fondo
    ctx.fillStyle = this.colorFondo;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Redibujar todo
    this.dibujarNodo(ctx);
    
    // Forzar detección de cambios
    this.cdr.detectChanges();
  }

  showModal(desde: number, hasta: number): void {
    const dialogRef = this.dialog.open(ModalContentComponent, {
      width: '400px',
      data: {
        peso: 0,
        dirigido: true, // Siempre dirigida
        showBidirectionalOption: true // Mostrar opción para crear la inversa
      }
    });
  
    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        // Conexión principal (desde → hasta)
        this.conexiones.push(new Conexion(desde, hasta, result.peso, true));
  
        // Si el usuario eligió bidireccional, crear conexión inversa (hasta → desde)
        if (result.bidireccional) {
          this.conexiones.push(new Conexion(hasta, desde, result.peso, true));
        }
  
        this.redibujarCanvas();
        this.limpiarSeleccion();
      }
    });
  }
}
