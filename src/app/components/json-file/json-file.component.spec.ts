import { ComponentFixture, TestBed } from '@angular/core/testing';

import { JsonFileComponent } from './json-file.component';

describe('JsonFileComponent', () => {
  let component: JsonFileComponent;
  let fixture: ComponentFixture<JsonFileComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [JsonFileComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(JsonFileComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
