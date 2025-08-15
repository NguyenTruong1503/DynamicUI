import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CssStyleComponent } from './css-style.component';

describe('CssStyleComponent', () => {
  let component: CssStyleComponent;
  let fixture: ComponentFixture<CssStyleComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CssStyleComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CssStyleComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
