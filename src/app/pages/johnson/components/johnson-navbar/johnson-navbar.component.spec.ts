import { ComponentFixture, TestBed } from '@angular/core/testing';

import { JohnsonNavbarComponent } from './johnson-navbar.component';

describe('JohnsonNavbarComponent', () => {
  let component: JohnsonNavbarComponent;
  let fixture: ComponentFixture<JohnsonNavbarComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [JohnsonNavbarComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(JohnsonNavbarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
