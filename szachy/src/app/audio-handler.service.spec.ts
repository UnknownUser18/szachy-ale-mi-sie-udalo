import { TestBed } from '@angular/core/testing';

import { AudioHandlerService } from './audio-handler.service';

describe('AudioHandlerService', () => {
  let service: AudioHandlerService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(AudioHandlerService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
