import { ChangeDetectionStrategy, Component } from '@angular/core';
import { HelpComponent } from '@app/src/help';
import { MyCanvasComponent } from '@app/src/my-canvas';

@Component({
  selector: 'app-editor',
  imports: [MyCanvasComponent, HelpComponent],
  templateUrl: './editor.component.html',
  styleUrl: './editor.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class EditorComponent {}
