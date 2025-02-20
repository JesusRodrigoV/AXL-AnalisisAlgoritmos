import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-help',
  standalone: true, // 👈 Importante para proyectos sin app.module.ts
  imports: [CommonModule], // 👈 Asegura compatibilidad con directivas como *ngIf y *ngFor
  templateUrl: './help.component.html',
  styleUrls: ['./help.component.scss']
})
export class HelpComponent {
  menuVisible = false;
  modalVisible = false;
  isModalOpen = false; 
  selectedImage = '';

  menuOptions = [
    { label: 'Move', image: 'assets/move.png' },
    { label: 'Modo Conexión', image: 'assets/conexion.png' },
    { label: 'Delete', image: 'assets/delete.png' },
    { label: 'Exportar', image: 'assets/export.png' },
    { label: 'Importar', image: 'assets/import.png' },
    { label: 'Limpiar', image: 'assets/clean.png' },
  ];

  toggleMenu() {
    this.menuVisible = !this.menuVisible;
  }

  openModal(option: any) {
    this.selectedImage = option.image;
    this.modalVisible = true;
  }

  closeModal() {
    this.modalVisible = false;
  }
}
