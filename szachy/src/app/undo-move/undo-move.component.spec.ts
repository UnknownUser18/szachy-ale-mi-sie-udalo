import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UndoMoveComponent } from './undo-move.component';

describe('UndoMoveComponent', () => {
  let component: UndoMoveComponent;
  let fixture: ComponentFixture<UndoMoveComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UndoMoveComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(UndoMoveComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
