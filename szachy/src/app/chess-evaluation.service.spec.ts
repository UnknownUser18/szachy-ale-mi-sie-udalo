import { TestBed } from '@angular/core/testing';

import { ChessEvaluationService } from './chess-evaluation.service';

describe('ChessEvaluationService', () => {
  let service: ChessEvaluationService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ChessEvaluationService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
