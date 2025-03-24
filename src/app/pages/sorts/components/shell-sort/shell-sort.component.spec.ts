import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ShellSortComponent } from './shell-sort.component';

describe('ShellSortComponent', () => {
  let component: ShellSortComponent;
  let fixture: ComponentFixture<ShellSortComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ShellSortComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ShellSortComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
