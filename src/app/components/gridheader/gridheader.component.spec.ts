import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GridheaderComponent } from './gridheader.component';

describe('GridheaderComponent', () => {
  let component: GridheaderComponent;
  let fixture: ComponentFixture<GridheaderComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GridheaderComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(GridheaderComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
