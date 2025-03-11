import { ChangeDetectionStrategy, Component } from '@angular/core';
import { MyCanvasComponent } from '@app/src/my-canvas';

@Component({
  selector: 'app-editor',
  imports: [MyCanvasComponent],
  templateUrl: './editor.component.html',
  styleUrl: './editor.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class EditorComponent {}
