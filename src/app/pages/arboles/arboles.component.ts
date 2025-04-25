import { Component, ElementRef, ViewChild, AfterViewInit } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { MatTabsModule } from '@angular/material/tabs';
import { MatDividerModule } from '@angular/material/divider';
import { HelpButtonComponent } from '@app/src/help-button';
import { HelpContent } from '@app/models/Help.model';

class Nodo {
  valor: number;
  izquierda: Nodo | null;
  derecha: Nodo | null;

  constructor(valor: number) {
    this.valor = valor;
    this.izquierda = null;
    this.derecha = null;
  }
}

@Component({
  selector: 'app-arboles',
  templateUrl: './arboles.component.html',
  imports: [
    FormsModule,
    ReactiveFormsModule,
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatInputModule,
    MatFormFieldModule,
    MatIconModule,
    MatTooltipModule,
    MatSnackBarModule,
    MatTabsModule,
    MatDividerModule,
    HelpButtonComponent,
  ],
  styleUrls: ['./arboles.component.scss'],
})
export default class ArbolesComponent implements AfterViewInit {
  private readonly SNACKBAR_DURATION = 3000;
  private readonly HELP_IMAGES_PATH = 'assets/help/arbol/';
  constructor(private snackBar: MatSnackBar) {}
  @ViewChild('canvas', { static: true })
  canvasRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;

  preOrderInput = '';
  inOrderInput = '';
  postOrderInput = '';
  raiz: Nodo | null = null;

  arbolInput = '';
  ngAfterViewInit() {
    this.drawInitialCanvas();
  }

  helpContent: HelpContent = {
    title: 'Guía de Árboles',
    description:
      'Los árboles son estructuras que representan jerarquías, como un árbol genealógico o la organización de carpetas en tu computadora. Cada elemento (nodo) puede tener hasta dos elementos conectados debajo de él.',
    steps: [
      {
        number: 1,
        title: 'Crear un Árbol Ordenado',
        description:
          'Ingresa números separados por comas y el árbol se construirá automáticamente manteniendo un orden: los números menores irán a la izquierda y los mayores a la derecha.',
        image: `${this.HELP_IMAGES_PATH}arbol-ordenado.png`,
      },
      {
        number: 2,
        title: 'Crear un Árbol desde Recorridos',
        description:
          'Puedes construir un árbol indicando cómo se lee en diferentes órdenes. Por ejemplo, si dices que primero está el 5, luego el 3 y luego el 7, el programa sabrá cómo dibujarlo.',
        image: `${this.HELP_IMAGES_PATH}recorridos.png`,
      },
      {
        number: 3,
        title: '¿Cómo leer los recorridos?',
        description:
          'Hay tres formas de leer un árbol:\n- Preorden: primero el nodo, luego izquierda, luego derecha\n- Inorden: primero izquierda, luego el nodo, luego derecha\n- Postorden: primero izquierda, luego derecha, luego el nodo',
        image: `${this.HELP_IMAGES_PATH}tipos-recorridos.png`,
      },
      {
        number: 4,
        title: 'Ver tu Árbol',
        description:
          'Tu árbol aparecerá dibujado a la derecha. Cada círculo es un número y las líneas muestran cómo se conectan. ¡Es como ver el árbol desde arriba!',
        image: `${this.HELP_IMAGES_PATH}visualizacion.png`,
      },
      {
        number: 5,
        title: 'Guardar y Cargar',
        description:
          'Puedes guardar tu árbol para usarlo después. Es como tomar una foto de tu árbol para poder volver a verlo otro día.',
        image: `${this.HELP_IMAGES_PATH}guardar-cargar.png`,
      },
    ],
    images: [
      {
        url: `${this.HELP_IMAGES_PATH}ejemplo-arbol.png`,
        caption: 'Un árbol simple con números del 1 al 7',
        alt: 'Ejemplo de árbol binario',
      },
      {
        url: `${this.HELP_IMAGES_PATH}recorrido-ejemplo.png`,
        caption: 'Cómo se lee un árbol en diferentes órdenes',
        alt: 'Ejemplo de recorridos en un árbol',
      },
    ],
    tips: [
      'Para crear un árbol más balanceado, intenta ingresar los números en orden mezclado, no todos seguidos.',
      'Usa el botón "Aleatorio" para ver rápidamente cómo se ve un árbol bien formado.',
      'Si te equivocas, puedes usar el botón "Limpiar" para empezar de nuevo.',
      'Para construir un árbol desde recorridos, necesitas dar al menos dos formas diferentes de leerlo.',
      'No te preocupes por el tamaño, ¡el dibujo se ajustará automáticamente para que puedas ver todo tu árbol!',
      'Experimenta con diferentes números y observa cómo cambia la forma del árbol.',
    ],
  };

  private mostrarExito(mensaje: string) {
    this.snackBar.open(mensaje, 'Cerrar', {
      duration: this.SNACKBAR_DURATION,
      panelClass: ['success-snackbar'],
      verticalPosition: 'bottom',
    });
  }

  private mostrarError(mensaje: string) {
    this.snackBar.open(mensaje, 'Cerrar', {
      duration: this.SNACKBAR_DURATION,
      panelClass: ['error-snackbar'],
      verticalPosition: 'bottom',
    });
  }
  drawInitialCanvas() {
    const canvas = this.canvasRef.nativeElement;
    const ctx = canvas.getContext('2d');

    if (ctx) {
      // Limpiar el canvas primero
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Llenar el fondo
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Dibujar texto inicial
      ctx.font = '20px Arial';
      ctx.fillStyle = 'black';
      ctx.textAlign = 'center';
    }
  }

  validarEntrada(entrada: string): number[] | null {
    if (!entrada.trim()) {
      this.mostrarError('La entrada no puede estar vacía');
      return null;
    }

    const valores = entrada.split(',').map((val) => val.trim());
    const numeros: number[] = [];

    for (const val of valores) {
      const num = Number(val);
      if (isNaN(num)) {
        this.mostrarError(
          `Valor inválido: "${val}". Solo se aceptan números separados por comas.`,
        );
        return null;
      }
      numeros.push(num);
    }

    return numeros;
  }

  validarPreInOrden(preorden: number[], inorden: number[]): boolean {
    if (preorden.length !== inorden.length) {
      this.mostrarError(
        'Las listas de preorden e inorden deben tener la misma longitud',
      );
      return false;
    }

    const preSet = new Set(preorden);
    const inSet = new Set(inorden);

    if (preSet.size !== preorden.length) {
      this.mostrarError('La lista de preorden contiene valores duplicados');
      return false;
    }

    if (inSet.size !== inorden.length) {
      this.mostrarError('La lista de inorden contiene valores duplicados');
      return false;
    }

    for (const valor of preorden) {
      if (!inSet.has(valor)) {
        this.mostrarError(
          `El valor ${valor} está en preorden pero no en inorden`,
        );
        return false;
      }
    }

    return true;
  }

  validarPrePostOrden(preorden: number[], postorden: number[]): boolean {
    if (preorden.length !== postorden.length) {
      this.mostrarError(
        'Las listas de preorden y postorden deben tener la misma longitud',
      );
      return false;
    }

    const preSet = new Set(preorden);
    const postSet = new Set(postorden);

    if (preSet.size !== preorden.length) {
      this.mostrarError('La lista de preorden contiene valores duplicados');
      return false;
    }

    if (postSet.size !== postorden.length) {
      this.mostrarError('La lista de postorden contiene valores duplicados');
      return false;
    }

    for (const valor of preorden) {
      if (!postSet.has(valor)) {
        this.mostrarError(
          `El valor ${valor} está en preorden pero no en postorden`,
        );
        return false;
      }
    }

    return true;
  }

  validarInPostOrden(inorden: number[], postorden: number[]): boolean {
    if (inorden.length !== postorden.length) {
      this.mostrarError(
        'Las listas de inorden y postorden deben tener la misma longitud',
      );
      return false;
    }

    const inSet = new Set(inorden);
    const postSet = new Set(postorden);

    if (inSet.size !== inorden.length) {
      this.mostrarError('La lista de inorden contiene valores duplicados');
      return false;
    }

    if (postSet.size !== postorden.length) {
      this.mostrarError('La lista de postorden contiene valores duplicados');
      return false;
    }

    for (const valor of inorden) {
      if (!postSet.has(valor)) {
        this.mostrarError(
          `El valor ${valor} está en inorden pero no en postorden`,
        );
        return false;
      }
    }

    return true;
  }

  construirDesdePreInOrden(preorden: number[], inorden: number[]): Nodo | null {
    if (preorden.length === 0 || inorden.length === 0) {
      return null;
    }

    return this.construirPreIn(
      preorden,
      0,
      preorden.length - 1,
      inorden,
      0,
      inorden.length - 1,
    );
  }

  private construirPreIn(
    preorden: number[],
    preStart: number,
    preEnd: number,
    inorden: number[],
    inStart: number,
    inEnd: number,
  ): Nodo | null {
    if (preStart > preEnd || inStart > inEnd) {
      return null;
    }

    const valorRaiz = preorden[preStart];
    const raiz = new Nodo(valorRaiz);

    let posRaizInorden = -1;
    for (let i = inStart; i <= inEnd; i++) {
      if (inorden[i] === valorRaiz) {
        posRaizInorden = i;
        break;
      }
    }

    const tamIzquierdo = posRaizInorden - inStart;

    raiz.izquierda = this.construirPreIn(
      preorden,
      preStart + 1,
      preStart + tamIzquierdo,
      inorden,
      inStart,
      posRaizInorden - 1,
    );

    raiz.derecha = this.construirPreIn(
      preorden,
      preStart + tamIzquierdo + 1,
      preEnd,
      inorden,
      posRaizInorden + 1,
      inEnd,
    );

    return raiz;
  }

  construirDesdeInPostOrden(
    inorden: number[],
    postorden: number[],
  ): Nodo | null {
    if (inorden.length === 0 || postorden.length === 0) {
      return null;
    }

    return this.construirInPost(
      inorden,
      0,
      inorden.length - 1,
      postorden,
      0,
      postorden.length - 1,
    );
  }

  private construirInPost(
    inorden: number[],
    inStart: number,
    inEnd: number,
    postorden: number[],
    postStart: number,
    postEnd: number,
  ): Nodo | null {
    if (inStart > inEnd || postStart > postEnd) {
      return null;
    }

    const valorRaiz = postorden[postEnd];
    const raiz = new Nodo(valorRaiz);

    // Encontrar la posición de la raíz en inorden
    let posRaizInorden = -1;
    for (let i = inStart; i <= inEnd; i++) {
      if (inorden[i] === valorRaiz) {
        posRaizInorden = i;
        break;
      }
    }

    // Calcular tamaño del subárbol izquierdo
    const tamIzquierdo = posRaizInorden - inStart;

    // Construir recursivamente los subárboles
    raiz.izquierda = this.construirInPost(
      inorden,
      inStart,
      posRaizInorden - 1,
      postorden,
      postStart,
      postStart + tamIzquierdo - 1,
    );

    raiz.derecha = this.construirInPost(
      inorden,
      posRaizInorden + 1,
      inEnd,
      postorden,
      postStart + tamIzquierdo,
      postEnd - 1,
    );

    return raiz;
  }

  construirDesdePrePostOrden(
    preorden: number[],
    postorden: number[],
  ): Nodo | null {
    if (preorden.length === 0 || postorden.length === 0) {
      return null;
    }

    if (preorden.length === 1) {
      return new Nodo(preorden[0]);
    }

    return this.construirPrePost(
      preorden,
      0,
      preorden.length - 1,
      postorden,
      0,
      postorden.length - 1,
    );
  }

  private construirPrePost(
    preorden: number[],
    preStart: number,
    preEnd: number,
    postorden: number[],
    postStart: number,
    postEnd: number,
  ): Nodo | null {
    if (preStart > preEnd || postStart > postEnd) {
      return null;
    }

    if (preStart === preEnd) {
      return new Nodo(preorden[preStart]);
    }

    const valorRaiz = preorden[preStart];
    const raiz = new Nodo(valorRaiz);

    const valorHijoIzq = preorden[preStart + 1];

    let posHijoIzqPost = -1;
    for (let i = postStart; i < postEnd; i++) {
      if (postorden[i] === valorHijoIzq) {
        posHijoIzqPost = i;
        break;
      }
    }

    const tamIzquierdo = posHijoIzqPost - postStart + 1;

    // Construir recursivamente los subárboles
    raiz.izquierda = this.construirPrePost(
      preorden,
      preStart + 1,
      preStart + tamIzquierdo,
      postorden,
      postStart,
      posHijoIzqPost,
    );

    raiz.derecha = this.construirPrePost(
      preorden,
      preStart + tamIzquierdo + 1,
      preEnd,
      postorden,
      posHijoIzqPost + 1,
      postEnd - 1,
    );

    return raiz;
  }

  dibujarArbol() {
    const canvas = this.canvasRef.nativeElement;
    const ctx = canvas.getContext('2d');

    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, '#f5f7fa');
    gradient.addColorStop(1, '#e4e9f0');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    if (!this.raiz) {
      ctx.font = '20px Arial';
      ctx.fillStyle = 'black';
      ctx.textAlign = 'center';
      ctx.fillText(
        'Aquí se dibujará el árbol...',
        canvas.width / 2,
        canvas.height / 2,
      );
      return;
    }

    const alturaArbol = this.calcularAltura(this.raiz);

    const anchosPorNivel = this.calcularAnchosPorNivel(this.raiz);
    const anchuraMaxima = Math.max(...anchosPorNivel);

    const margenVertical = 30;
    const margenHorizontal = 40;
    const alturaDisponible = canvas.height - 2 * margenVertical;
    const anchuraDisponible = canvas.width - 2 * margenHorizontal;

    const espacioVertical = alturaDisponible / (alturaArbol || 1);

    const radioNodo = Math.min(25, espacioVertical / 3);

    const posicionesX = this.calcularPosicionesX(
      this.raiz,
      margenHorizontal,
      canvas.width - margenHorizontal,
    );

    this.dibujarArbolCompleto(
      ctx,
      this.raiz,
      posicionesX,
      margenVertical,
      espacioVertical,
      radioNodo,
    );

    ctx.strokeStyle = 'rgba(0,0,0,0.1)';
    ctx.lineWidth = 8;
    ctx.strokeRect(4, 4, canvas.width - 8, canvas.height - 8);
  }

  private calcularAnchosPorNivel(
    nodo: Nodo | null,
    nivel: number = 0,
    anchos: number[] = [],
  ): number[] {
    if (!nodo) return anchos;

    if (anchos.length <= nivel) {
      anchos.push(0);
    }

    anchos[nivel]++;

    this.calcularAnchosPorNivel(nodo.izquierda, nivel + 1, anchos);
    this.calcularAnchosPorNivel(nodo.derecha, nivel + 1, anchos);

    return anchos;
  }

  private calcularPosicionesX(
    nodo: Nodo | null,
    minX: number,
    maxX: number,
    mapa: Map<number, number> = new Map(),
  ): Map<number, number> {
    if (!nodo) return mapa;

    const posX = (minX + maxX) / 2;
    mapa.set(nodo.valor, posX);

    const medioX = (maxX - minX) / 4;

    if (nodo.izquierda) {
      this.calcularPosicionesX(nodo.izquierda, minX, posX - medioX, mapa);
    }

    if (nodo.derecha) {
      this.calcularPosicionesX(nodo.derecha, posX + medioX, maxX, mapa);
    }

    return mapa;
  }

  private dibujarArbolCompleto(
    ctx: CanvasRenderingContext2D,
    nodo: Nodo | null,
    posicionesX: Map<number, number>,
    yInicial: number,
    espacioVertical: number,
    radio: number,
    nivel: number = 0,
  ) {
    if (!nodo) return;

    const x = posicionesX.get(nodo.valor) || 0;
    const y = yInicial + nivel * espacioVertical;

    const grosorLinea = Math.max(1, radio / 8);

    const dibujarLineaConectora = (hijo: Nodo | null) => {
      if (!hijo) return;

      const hijoX = posicionesX.get(hijo.valor) || 0;
      const hijoY = y + espacioVertical;

      ctx.beginPath();
      ctx.moveTo(x, y + radio);

      const puntoControlX = (x + hijoX) / 2;
      const puntoControlY1 = y + radio + espacioVertical / 3;
      const puntoControlY2 = hijoY - radio - espacioVertical / 3;

      ctx.bezierCurveTo(
        puntoControlX,
        puntoControlY1,
        puntoControlX,
        puntoControlY2,
        hijoX,
        hijoY - radio,
      );

      ctx.strokeStyle = '#6c7583';
      ctx.lineWidth = grosorLinea;

      ctx.shadowColor = 'rgba(0, 0, 0, 0.2)';
      ctx.shadowBlur = 4;
      ctx.shadowOffsetX = 2;
      ctx.shadowOffsetY = 2;

      ctx.stroke();

      ctx.shadowColor = 'transparent';
      ctx.shadowBlur = 0;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 0;
    };

    // Dibujar líneas a los hijos
    if (nodo.izquierda) {
      dibujarLineaConectora(nodo.izquierda);
    }

    if (nodo.derecha) {
      dibujarLineaConectora(nodo.derecha);
    }

    ctx.beginPath();
    ctx.arc(x + 3, y + 3, radio, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
    ctx.fill();

    const gradient = ctx.createRadialGradient(
      x - radio / 3,
      y - radio / 3,
      radio / 10,
      x,
      y,
      radio,
    );
    gradient.addColorStop(0, '#4dabf7');
    gradient.addColorStop(1, '#1c7ed6');

    ctx.beginPath();
    ctx.arc(x, y, radio, 0, Math.PI * 2);
    ctx.fillStyle = gradient;
    ctx.fill();

    ctx.strokeStyle = '#1864ab';
    ctx.lineWidth = grosorLinea;
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(x - radio / 3, y - radio / 3, radio / 4, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.fill();

    const fontSize = Math.max(12, Math.min(16, radio * 0.8));
    ctx.font = `bold ${fontSize}px Arial`;
    ctx.fillStyle = 'white';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
    ctx.shadowBlur = 2;
    ctx.shadowOffsetX = 1;
    ctx.shadowOffsetY = 1;
    ctx.fillText(nodo.valor.toString(), x, y);

    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;

    this.dibujarArbolCompleto(
      ctx,
      nodo.izquierda,
      posicionesX,
      yInicial,
      espacioVertical,
      radio,
      nivel + 1,
    );
    this.dibujarArbolCompleto(
      ctx,
      nodo.derecha,
      posicionesX,
      yInicial,
      espacioVertical,
      radio,
      nivel + 1,
    );
  }

  private calcularAltura(nodo: Nodo | null): number {
    if (!nodo) return 0;
    return (
      1 +
      Math.max(
        this.calcularAltura(nodo.izquierda),
        this.calcularAltura(nodo.derecha),
      )
    );
  }

  obtenerPreorden(
    nodo: Nodo | null = this.raiz,
    resultado: number[] = [],
  ): number[] {
    if (nodo) {
      resultado.push(nodo.valor);
      this.obtenerPreorden(nodo.izquierda, resultado);
      this.obtenerPreorden(nodo.derecha, resultado);
    }
    return resultado;
  }

  obtenerInorden(
    nodo: Nodo | null = this.raiz,
    resultado: number[] = [],
  ): number[] {
    if (nodo) {
      this.obtenerInorden(nodo.izquierda, resultado);
      resultado.push(nodo.valor);
      this.obtenerInorden(nodo.derecha, resultado);
    }
    return resultado;
  }

  obtenerPostorden(
    nodo: Nodo | null = this.raiz,
    resultado: number[] = [],
  ): number[] {
    if (nodo) {
      this.obtenerPostorden(nodo.izquierda, resultado);
      this.obtenerPostorden(nodo.derecha, resultado);
      resultado.push(nodo.valor);
    }
    return resultado;
  }

  agregarNumero() {
    console.log('Agregar número');
  }

  generarRandom() {
    try {
      const MIN_NODOS = 5;
      const MAX_NODOS = 12;
      const MIN_VALOR = 1;
      const MAX_VALOR = 500;

      const cantidadNodos =
        Math.floor(Math.random() * (MAX_NODOS - MIN_NODOS + 1)) + MIN_NODOS;

      const valores = new Set<number>();

      while (valores.size < cantidadNodos) {
        const randomValue =
          Math.floor(Math.random() * (MAX_VALOR - MIN_VALOR + 1)) + MIN_VALOR;
        valores.add(randomValue);
      }

      const valoresArray = Array.from(valores).sort((a, b) => a - b);

      if (Math.random() > 0.5) {
        for (let i = valoresArray.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [valoresArray[i], valoresArray[j]] = [
            valoresArray[j],
            valoresArray[i],
          ];
        }
      }

      this.raiz = this.crearArbolBalanceado(
        valoresArray,
        0,
        valoresArray.length - 1,
      );

      this.preOrderInput = this.obtenerPreorden().join(', ');
      this.inOrderInput = this.obtenerInorden().join(', ');
      this.postOrderInput = this.obtenerPostorden().join(', ');

      this.dibujarArbol();

      this.mostrarExito(`Árbol aleatorio generado correctamente`);
    } catch (error) {
      this.mostrarError(
        'Error al generar el árbol aleatorio: ' +
          (error instanceof Error ? error.message : String(error)),
      );

      this.limpiarEntradas();
    }
  }

  private crearArbolBalanceado(
    valores: number[],
    inicio: number,
    fin: number,
  ): Nodo | null {
    if (inicio > fin) return null;

    const medio = Math.floor((inicio + fin) / 2);
    const nodo = new Nodo(valores[medio]);

    nodo.izquierda = this.crearArbolBalanceado(valores, inicio, medio - 1);
    nodo.derecha = this.crearArbolBalanceado(valores, medio + 1, fin);

    return nodo;
  }

  guardarPreOrder() {
    if (this.inOrderInput.trim()) {
      const preorden = this.validarEntrada(this.preOrderInput);
      const inorden = this.validarEntrada(this.inOrderInput);

      if (preorden && inorden) {
        if (this.validarPreInOrden(preorden, inorden)) {
          try {
            this.raiz = this.construirDesdePreInOrden(preorden, inorden);
            this.dibujarArbol();

            if (!this.postOrderInput.trim()) {
              this.postOrderInput = this.obtenerPostorden().join(', ');
            }

            this.mostrarExito(
              'Árbol construido correctamente desde preorden e inorden',
            );
          } catch (e) {
            this.mostrarError(
              'Error al construir el árbol: ' +
                (e instanceof Error ? e.message : String(e)),
            );
          }
        }
      }
    } else if (this.postOrderInput.trim()) {
      const preorden = this.validarEntrada(this.preOrderInput);
      const postorden = this.validarEntrada(this.postOrderInput);

      if (preorden && postorden) {
        if (this.validarPrePostOrden(preorden, postorden)) {
          try {
            this.raiz = this.construirDesdePrePostOrden(preorden, postorden);
            this.dibujarArbol();

            if (!this.inOrderInput.trim()) {
              this.inOrderInput = this.obtenerInorden().join(', ');
            }

            this.mostrarExito(
              'Árbol construido correctamente desde preorden y postorden',
            );
          } catch (e) {
            this.mostrarError(
              'Error al construir el árbol: ' +
                (e instanceof Error ? e.message : String(e)),
            );
          }
        }
      }
    } else {
      this.mostrarError(
        'Necesitas ingresar también inorden o postorden para construir el árbol',
      );
    }
  }

  guardarInOrder() {
    if (this.preOrderInput.trim()) {
      // Construir desde preorden e inorden
      const preorden = this.validarEntrada(this.preOrderInput);
      const inorden = this.validarEntrada(this.inOrderInput);

      if (preorden && inorden) {
        if (this.validarPreInOrden(preorden, inorden)) {
          try {
            this.raiz = this.construirDesdePreInOrden(preorden, inorden);
            this.dibujarArbol();

            // Actualizar postorden si no está definido
            if (!this.postOrderInput.trim()) {
              this.postOrderInput = this.obtenerPostorden().join(', ');
            }

            this.mostrarExito(
              'Árbol construido correctamente desde preorden e inorden',
            );
          } catch (e) {
            this.mostrarError(
              'Error al construir el árbol: ' +
                (e instanceof Error ? e.message : String(e)),
            );
          }
        }
      }
    } else if (this.postOrderInput.trim()) {
      const inorden = this.validarEntrada(this.inOrderInput);
      const postorden = this.validarEntrada(this.postOrderInput);

      if (inorden && postorden) {
        if (this.validarInPostOrden(inorden, postorden)) {
          try {
            this.raiz = this.construirDesdeInPostOrden(inorden, postorden);
            this.dibujarArbol();

            if (!this.preOrderInput.trim()) {
              this.preOrderInput = this.obtenerPreorden().join(', ');
            }

            this.mostrarExito(
              'Árbol construido correctamente desde inorden y postorden',
            );
          } catch (e) {
            this.mostrarError(
              'Error al construir el árbol: ' +
                (e instanceof Error ? e.message : String(e)),
            );
          }
        }
      }
    } else {
      this.mostrarError(
        'Necesitas ingresar también preorden o postorden para construir el árbol',
      );
    }
  }

  guardarPostOrder() {
    if (this.preOrderInput.trim()) {
      // Construir desde preorden y postorden
      const preorden = this.validarEntrada(this.preOrderInput);
      const postorden = this.validarEntrada(this.postOrderInput);

      if (preorden && postorden) {
        if (this.validarPrePostOrden(preorden, postorden)) {
          try {
            this.raiz = this.construirDesdePrePostOrden(preorden, postorden);
            this.dibujarArbol();

            // Actualizar inorden si no está definido
            if (!this.inOrderInput.trim()) {
              this.inOrderInput = this.obtenerInorden().join(', ');
            }

            this.mostrarExito(
              'Árbol construido correctamente desde preorden y postorden',
            );
          } catch (e) {
            this.mostrarError(
              'Error al construir el árbol: ' +
                (e instanceof Error ? e.message : String(e)),
            );
          }
        }
      }
    } else if (this.inOrderInput.trim()) {
      // Construir desde inorden y postorden
      const inorden = this.validarEntrada(this.inOrderInput);
      const postorden = this.validarEntrada(this.postOrderInput);

      if (inorden && postorden) {
        if (this.validarInPostOrden(inorden, postorden)) {
          try {
            this.raiz = this.construirDesdeInPostOrden(inorden, postorden);
            this.dibujarArbol();

            // Actualizar preorden si no está definido
            if (!this.preOrderInput.trim()) {
              this.preOrderInput = this.obtenerPreorden().join(', ');
            }

            this.mostrarExito(
              'Árbol construido correctamente desde inorden y postorden',
            );
          } catch (e) {
            this.mostrarError(
              'Error al construir el árbol: ' +
                (e instanceof Error ? e.message : String(e)),
            );
          }
        }
      }
    } else {
      this.mostrarError(
        'Necesitas ingresar también preorden o inorden para construir el árbol',
      );
    }
  }
  limpiarEntradas() {
    this.preOrderInput = '';
    this.inOrderInput = '';
    this.postOrderInput = '';
    this.arbolInput = '';

    this.raiz = null;
    this.drawInitialCanvas();

    this.mostrarExito('Se han limpiado todos los campos correctamente');
  }

  exportarArbol() {
    if (!this.raiz) {
      this.mostrarError('No hay ningún árbol para exportar');
      return;
    }

    try {
      const arbolData = {
        preorden: this.obtenerPreorden(),
        inorden: this.obtenerInorden(),
        postorden: this.obtenerPostorden(),
      };

      const jsonString = JSON.stringify(arbolData, null, 2);

      let nombreArchivo = prompt(
        'Nombre del archivo (sin extensión):',
        'arbol',
      );

      if (!nombreArchivo) {
        nombreArchivo = 'arbol';
      }

      nombreArchivo += '.json';

      const blob = new Blob([jsonString], { type: 'application/json' });

      const url = URL.createObjectURL(blob);

      const linkDescarga = document.createElement('a');
      linkDescarga.href = url;
      linkDescarga.download = nombreArchivo;

      document.body.appendChild(linkDescarga);
      linkDescarga.click();
      document.body.removeChild(linkDescarga);

      URL.revokeObjectURL(url);

      this.mostrarExito(
        `Árbol exportado correctamente como "${nombreArchivo}"`,
      );
    } catch (error) {
      this.mostrarError(
        'Error al exportar el árbol: ' +
          (error instanceof Error ? error.message : String(error)),
      );
    }
  }

  importarArbol() {
    this.fileInput.nativeElement.click();
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) {
      return; // No se seleccionó ningún archivo
    }

    const file = input.files[0];
    if (!file.name.endsWith('.json')) {
      this.mostrarError('Por favor, selecciona un archivo JSON válido');
      return;
    }

    const reader = new FileReader();

    reader.onload = (e: ProgressEvent<FileReader>) => {
      try {
        const content = e.target?.result as string;
        const arbolData = JSON.parse(content);

        if (!arbolData.preorden || !arbolData.inorden || !arbolData.postorden) {
          throw new Error(
            'El archivo JSON no contiene los datos necesarios del árbol',
          );
        }

        this.preOrderInput = arbolData.preorden.join(', ');
        this.inOrderInput = arbolData.inorden.join(', ');
        this.postOrderInput = arbolData.postorden.join(', ');

        if (this.validarPreInOrden(arbolData.preorden, arbolData.inorden)) {
          this.raiz = this.construirDesdePreInOrden(
            arbolData.preorden,
            arbolData.inorden,
          );
          this.dibujarArbol();
          this.mostrarExito(
            `Árbol importado correctamente desde "${file.name}"`,
          );
        }
      } catch (error) {
        this.mostrarError(
          'Error al importar el árbol: ' +
            (error instanceof Error ? error.message : String(error)),
        );
      }

      this.fileInput.nativeElement.value = '';
    };

    reader.onerror = () => {
      this.mostrarError('Error al leer el archivo');
    };

    reader.readAsText(file);
  }

  private insertarEnBST(raiz: Nodo | null, valor: number): Nodo {
    if (raiz === null) {
      return new Nodo(valor);
    }

    if (valor < raiz.valor) {
      raiz.izquierda = this.insertarEnBST(raiz.izquierda, valor);
    } else if (valor > raiz.valor) {
      raiz.derecha = this.insertarEnBST(raiz.derecha, valor);
    }

    return raiz;
  }

  private construirBST(valores: number[]): Nodo | null {
    if (valores.length === 0) return null;

    const valoresUnicos = [...new Set(valores)];

    let raiz: Nodo | null = null;

    for (const valor of valoresUnicos) {
      if (raiz === null) {
        raiz = new Nodo(valor);
      } else {
        raiz = this.insertarEnBST(raiz, valor);
      }
    }

    return raiz;
  }

  crearArbol() {
    const valores = this.validarEntrada(this.arbolInput);

    if (valores && valores.length > 0) {
      try {
        this.raiz = new Nodo(valores[0]);

        for (let i = 1; i < valores.length; i++) {
          this.raiz = this.insertarEnBST(this.raiz, valores[i]);
        }

        // Dibujar el árbol
        this.dibujarArbol();

        this.preOrderInput = this.obtenerPreorden().join(', ');
        this.inOrderInput = this.obtenerInorden().join(', ');
        this.postOrderInput = this.obtenerPostorden().join(', ');

        this.mostrarExito('Árbol binario creado correctamente');
      } catch (e) {
        this.mostrarError(
          'Error al construir el árbol ordenado: ' +
            (e instanceof Error ? e.message : String(e)),
        );
      }
    } else {
      this.mostrarError('Ingresa al menos un valor para crear el árbol');
    }
  }
}
