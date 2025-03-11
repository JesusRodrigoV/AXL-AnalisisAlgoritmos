import { ChangeDetectionStrategy, Component } from '@angular/core';

interface Color {
  id: number;
  hexCode: string;
  name: string;
  isSelected: boolean;
}

@Component({
  selector: 'app-color-picker',
  imports: [],
  templateUrl: './color-picker.component.html',
  styleUrl: './color-picker.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ColorPickerComponent {
  colors: Color[] = [
    { id: 1, hexCode: '#FF5733', name: 'Rojo Coral', isSelected: false },
    { id: 2, hexCode: '#33FF57', name: 'Verde Limón', isSelected: false },
    { id: 3, hexCode: '#3357FF', name: 'Azul Real', isSelected: false },
    { id: 4, hexCode: '#F3FF33', name: 'Amarillo', isSelected: false },
    { id: 5, hexCode: '#FF33F3', name: 'Rosa Fucsia', isSelected: false },
    { id: 6, hexCode: '#8B4513', name: 'Marrón', isSelected: false },
    { id: 7, hexCode: '#800080', name: 'Púrpura', isSelected: false },
    { id: 8, hexCode: '#FFA500', name: 'Naranja', isSelected: false },
    { id: 9, hexCode: '#008080', name: 'Verde Azulado', isSelected: false },
    { id: 10, hexCode: '#4B0082', name: 'Índigo', isSelected: false },
  ];

  selectedColor: Color | null = null;

  selectColor(color: Color) {
    this.colors.forEach((c) => (c.isSelected = false));
    color.isSelected = true;
    this.selectedColor = color;
    console.log('Selected color:', this.selectedColor);
  }
}
