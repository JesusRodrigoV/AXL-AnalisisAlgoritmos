import { Injectable } from '@angular/core';
import { HelpContent } from '@app/models/Help.model';

@Injectable({
  providedIn: 'root',
})
export class HelpService {
  private readonly HELP_IMAGES_PATH = 'assets/help';

  readonly kruskalHelp: HelpContent = {
    title: 'Guía del Algoritmo de Kruskal',
    description:
      'El algoritmo de Kruskal encuentra el árbol de expansión mínimo en un grafo conectado y ponderado. Es decir, encuentra un subconjunto de aristas que conecta todos los vértices con el costo total mínimo.',
    steps: [
      {
        number: 1,
        title: 'Crear el Grafo',
        description:
          'Dibuja los nodos y las aristas con sus pesos. Cada arista debe tener un peso que representa su costo o distancia.',
        image: `${this.HELP_IMAGES_PATH}/kruskal/crear-grafo.png`,
      },
      {
        number: 2,
        title: 'Ordenar las Aristas',
        description:
          'El algoritmo ordena todas las aristas de menor a mayor peso. Esto asegura que siempre consideremos primero las conexiones más económicas.',
        image: `${this.HELP_IMAGES_PATH}/kruskal/ordenar-aristas.png`,
      },
      {
        number: 3,
        title: 'Seleccionar Aristas',
        description:
          'Se van seleccionando las aristas más pequeñas que no formen ciclos. Si una arista forma un ciclo, se salta y se continúa con la siguiente.',
        image: `${this.HELP_IMAGES_PATH}/kruskal/seleccionar-aristas.png`,
      },
      {
        number: 4,
        title: 'Árbol de Expansión Mínimo',
        description:
          'El proceso termina cuando se han seleccionado (n-1) aristas, donde n es el número de vértices. El resultado es un árbol que conecta todos los nodos con el menor costo total posible.',
        image: `${this.HELP_IMAGES_PATH}/kruskal/arbol-final.png`,
      },
    ],
    images: [
      {
        url: `${this.HELP_IMAGES_PATH}/kruskal/ejemplo-completo.png`,
        caption: 'Ejemplo completo de ejecución del algoritmo de Kruskal',
        alt: 'Ejemplo paso a paso del algoritmo de Kruskal',
      },
      {
        url: `${this.HELP_IMAGES_PATH}/kruskal/deteccion-ciclos.png`,
        caption: 'Detección de ciclos en el algoritmo',
        alt: 'Ejemplo de cómo el algoritmo detecta y evita ciclos',
      },
    ],
    tips: [
      'Asegúrate de que los pesos de las aristas sean números positivos',
      'Un grafo puede tener más de un árbol de expansión mínimo si hay aristas con el mismo peso',
      'El algoritmo siempre encuentra la solución óptima global',
      'Para grafos grandes, es importante mantener un registro de los conjuntos disjuntos para detectar ciclos eficientemente',
    ],
  };

  readonly dijkstraHelp: HelpContent = {
    title: 'Guía del Algoritmo de Dijkstra',
    description:
      'El algoritmo de Dijkstra encuentra el camino más corto entre un nodo origen y todos los demás nodos en un grafo con pesos positivos. Es especialmente útil para problemas de ruteo y navegación.',
    steps: [
      {
        number: 1,
        title: 'Seleccionar Nodo Inicial',
        description:
          'Elige el nodo desde donde quieres comenzar. Este será tu punto de partida y su distancia inicial será 0, mientras que todos los demás nodos tendrán distancia infinita inicialmente.',
        image: `${this.HELP_IMAGES_PATH}/dijkstra/nodo-inicial.png`,
      },
      {
        number: 2,
        title: 'Explorar Vecinos',
        description:
          'Desde el nodo actual, calcula la distancia a todos sus vecinos sumando el peso de la arista correspondiente. Si encontramos una distancia menor a la registrada anteriormente, actualizamos el valor.',
        image: `${this.HELP_IMAGES_PATH}/dijkstra/explorar-vecinos.png`,
      },
      {
        number: 3,
        title: 'Marcar y Avanzar',
        description:
          'Marca el nodo actual como visitado y selecciona el nodo no visitado con la menor distancia acumulada como siguiente nodo a procesar.',
        image: `${this.HELP_IMAGES_PATH}/dijkstra/marcar-avanzar.png`,
      },
      {
        number: 4,
        title: 'Encontrar Caminos',
        description:
          'Repite el proceso hasta que todos los nodos hayan sido visitados. Al final, tendrás la distancia más corta desde el nodo inicial a todos los demás nodos y podrás reconstruir los caminos.',
        image: `${this.HELP_IMAGES_PATH}/dijkstra/caminos-finales.png`,
      },
    ],
    images: [
      {
        url: `${this.HELP_IMAGES_PATH}/dijkstra/ejemplo-completo.png`,
        caption: 'Ejemplo completo de ejecución del algoritmo de Dijkstra',
        alt: 'Ejemplo paso a paso del algoritmo de Dijkstra',
      },
      {
        url: `${this.HELP_IMAGES_PATH}/dijkstra/tabla-distancias.png`,
        caption: 'Tabla de distancias y caminos',
        alt: 'Ejemplo de tabla de distancias y caminos más cortos',
      },
    ],
    tips: [
      'El algoritmo solo funciona con pesos positivos en las aristas',
      'Es importante mantener un registro de los nodos visitados',
      'Para reconstruir el camino, guarda el nodo anterior que llevó a la mejor distancia',
      'Dijkstra es voraz (greedy) y siempre encuentra la solución óptima para grafos con pesos positivos',
      'Para mejorar el rendimiento, usa una cola de prioridad para seleccionar el siguiente nodo',
    ],
  };

  constructor() {}

  getKruskalHelp(): HelpContent {
    return this.kruskalHelp;
  }

  getDijkstraHelp(): HelpContent {
    return this.dijkstraHelp;
  }
}
