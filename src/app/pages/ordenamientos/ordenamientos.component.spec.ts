import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OrdenamientosComponent } from './ordenamientos.component';

describe('OrdenamientosComponent', () => {
  let component: OrdenamientosComponent;
  let fixture: ComponentFixture<OrdenamientosComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OrdenamientosComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(OrdenamientosComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
