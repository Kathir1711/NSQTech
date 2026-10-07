import { Component } from '@angular/core';
import { AuthService } from './core/auth.service';
import { LatencyService } from './core/latency.service';

@Component({
  selector: 'lk-root',
  template: `
  <div class="bar" [class.on]="(latency.pending$ | async) > 0" aria-hidden="true"></div>
  <header>
    <a class="brand" routerLink="/app">Ledgerkey</a>
    <nav *ngIf="auth.user$ | async as u">
      <a routerLink="/app" routerLinkActive="act" [routerLinkActiveOptions]="{exact:true}">My access</a>
      <a *ngIf="u.role === 'Admin'" routerLink="/app/admin" routerLinkActive="act">Manage users</a>
    </nav>
    <span class="grow"></span>
    <label class="lat" title="Adds ?delay=ms to every API call">
      API latency <input type="range" min="0" max="5000" step="250" [(ngModel)]="latency.delay"> {{ latency.delay / 1000 }}s
    </label>
    <ng-container *ngIf="auth.user$ | async as u">
      <span class="muted">{{ u.name }}</span>
      <button class="btn ghost sm" (click)="auth.logout()">Sign out</button>
    </ng-container>
  </header>
  <router-outlet></router-outlet>`,
  styles: [`
    header{display:flex;gap:18px;align-items:center;padding:12px 20px;background:var(--card);border-bottom:1px solid var(--line);flex-wrap:wrap}
    .brand{font-size:1.4rem;font-weight:700;text-decoration:none;color:var(--ink)}
    nav a{margin-right:14px;color:var(--ink2);text-decoration:none;padding-bottom:3px}
    nav a.act{color:var(--ink);border-bottom:2px solid var(--amber)}
    .lat{font-size:.82rem;color:var(--ink2);display:flex;gap:8px;align-items:center}.lat input{padding:0}
    .bar{height:3px;background:var(--amber);transform:scaleX(0);transform-origin:left;transition:transform .2s}
    .bar.on{transform:scaleX(1);transition:transform 5s cubic-bezier(.1,.8,.3,1)}
    .grow{flex:1}`]
})
export class AppComponent { constructor(public auth: AuthService, public latency: LatencyService) {} }
