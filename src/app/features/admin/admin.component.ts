import { Component, OnInit } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { LoadState, track, User } from '../../core/models';
import { UserService } from '../../core/data.service';

@Component({
  template: `
  <div class="page">
    <form class="card row" [formGroup]="f" (ngSubmit)="add()">
      <div class="field"><label for="a">User ID</label><input id="a" formControlName="userId"></div>
      <div class="field"><label for="b">Full name</label><input id="b" formControlName="name"></div>
      <div class="field"><label for="c">Email</label><input id="c" formControlName="email" type="email"></div>
      <div class="field"><label for="d">Password</label><input id="d" formControlName="password" type="password"></div>
      <div class="field"><label for="e">Role</label><select id="e" formControlName="role"><option>General User</option><option>Admin</option></select></div>
      <button class="btn" [disabled]="f.invalid || adding">{{ adding ? 'Adding…' : 'Add user' }}</button>
      <p class="err" *ngIf="error" role="alert">{{ error }}</p>
    </form>

    <section class="card">
      <div class="row"><h2 class="grow">Users</h2><span class="muted" *ngIf="state.ms">Loaded in {{ state.ms }}ms</span></div>
      <p class="err" *ngIf="state.error">{{ state.error }}</p>
      <table>
        <thead><tr><th>User</th><th>Role</th><th>Status</th><th></th></tr></thead>
        <tbody>
          <ng-container *ngIf="state.loading"><tr *ngFor="let i of [1,2,3]"><td colspan="4"><div class="skel"></div></td></tr></ng-container>
          <tr *ngFor="let u of state.data" [style.opacity]="busy.has(u.id) ? .5 : 1">
            <td><b>{{ u.name }}</b><br><span class="muted">{{ u.userId }}</span></td>
            <td><select [value]="u.role" [disabled]="busy.has(u.id)" (change)="act(u, { role: $any($event.target).value })"><option>General User</option><option>Admin</option></select></td>
            <td><span class="badge" [ngClass]="u.active ? 'ok' : 'no'">{{ u.active ? 'Active' : 'Disabled' }}</span></td>
            <td class="row">
              <button class="btn ghost sm" [disabled]="busy.has(u.id)" (click)="act(u, { active: !u.active })">{{ u.active ? 'Disable' : 'Enable' }}</button>
              <button class="btn danger sm" [disabled]="busy.has(u.id)" (click)="remove(u)">Delete</button>
            </td>
          </tr>
        </tbody>
      </table>
    </section>
  </div>`
})
export class AdminComponent implements OnInit {
  state: LoadState<User[]> = { loading: true };
  busy = new Set<string>(); adding = false; error = '';
  f = this.fb.group({ userId: ['', Validators.required], name: ['', Validators.required], email: [''], password: ['', Validators.required], role: ['General User'] });
  constructor(private fb: FormBuilder, private users: UserService) {}
  ngOnInit() { this.load(); }
  load() { track(this.users.list()).subscribe(s => this.state = s); }
  add() {
    this.adding = true; this.error = '';
    this.users.create(this.f.value).subscribe({
      next: u => { this.state.data = [...this.state.data, u]; this.f.reset({ role: 'General User' }); this.adding = false; },
      error: e => { this.error = e.error?.message; this.adding = false; }
    });
  }
  /** Row-level pending state: the row dims while its own request is in flight; other rows stay usable. */
  act(u: User, patch: Partial<User>) {
    this.busy.add(u.id);
    this.users.update(u.id, patch).subscribe({
      next: n => { this.state.data = this.state.data.map(x => x.id === n.id ? n : x); this.busy.delete(u.id); },
      error: e => { this.error = e.error?.message; this.busy.delete(u.id); this.load(); }
    });
  }
  remove(u: User) {
    this.busy.add(u.id);
    this.users.remove(u.id).subscribe({
      next: () => { this.state.data = this.state.data.filter(x => x.id !== u.id); this.busy.delete(u.id); },
      error: e => { this.error = e.error?.message; this.busy.delete(u.id); }
    });
  }
}
