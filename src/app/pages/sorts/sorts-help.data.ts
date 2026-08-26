import { HelpContent } from '@app/models/Help.model';

const ASSETS_PATH = 'assets/help/sorts/';

export const SORTS_HELP_CONTENT: HelpContent = {
  title: 'Algoritmos de Ordenamiento',
  description:
    'Visualiza y compara diferentes algoritmos de ordenamiento paso a paso.',
  steps: [
    {
      number: 1,
      title: 'Configuración del Array',
      description:
        'Elige entre generación automática o manual del array:\n- Automático: Define tamaño, valores mínimos y máximos\n- Manual: Ingresa los valores separados por comas\n- También puedes importar datos desde archivos JSON o TXT',
      image: `${ASSETS_PATH}sort-config.png`,
    },
    {
      number: 2,
      title: 'Selección del Algoritmo',
      description:
        'Elige entre Selection Sort, Insertion Sort, Shell Sort o Merge Sort.',
      image: `${ASSETS_PATH}sort-algorithms.png`,
    },
    {
      number: 3,
      title: 'Controles de Ordenamiento',
      description:
        'Iniciar, pausar, cambiar dirección y ajustar velocidad.',
      image: `${ASSETS_PATH}sort-controls.png`,
    },
    {
      number: 4,
      title: 'Visualización y Análisis',
      description:
        'Observa comparaciones, intercambios y tiempo de ejecución en tiempo real.',
    },
  ],
  tips: [
    'Para arrays grandes (>50 elementos), usa el zoom para ver mejor los detalles',
    'El color rojo indica el elemento que se está comparando actualmente',
    'El color amarillo muestra el elemento con el que se está comparando',
    'Para un mejor análisis, prueba el mismo array con diferentes algoritmos',
  ],
  images: [
    {
      url: `${ASSETS_PATH}sort-visualization.png`,
      caption: 'Visualización del proceso de ordenamiento',
      alt: 'Gráfico de barras mostrando el proceso de ordenamiento',
    },
  ],
  videos: [],
};
