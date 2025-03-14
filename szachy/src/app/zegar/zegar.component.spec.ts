import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ZegarComponent } from './zegar.component';

describe('ZegarComponent', () => {
  let component: ZegarComponent;
  let fixture: ComponentFixture<ZegarComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ZegarComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ZegarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
