import { Component } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../core/auth.service';

@Component({
  template: `
  <main class="wrap">
    <section>
      <h1>Know exactly what you can open.</h1>
      <p class="muted">Sign in to see your records. Anything above your access level stays hatched and locked.</p>
      <p class="hint">Demo logins: <b>admin</b> / Admin&#64;123 (Admin) and <b>alice</b> / User&#64;123 (General User)</p>
    </section>
    <form class="card" [formGroup]="f" (ngSubmit)="submit()">
      <div class="field"><label for="u">User ID</label><input id="u" formControlName="userId" autocomplete="username"></div>
      <div class="field"><label for="p">Password</label><input id="p" type="password" formControlName="password" autocomplete="current-password"></div>
      <div class="field"><label for="r">Role</label>
        <select id="r" formControlName="role"><option>General User</option><option>Admin</option></select></div>
      <p class="err" *ngIf="error" role="alert">{{ error }}</p>
      <button class="btn" [disabled]="f.invalid || busy">{{ busy ? 'Signing in…' : 'Sign in' }}</button>
    </form>
  </main>`,
  styles: [`.wrap{max-width:900px;margin:8vh auto;padding:0 20px;display:grid;grid-template-columns:1.2fr 1fr;gap:40px;align-items:center}
    form{display:grid;gap:14px}.hint{font-size:.85rem;padding:10px;border-left:3px solid var(--amber);background:var(--card)}
    @media(max-width:720px){.wrap{grid-template-columns:1fr}}`]
})
export class LoginComponent {
  f = this.fb.group({ userId: ['', Validators.required], password: ['', Validators.required], role: ['General User', Validators.required] });
  busy = false; error = '';
  constructor(private fb: FormBuilder, private auth: AuthService, private router: Router) {}
  submit() {
    this.busy = true; this.error = '';
    this.auth.login(this.f.value).subscribe({
      next: () => this.router.navigate(['/app']),
      error: e => { this.error = e.error?.message || 'Cannot reach the server.'; this.busy = false; }
    });
  }
}
