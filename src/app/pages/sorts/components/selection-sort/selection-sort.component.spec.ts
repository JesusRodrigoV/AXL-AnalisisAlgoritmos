import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SelectionSortComponent } from './selection-sort.component';

describe('SelectionSortComponent', () => {
  let component: SelectionSortComponent;
  let fixture: ComponentFixture<SelectionSortComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SelectionSortComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SelectionSortComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
