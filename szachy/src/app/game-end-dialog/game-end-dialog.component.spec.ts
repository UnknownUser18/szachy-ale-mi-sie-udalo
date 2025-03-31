import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GameEndDialogComponent } from './game-end-dialog.component';

describe('GameEndDialogComponent', () => {
  let component: GameEndDialogComponent;
  let fixture: ComponentFixture<GameEndDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GameEndDialogComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(GameEndDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
