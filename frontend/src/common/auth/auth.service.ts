import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { UserResponse } from './model/user-response';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly http = inject(HttpClient);

  private getCurrentUser() {
    return this.http.get<UserResponse>(`${environment.apiUrl}/auth/user`);
  }
}
