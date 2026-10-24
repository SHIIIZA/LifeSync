import { TestBed } from '@angular/core/testing';
import { ConnectivityService } from './connectivity.service';

describe('ConnectivityService', () => {
  let service: ConnectivityService;
  let fetchSpy: jasmine.Spy<typeof fetch>;

  beforeEach(() => {
    jasmine.clock().install();
    fetchSpy = spyOn(window, 'fetch').and.resolveTo(new Response(null, { status: 204 }));
    TestBed.configureTestingModule({ providers: [ConnectivityService] });
    service = TestBed.inject(ConnectivityService);
  });

  afterEach(() => {
    jasmine.clock().uninstall();
  });

  it('reports online when the internet reachability check succeeds', async () => {
    fetchSpy.and.resolveTo(new Response(null, { status: 204 }));

    await service.checkConnection();

    expect(service.isOnline()).toBeTrue();
  });

  it('reports offline when a network is connected but the internet check fails', async () => {
    fetchSpy.and.rejectWith(new TypeError('Network request failed'));

    await service.checkConnection();

    expect(service.isOnline()).toBeFalse();
  });
});
