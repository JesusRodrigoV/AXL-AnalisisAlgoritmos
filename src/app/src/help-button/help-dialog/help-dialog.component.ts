import { NgFor, NgIf } from '@angular/common';
import { 
  ChangeDetectionStrategy, 
  Component, 
  Inject,
  SecurityContext 
} from '@angular/core';
import { 
  MAT_DIALOG_DATA, 
  MatDialogActions, 
  MatDialogClose,
  MatDialogContent, 
  MatDialogRef, 
  MatDialogTitle 
} from '@angular/material/dialog';
import { HelpContent } from '@app/models/Help.model';
import { 
  MatStepperModule 
} from '@angular/material/stepper';
import { MatGridListModule } from '@angular/material/grid-list';
import { MatListModule } from '@angular/material/list';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatExpansionModule } from '@angular/material/expansion'; // Nuevo módulo requerido
import { DomSanitizer } from '@angular/platform-browser';
import { SafeUrlPipe } from '../Pipes/safe-url.pipe';

@Component({
  selector: 'app-help-dialog',
  standalone: true,
  imports: [
    NgIf,
    NgFor,
    MatDialogTitle,
    MatDialogContent,
    MatDialogActions,
    MatStepperModule,
    MatGridListModule,
    MatListModule,
    MatButtonModule,
    MatIconModule,
    MatExpansionModule, 
    SafeUrlPipe
  ],
  templateUrl: './help-dialog.component.html',
  styleUrl: './help-dialog.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HelpDialogComponent {
  constructor(
    public dialogRef: MatDialogRef<HelpDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: HelpContent,
    private sanitizer: DomSanitizer // Necesario para el pipe safeUrl
  ) {}

  closeDialog(): void {
    this.dialogRef.close();
  }

  // Función para sanitizar URLs de video
  sanitizeUrl(url: string) {
    return this.sanitizer.sanitize(SecurityContext.URL, url);
  }
}