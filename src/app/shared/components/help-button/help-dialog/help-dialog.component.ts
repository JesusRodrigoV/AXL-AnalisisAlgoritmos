import {
  ChangeDetectionStrategy,
  Component,
  Inject,
  SecurityContext,
} from '@angular/core';
import {
  MAT_DIALOG_DATA,
  MatDialogActions,
  MatDialogContent,
  MatDialogRef,
  MatDialogTitle,
} from '@angular/material/dialog';
import { HelpContent } from '@app/models/Help.model';
import { MatStepperModule } from '@angular/material/stepper';
import { MatGridListModule } from '@angular/material/grid-list';
import { MatListModule } from '@angular/material/list';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatExpansionModule } from '@angular/material/expansion'; // Nuevo módulo requerido
import { DomSanitizer } from '@angular/platform-browser';
import { SafeUrlPipe } from '../Pipes/safe-url.pipe';

@Component({
  selector: 'app-help-dialog',
  imports: [
    MatDialogTitle,
    MatDialogContent,
    MatDialogActions,
    MatStepperModule,
    MatGridListModule,
    MatListModule,
    MatButtonModule,
    MatIconModule,
    MatExpansionModule,
    SafeUrlPipe,
  ],
  templateUrl: './help-dialog.component.html',
  styleUrl: './help-dialog.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HelpDialogComponent {
  showImagePreview = false;
  selectedImage: string | null = null;
  constructor(
    public dialogRef: MatDialogRef<HelpDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: HelpContent,
    private sanitizer: DomSanitizer,
  ) {
    window.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && this.showImagePreview) {
        this.closeImagePreview();
      }
    });
  }

  closeDialog(): void {
    this.dialogRef.close();
  }

  openImagePreview(imageUrl: string): void {
    this.selectedImage = imageUrl;
    this.showImagePreview = true;
  }

  closeImagePreview(): void {
    this.showImagePreview = false;
    this.selectedImage = null;
  }

  sanitizeUrl(url: string) {
    return this.sanitizer.sanitize(SecurityContext.URL, url);
  }
}
