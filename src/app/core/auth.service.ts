import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { BehaviorSubject, of } from 'rxjs';
import { catchError, mapTo, tap } from 'rxjs/operators';
import { Role, User } from './models';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private _user$ = new BehaviorSubject<User | null>(null);
  user$ = this._user$.asObservable();
  constructor(private http: HttpClient, private router: Router) {}
  get user() { return this._user$.value; }
  get isLoggedIn() { return !!this.user; }
  get isAdmin() { return this.user?.role === 'Admin'; }

  login(body: { userId: string; password: string; role: Role }) {
    return this.http.post<{ token: string; user: User }>('/api/auth/login', body).pipe(
      tap(r => { sessionStorage.setItem('lk_token', r.token); this._user$.next(r.user); }));
  }
  /** Runs via APP_INITIALIZER: rehydrates the session before routing starts. */
  restore(): Promise<void> {
    if (!sessionStorage.getItem('lk_token')) return Promise.resolve();
    return this.http.get<User>('/api/me').pipe(
      tap(u => this._user$.next(u)),
      catchError(() => { sessionStorage.removeItem('lk_token'); return of(null); }),
      mapTo(undefined)).toPromise();
  }
  logout() { sessionStorage.removeItem('lk_token'); this._user$.next(null); this.router.navigate(['/login']); }
}
