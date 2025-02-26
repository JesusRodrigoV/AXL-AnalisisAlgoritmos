import { ComponentFixture, TestBed } from '@angular/core/testing';

import { JohnsonCanvasComponent } from './johnson-canvas.component';

describe('JohnsonCanvasComponent', () => {
  let component: JohnsonCanvasComponent;
  let fixture: ComponentFixture<JohnsonCanvasComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [JohnsonCanvasComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(JohnsonCanvasComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
