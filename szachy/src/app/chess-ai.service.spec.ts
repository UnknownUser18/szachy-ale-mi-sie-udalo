import { TestBed } from '@angular/core/testing';

import { ChessAiService } from './chess-ai.service';

describe('ChessAiService', () => {
  let service: ChessAiService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ChessAiService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
