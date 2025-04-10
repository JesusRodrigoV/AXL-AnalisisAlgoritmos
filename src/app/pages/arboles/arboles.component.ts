import { Component, ElementRef, ViewChild, AfterViewInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

// Definición de la clase Nodo
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
  standalone: true,
  imports: [FormsModule, CommonModule], // Añadido CommonModule para usar *ngIf
  styleUrls: ['./arboles.component.scss']
})
export default class ArbolesComponent implements AfterViewInit {
  @ViewChild('canvas', { static: true }) canvasRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;

  preOrderInput = '';
  inOrderInput = '';
  postOrderInput = '';
  raiz: Nodo | null = null;
  mensajeError = '';
  mensajeExito = '';

  ngAfterViewInit() {
    this.drawInitialCanvas();
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
      ctx.fillText('Aquí se dibujará el árbol...', canvas.width / 2, canvas.height / 2);
    }
  }

  // Validar que la entrada sea una lista de números separados por comas
  validarEntrada(entrada: string): number[] | null {
    if (!entrada.trim()) {
      this.mensajeError = 'La entrada no puede estar vacía';
      return null;
    }

    const valores = entrada.split(',').map(val => val.trim());
    const numeros: number[] = [];

    for (const val of valores) {
      const num = Number(val);
      if (isNaN(num)) {
        this.mensajeError = `Valor inválido: "${val}". Solo se aceptan números separados por comas.`;
        return null;
      }
      numeros.push(num);
    }

    return numeros;
  }

  // Validar que preorden e inorden sean compatibles para formar un árbol binario
  validarPreInOrden(preorden: number[], inorden: number[]): boolean {
    if (preorden.length !== inorden.length) {
      this.mensajeError = 'Las listas de preorden e inorden deben tener la misma longitud';
      return false;
    }

    // Verificar que contengan los mismos elementos
    const preSet = new Set(preorden);
    const inSet = new Set(inorden);

    if (preSet.size !== preorden.length) {
      this.mensajeError = 'La lista de preorden contiene valores duplicados';
      return false;
    }

    if (inSet.size !== inorden.length) {
      this.mensajeError = 'La lista de inorden contiene valores duplicados';
      return false;
    }

    for (const valor of preorden) {
      if (!inSet.has(valor)) {
        this.mensajeError = `El valor ${valor} está en preorden pero no en inorden`;
        return false;
      }
    }

    return true;
  }

  // Validar que preorden y postorden sean compatibles
  validarPrePostOrden(preorden: number[], postorden: number[]): boolean {
    if (preorden.length !== postorden.length) {
      this.mensajeError = 'Las listas de preorden y postorden deben tener la misma longitud';
      return false;
    }

    // Verificar que contengan los mismos elementos
    const preSet = new Set(preorden);
    const postSet = new Set(postorden);

    if (preSet.size !== preorden.length) {
      this.mensajeError = 'La lista de preorden contiene valores duplicados';
      return false;
    }

    if (postSet.size !== postorden.length) {
      this.mensajeError = 'La lista de postorden contiene valores duplicados';
      return false;
    }

    for (const valor of preorden) {
      if (!postSet.has(valor)) {
        this.mensajeError = `El valor ${valor} está en preorden pero no en postorden`;
        return false;
      }
    }

    return true;
  }

  // Validar que inorden y postorden sean compatibles
  validarInPostOrden(inorden: number[], postorden: number[]): boolean {
    if (inorden.length !== postorden.length) {
      this.mensajeError = 'Las listas de inorden y postorden deben tener la misma longitud';
      return false;
    }

    // Verificar que contengan los mismos elementos
    const inSet = new Set(inorden);
    const postSet = new Set(postorden);

    if (inSet.size !== inorden.length) {
      this.mensajeError = 'La lista de inorden contiene valores duplicados';
      return false;
    }

    if (postSet.size !== postorden.length) {
      this.mensajeError = 'La lista de postorden contiene valores duplicados';
      return false;
    }

    for (const valor of inorden) {
      if (!postSet.has(valor)) {
        this.mensajeError = `El valor ${valor} está en inorden pero no en postorden`;
        return false;
      }
    }

    return true;
  }

  // Construir árbol a partir de preorden e inorden
  construirDesdePreInOrden(preorden: number[], inorden: number[]): Nodo | null {
    if (preorden.length === 0 || inorden.length === 0) {
      return null;
    }

    return this.construirPreIn(preorden, 0, preorden.length - 1, inorden, 0, inorden.length - 1);
  }

  private construirPreIn(preorden: number[], preStart: number, preEnd: number, 
                         inorden: number[], inStart: number, inEnd: number): Nodo | null {
    if (preStart > preEnd || inStart > inEnd) {
      return null;
    }

    // El primer elemento en preorden es la raíz
    const valorRaiz = preorden[preStart];
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
    raiz.izquierda = this.construirPreIn(
      preorden, preStart + 1, preStart + tamIzquierdo,
      inorden, inStart, posRaizInorden - 1
    );

    raiz.derecha = this.construirPreIn(
      preorden, preStart + tamIzquierdo + 1, preEnd,
      inorden, posRaizInorden + 1, inEnd
    );

    return raiz;
  }

  // Construir árbol a partir de inorden y postorden
  construirDesdeInPostOrden(inorden: number[], postorden: number[]): Nodo | null {
    if (inorden.length === 0 || postorden.length === 0) {
      return null;
    }

    return this.construirInPost(inorden, 0, inorden.length - 1, postorden, 0, postorden.length - 1);
  }

  private construirInPost(inorden: number[], inStart: number, inEnd: number,
                          postorden: number[], postStart: number, postEnd: number): Nodo | null {
    if (inStart > inEnd || postStart > postEnd) {
      return null;
    }

    // El último elemento en postorden es la raíz
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
      inorden, inStart, posRaizInorden - 1,
      postorden, postStart, postStart + tamIzquierdo - 1
    );

    raiz.derecha = this.construirInPost(
      inorden, posRaizInorden + 1, inEnd,
      postorden, postStart + tamIzquierdo, postEnd - 1
    );

    return raiz;
  }

  // Construir un árbol a partir de preorden y postorden
  construirDesdePrePostOrden(preorden: number[], postorden: number[]): Nodo | null {
    if (preorden.length === 0 || postorden.length === 0) {
      return null;
    }
    
    if (preorden.length === 1) {
      return new Nodo(preorden[0]);
    }

    return this.construirPrePost(preorden, 0, preorden.length - 1, postorden, 0, postorden.length - 1);
  }

  private construirPrePost(preorden: number[], preStart: number, preEnd: number,
                          postorden: number[], postStart: number, postEnd: number): Nodo | null {
    if (preStart > preEnd || postStart > postEnd) {
      return null;
    }

    if (preStart === preEnd) {
      return new Nodo(preorden[preStart]);
    }

    // La raíz es el primer elemento en preorden o el último en postorden
    const valorRaiz = preorden[preStart];
    const raiz = new Nodo(valorRaiz);

    // El segundo elemento en preorden es la raíz del subárbol izquierdo
    const valorHijoIzq = preorden[preStart + 1];
    
    // Encontrar la posición del hijo izquierdo en postorden
    let posHijoIzqPost = -1;
    for (let i = postStart; i < postEnd; i++) {
      if (postorden[i] === valorHijoIzq) {
        posHijoIzqPost = i;
        break;
      }
    }

    // Calcular el tamaño del subárbol izquierdo
    const tamIzquierdo = posHijoIzqPost - postStart + 1;

    // Construir recursivamente los subárboles
    raiz.izquierda = this.construirPrePost(
      preorden, preStart + 1, preStart + tamIzquierdo,
      postorden, postStart, posHijoIzqPost
    );

    raiz.derecha = this.construirPrePost(
      preorden, preStart + tamIzquierdo + 1, preEnd,
      postorden, posHijoIzqPost + 1, postEnd - 1
    );

    return raiz;
  }

  // Dibujar el árbol en el canvas
  // Modificaciones a los métodos de dibujo del árbol

// Método principal para dibujar el árbol
// Método principal para dibujar el árbol con mejor distribución horizontal
dibujarArbol() {
  const canvas = this.canvasRef.nativeElement;
  const ctx = canvas.getContext('2d');
  if (!ctx || !this.raiz) return;

  // Limpiamos el canvas
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  
  // Fondo con gradiente
  const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
  gradient.addColorStop(0, '#f5f7fa');
  gradient.addColorStop(1, '#e4e9f0');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  
  // Calculamos dimensiones reales del árbol
  const alturaArbol = this.calcularAltura(this.raiz);
  
  // Calculamos el ancho máximo en cada nivel
  const anchosPorNivel = this.calcularAnchosPorNivel(this.raiz);
  const anchuraMaxima = Math.max(...anchosPorNivel);
  
  // Márgenes y espaciado para aprovechar todo el canvas
  const margenVertical = 30;
  const margenHorizontal = 40;
  const alturaDisponible = canvas.height - 2 * margenVertical;
  const anchuraDisponible = canvas.width - 2 * margenHorizontal;
  
  // Cálculo de espacios
  const espacioVertical = alturaDisponible / (alturaArbol || 1);
  
  // Establecemos el radio del nodo adecuadamente
  const radioNodo = Math.min(25, espacioVertical / 3);
  
  // Obtenemos las posiciones X para cada nodo, optimizando el espacio horizontal
  const posicionesX = this.calcularPosicionesX(this.raiz, margenHorizontal, canvas.width - margenHorizontal);

  // Dibujamos el árbol
  this.dibujarArbolCompleto(
    ctx, 
    this.raiz, 
    posicionesX, 
    margenVertical, 
    espacioVertical,
    radioNodo
  );
  
  // Borde sutil alrededor del canvas
  ctx.strokeStyle = 'rgba(0,0,0,0.1)';
  ctx.lineWidth = 8;
  ctx.strokeRect(4, 4, canvas.width - 8, canvas.height - 8);
}

// Método para calcular el ancho de nodos en cada nivel del árbol
private calcularAnchosPorNivel(nodo: Nodo | null, nivel: number = 0, anchos: number[] = []): number[] {
  if (!nodo) return anchos;
  
  // Inicializar el contador para este nivel si no existe
  if (anchos.length <= nivel) {
    anchos.push(0);
  }
  
  // Incrementar el contador para este nivel
  anchos[nivel]++;
  
  // Procesar subárboles
  this.calcularAnchosPorNivel(nodo.izquierda, nivel + 1, anchos);
  this.calcularAnchosPorNivel(nodo.derecha, nivel + 1, anchos);
  
  return anchos;
}

// Calcular posiciones X óptimas para aprovechar todo el ancho
private calcularPosicionesX(
  nodo: Nodo | null, 
  minX: number, 
  maxX: number, 
  mapa: Map<number, number> = new Map()
): Map<number, number> {
  if (!nodo) return mapa;
  
  // Asignar posición X para este nodo
  const posX = (minX + maxX) / 2;
  mapa.set(nodo.valor, posX);
  
  // Calcular el punto medio para mejor distribución espacial
  const medioX = (maxX - minX) / 4;
  
  // Calcular recursivamente las posiciones para los hijos
  if (nodo.izquierda) {
    this.calcularPosicionesX(nodo.izquierda, minX, posX - medioX, mapa);
  }
  
  if (nodo.derecha) {
    this.calcularPosicionesX(nodo.derecha, posX + medioX, maxX, mapa);
  }
  
  return mapa;
}

// Método para dibujar el árbol completo con las posiciones calculadas
private dibujarArbolCompleto(
  ctx: CanvasRenderingContext2D,
  nodo: Nodo | null,
  posicionesX: Map<number, number>,
  yInicial: number,
  espacioVertical: number,
  radio: number,
  nivel: number = 0
) {
  if (!nodo) return;
  
  // Calcular coordenadas
  const x = posicionesX.get(nodo.valor) || 0;
  const y = yInicial + nivel * espacioVertical;
  
  // Dibujar líneas a los hijos
  const grosorLinea = Math.max(1, radio / 8);
  
  // Función para dibujar una línea curva desde el nodo actual a un hijo
  const dibujarLineaConectora = (hijo: Nodo | null) => {
    if (!hijo) return;
    
    const hijoX = posicionesX.get(hijo.valor) || 0;
    const hijoY = y + espacioVertical;
    
    ctx.beginPath();
    ctx.moveTo(x, y + radio);
    
    // Crear una curva Bezier para hacer líneas más agradables visualmente
    const puntoControlX = (x + hijoX) / 2;
    const puntoControlY1 = y + radio + (espacioVertical / 3);
    const puntoControlY2 = hijoY - radio - (espacioVertical / 3);
    
    ctx.bezierCurveTo(
      puntoControlX, puntoControlY1,
      puntoControlX, puntoControlY2,
      hijoX, hijoY - radio
    );
    
    // Estilo de la línea
    ctx.strokeStyle = '#6c7583';
    ctx.lineWidth = grosorLinea;
    
    // Agregar sombra sutil a la línea
    ctx.shadowColor = 'rgba(0, 0, 0, 0.2)';
    ctx.shadowBlur = 4;
    ctx.shadowOffsetX = 2;
    ctx.shadowOffsetY = 2;
    
    ctx.stroke();
    
    // Resetear sombra después de dibujar
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
  
  // Dibujar sombra para dar efecto 3D
  ctx.beginPath();
  ctx.arc(x + 3, y + 3, radio, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
  ctx.fill();
  
  // Dibujar el círculo del nodo con gradiente
  const gradient = ctx.createRadialGradient(
    x - radio/3, y - radio/3, radio/10,
    x, y, radio
  );
  gradient.addColorStop(0, '#4dabf7');
  gradient.addColorStop(1, '#1c7ed6');
  
  ctx.beginPath();
  ctx.arc(x, y, radio, 0, Math.PI * 2);
  ctx.fillStyle = gradient;
  ctx.fill();
  
  // Borde del nodo
  ctx.strokeStyle = '#1864ab';
  ctx.lineWidth = grosorLinea;
  ctx.stroke();
  
  // Efecto de luz (círculo pequeño en la parte superior)
  ctx.beginPath();
  ctx.arc(x - radio/3, y - radio/3, radio/4, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
  ctx.fill();
  
  // Dibujar el valor del nodo
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
  
  // Resetear sombra
  ctx.shadowColor = 'transparent';
  ctx.shadowBlur = 0;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 0;
  
  // Dibujar subárboles
  this.dibujarArbolCompleto(ctx, nodo.izquierda, posicionesX, yInicial, espacioVertical, radio, nivel + 1);
  this.dibujarArbolCompleto(ctx, nodo.derecha, posicionesX, yInicial, espacioVertical, radio, nivel + 1);
}

// Calcular altura del árbol (mantener método existente)
private calcularAltura(nodo: Nodo | null): number {
  if (!nodo) return 0;
  return 1 + Math.max(
    this.calcularAltura(nodo.izquierda),
    this.calcularAltura(nodo.derecha)
  );
}

  // Obtener recorridos del árbol actual
  obtenerPreorden(nodo: Nodo | null = this.raiz, resultado: number[] = []): number[] {
    if (nodo) {
      resultado.push(nodo.valor);
      this.obtenerPreorden(nodo.izquierda, resultado);
      this.obtenerPreorden(nodo.derecha, resultado);
    }
    return resultado;
  }

  obtenerInorden(nodo: Nodo | null = this.raiz, resultado: number[] = []): number[] {
    if (nodo) {
      this.obtenerInorden(nodo.izquierda, resultado);
      resultado.push(nodo.valor);
      this.obtenerInorden(nodo.derecha, resultado);
    }
    return resultado;
  }

  obtenerPostorden(nodo: Nodo | null = this.raiz, resultado: number[] = []): number[] {
    if (nodo) {
      this.obtenerPostorden(nodo.izquierda, resultado);
      this.obtenerPostorden(nodo.derecha, resultado);
      resultado.push(nodo.valor);
    }
    return resultado;
  }

  agregarNumero() {
    console.log('Agregar número');
    // Aquí puedes implementar la lógica para agregar un número al árbol
  }

  generarRandom() {
    // Generar un árbol aleatorio de 7 nodos
    const valores = new Set<number>();
    while (valores.size < 7) {
      valores.add(Math.floor(Math.random() * 100) + 1);
    }
    
    const valoresArray = Array.from(valores);
    
    // Crear árbol balanceado con los valores aleatorios
    this.raiz = this.crearArbolBalanceado(valoresArray, 0, valoresArray.length - 1);
    
    // Actualizar los inputs con los recorridos
    this.preOrderInput = this.obtenerPreorden().join(', ');
    this.inOrderInput = this.obtenerInorden().join(', ');
    this.postOrderInput = this.obtenerPostorden().join(', ');
    
    // Dibujar el árbol
    this.dibujarArbol();
    
    this.mensajeExito = 'Árbol aleatorio generado correctamente';
    this.mensajeError = '';
  }

  private crearArbolBalanceado(valores: number[], inicio: number, fin: number): Nodo | null {
    if (inicio > fin) {
      return null;
    }
    
    const medio = Math.floor((inicio + fin) / 2);
    const nodo = new Nodo(valores[medio]);
    
    nodo.izquierda = this.crearArbolBalanceado(valores, inicio, medio - 1);
    nodo.derecha = this.crearArbolBalanceado(valores, medio + 1, fin);
    
    return nodo;
  }

  guardarPreOrder() {
    this.mensajeError = '';
    this.mensajeExito = '';
    
    if (this.inOrderInput.trim()) {
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
            
            this.mensajeExito = 'Árbol construido correctamente desde preorden e inorden';
          } catch (e) {
            this.mensajeError = 'Error al construir el árbol: ' + (e instanceof Error ? e.message : String(e));
          }
        }
      }
    } else if (this.postOrderInput.trim()) {
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
            
            this.mensajeExito = 'Árbol construido correctamente desde preorden y postorden';
          } catch (e) {
            this.mensajeError = 'Error al construir el árbol: ' + (e instanceof Error ? e.message : String(e));
          }
        }
      }
    } else {
      this.mensajeError = 'Necesitas ingresar también inorden o postorden para construir el árbol';
    }
  }

  guardarInOrder() {
    this.mensajeError = '';
    this.mensajeExito = '';
    
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
            
            this.mensajeExito = 'Árbol construido correctamente desde preorden e inorden';
          } catch (e) {
            this.mensajeError = 'Error al construir el árbol: ' + (e instanceof Error ? e.message : String(e));
          }
        }
      }
    } else if (this.postOrderInput.trim()) {
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
            
            this.mensajeExito = 'Árbol construido correctamente desde inorden y postorden';
          } catch (e) {
            this.mensajeError = 'Error al construir el árbol: ' + (e instanceof Error ? e.message : String(e));
          }
        }
      }
    } else {
      this.mensajeError = 'Necesitas ingresar también preorden o postorden para construir el árbol';
    }
  }

  guardarPostOrder() {
    this.mensajeError = '';
    this.mensajeExito = '';
    
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
            
            this.mensajeExito = 'Árbol construido correctamente desde preorden y postorden';
          } catch (e) {
            this.mensajeError = 'Error al construir el árbol: ' + (e instanceof Error ? e.message : String(e));
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
            
            this.mensajeExito = 'Árbol construido correctamente desde inorden y postorden';
          } catch (e) {
            this.mensajeError = 'Error al construir el árbol: ' + (e instanceof Error ? e.message : String(e));
          }
        }
      }
    } else {
      this.mensajeError = 'Necesitas ingresar también preorden o inorden para construir el árbol';
    }
  }
  limpiarEntradas() {
    // Limpiar los campos de entrada
    this.preOrderInput = '';
    this.inOrderInput = '';
    this.postOrderInput = '';
    
    // Limpiar mensajes
    this.mensajeError = '';
    this.mensajeExito = '';
    
    // Opcionalmente, restablecer el árbol y el canvas
    this.raiz = null;
    this.drawInitialCanvas();
    
    // Mensaje de confirmación
    this.mensajeExito = 'Se han limpiado todos los campos correctamente';
  }
  
  exportarArbol() {
    if (!this.raiz) {
      this.mensajeError = "No hay ningún árbol para exportar";
      return;
    }
    
    try {
      // Recopilar los datos del árbol
      const arbolData = {
        preorden: this.obtenerPreorden(),
        inorden: this.obtenerInorden(),
        postorden: this.obtenerPostorden()
      };
      
      // Convertir a JSON
      const jsonString = JSON.stringify(arbolData, null, 2);
      
      // Crear un nombre de archivo por defecto
      let nombreArchivo = prompt('Nombre del archivo (sin extensión):', 'arbol');
      
      // Si el usuario cancela el prompt o ingresa un nombre vacío
      if (!nombreArchivo) {
        nombreArchivo = 'arbol';
      }
      
      // Añadir la extensión .json
      nombreArchivo += '.json';
      
      // Crear un objeto Blob para el archivo
      const blob = new Blob([jsonString], { type: 'application/json' });
      
      // Crear una URL para el Blob
      const url = URL.createObjectURL(blob);
      
      // Crear un elemento a (enlace) para la descarga
      const linkDescarga = document.createElement('a');
      linkDescarga.href = url;
      linkDescarga.download = nombreArchivo;
      
      // Añadir el enlace al DOM, hacer clic y luego eliminarlo
      document.body.appendChild(linkDescarga);
      linkDescarga.click();
      document.body.removeChild(linkDescarga);
      
      // Liberar la URL
      URL.revokeObjectURL(url);
      
      this.mensajeExito = `Árbol exportado correctamente como "${nombreArchivo}"`;
      this.mensajeError = '';
    } catch (error) {
      this.mensajeError = 'Error al exportar el árbol: ' + (error instanceof Error ? error.message : String(error));
      this.mensajeExito = '';
    }
  }
  
  // Método para abrir el diálogo de selección de archivo
  importarArbol() {
    this.fileInput.nativeElement.click();
  }
  
  // Método que se ejecuta cuando se selecciona un archivo
  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) {
      return; // No se seleccionó ningún archivo
    }
    
    const file = input.files[0];
    if (!file.name.endsWith('.json')) {
      this.mensajeError = 'Por favor, selecciona un archivo JSON válido';
      return;
    }
    
    const reader = new FileReader();
    
    reader.onload = (e: ProgressEvent<FileReader>) => {
      try {
        const content = e.target?.result as string;
        const arbolData = JSON.parse(content);
        
        // Verificar que el archivo contiene los datos necesarios
        if (!arbolData.preorden || !arbolData.inorden || !arbolData.postorden) {
          throw new Error('El archivo JSON no contiene los datos necesarios del árbol');
        }
        
        // Actualizar los inputs
        this.preOrderInput = arbolData.preorden.join(', ');
        this.inOrderInput = arbolData.inorden.join(', ');
        this.postOrderInput = arbolData.postorden.join(', ');
        
        // Construir el árbol (usando preorden e inorden)
        if (this.validarPreInOrden(arbolData.preorden, arbolData.inorden)) {
          this.raiz = this.construirDesdePreInOrden(arbolData.preorden, arbolData.inorden);
          this.dibujarArbol();
          this.mensajeExito = `Árbol importado correctamente desde "${file.name}"`;
          this.mensajeError = '';
        }
      } catch (error) {
        this.mensajeError = 'Error al importar el árbol: ' + (error instanceof Error ? error.message : String(error));
        this.mensajeExito = '';
      }
      
      // Limpiar el campo de archivo para permitir seleccionar el mismo archivo nuevamente
      this.fileInput.nativeElement.value = '';
    };
    
    reader.onerror = () => {
      this.mensajeError = 'Error al leer el archivo';
      this.mensajeExito = '';
    };
    
    reader.readAsText(file);
  }
}