import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PodpowiedziComponent } from './podpowiedzi.component';

describe('PodpowiedziComponent', () => {
  let component: PodpowiedziComponent;
  let fixture: ComponentFixture<PodpowiedziComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PodpowiedziComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PodpowiedziComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
