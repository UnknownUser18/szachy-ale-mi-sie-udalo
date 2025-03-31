import { TestBed } from '@angular/core/testing';

import { LocalConnectionService } from './local-connection.service';

describe('LocalConnectionService', () => {
  let service: LocalConnectionService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(LocalConnectionService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
