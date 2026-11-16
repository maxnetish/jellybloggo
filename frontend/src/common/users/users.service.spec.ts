import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { environment } from '../../environments/environment';
import { UsersService } from './users.service';

describe('UsersService', () => {
  let service: UsersService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });

    service = TestBed.inject(UsersService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('deleteUser sends login as a query parameter and no body', () => {
    // Regression: бэкенд читает login из r.URL.Query(), а не из тела.
    // Если отправить его в body, будет удалён текущий пользователь.
    service.deleteUser('alice').subscribe();

    const req = httpMock.expectOne(`${environment.apiUrl}/auth/user?login=alice`);

    expect(req.request.method).toBe('DELETE');
    expect(req.request.params.get('login')).toBe('alice');
    expect(req.request.body).toBeNull();

    req.flush(null, { status: 204, statusText: 'No Content' });
  });
});
