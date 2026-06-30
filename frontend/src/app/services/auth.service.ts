import { Injectable } from '@angular/core';
import { ApiService } from './api.service';
import { Observable, BehaviorSubject } from 'rxjs';
import { tap } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private tokenSubject = new BehaviorSubject<string | null>(localStorage.getItem('nexus_token'));
  token$ = this.tokenSubject.asObservable();

  private usernameSubject = new BehaviorSubject<string | null>(localStorage.getItem('nexus_user'));
  username$ = this.usernameSubject.asObservable();

  constructor(private api: ApiService) {}

  get token(): string | null {
    return this.tokenSubject.value;
  }

  get username(): string | null {
    return this.usernameSubject.value;
  }

  login(username: string, password: string): Observable<any> {
    return this.api.post<any>('/auth/login', { username, password }).pipe(
      tap(res => {
        if (res && res.access_token) {
          localStorage.setItem('nexus_token', res.access_token);
          localStorage.setItem('nexus_user', res.username);
          this.tokenSubject.next(res.access_token);
          this.usernameSubject.next(res.username);
        }
      })
    );
  }

  logout(): void {
    localStorage.removeItem('nexus_token');
    localStorage.removeItem('nexus_user');
    this.tokenSubject.next(null);
    this.usernameSubject.next(null);
  }

  isAuthenticated(): boolean {
    return !!this.token;
  }
}
