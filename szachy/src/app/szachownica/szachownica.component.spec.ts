import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SzachownicaComponent } from './szachownica.component';

describe('SzachownicaComponent', () => {
  let component: SzachownicaComponent;
  let fixture: ComponentFixture<SzachownicaComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SzachownicaComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SzachownicaComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
