import { TestBed } from '@angular/core/testing';

import { NgxMatomoService } from './ngx-matomo.service';

describe('NgxMatomoService', () => {
  let service: NgxMatomoService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(NgxMatomoService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
