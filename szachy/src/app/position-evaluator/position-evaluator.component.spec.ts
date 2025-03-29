import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PositionEvaluatorComponent } from './position-evaluator.component';

describe('PositionEvaluatorComponent', () => {
  let component: PositionEvaluatorComponent;
  let fixture: ComponentFixture<PositionEvaluatorComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PositionEvaluatorComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PositionEvaluatorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
