import { Injectable } from '@angular/core';
import { CanActivate, CanLoad, Router } from '@angular/router';
import { AuthService } from './auth.service';

@Injectable({ providedIn: 'root' })
export class AuthGuard implements CanActivate, CanLoad {
  constructor(private auth: AuthService, private router: Router) {}
  canActivate() { return this.auth.isLoggedIn || this.router.parseUrl('/login'); }
  canLoad() { return this.canActivate(); }
}
@Injectable({ providedIn: 'root' })
export class AdminGuard implements CanLoad {
  constructor(private auth: AuthService, private router: Router) {}
  canLoad() { return this.auth.isAdmin || this.router.parseUrl('/app'); }
}
