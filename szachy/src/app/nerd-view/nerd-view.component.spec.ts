import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NerdViewComponent } from './nerd-view.component';

describe('NerdViewComponent', () => {
  let component: NerdViewComponent;
  let fixture: ComponentFixture<NerdViewComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NerdViewComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(NerdViewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
