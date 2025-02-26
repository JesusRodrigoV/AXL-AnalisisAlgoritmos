import { ChangeDetectionStrategy, Component } from '@angular/core';
import { JohnsonCanvasComponent } from 'src/app/pages/johnson/components/johnson-canvas/johnson-canvas.component';

@Component({
  selector: 'app-johnson',
  imports: [JohnsonCanvasComponent],
  standalone: true,
  templateUrl: './johnson.component.html',
  styleUrl: './johnson.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class JohnsonComponent {}
