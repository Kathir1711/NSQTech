import { Component } from '@angular/core';
import { RecordItem, track } from '../../core/models';
import { RecordsService, UserService } from '../../core/data.service';

/** Profile and records are fetched independently and in parallel; each block shows its own skeleton and load time. */
@Component({
  template: `
  <div class="page">
    <section class="card">
      <ng-container *ngIf="profile$ | async as p">
        <div *ngIf="p.loading; else done"><div class="skel" style="width:40%;height:26px"></div><div class="skel" style="width:70%;margin-top:12px"></div></div>
        <ng-template #done>
          <p class="err" *ngIf="p.error">{{ p.error }}</p>
          <div class="row" *ngIf="p.data as u">
            <div class="grow"><h1>{{ u.name }}</h1><span class="muted">{{ u.userId }}, {{ u.email }}</span></div>
            <span class="badge" [class.admin]="u.role === 'Admin'">{{ u.role }}</span>
            <span class="muted">Last sign-in {{ u.lastLogin | date:'medium' }}. Profile loaded in {{ p.ms }}ms</span>
          </div>
        </ng-template>
      </ng-container>
    </section>

    <section class="card" *ngIf="records$ | async as r">
      <div class="row"><h2 class="grow">Records for your access level</h2>
        <span class="muted" *ngIf="r.data">{{ count(r.data, true) }} open, {{ count(r.data, false) }} locked. Loaded in {{ r.ms }}ms</span></div>
      <p class="err" *ngIf="r.error">{{ r.error }}</p>
      <table>
        <thead><tr><th>ID</th><th>Title</th><th>Category</th><th>Owner</th><th>Updated</th><th>Access</th></tr></thead>
        <tbody>
          <ng-container *ngIf="r.loading"><tr *ngFor="let i of [1,2,3,4,5]"><td colspan="6"><div class="skel"></div></td></tr></ng-container>
          <tr *ngFor="let x of r.data" [class.locked]="!x.granted">
            <td>{{ x.id }}</td><td>{{ x.title }}</td><td>{{ x.category }}</td><td>{{ x.owner }}</td><td>{{ x.updatedAt | date:'mediumDate' }}</td>
            <td><span class="badge" [ngClass]="x.granted ? 'ok' : 'no'">{{ x.granted ? 'Open' : 'Needs ' + x.access }}</span></td>
          </tr>
        </tbody>
      </table>
    </section>
  </div>`
})
export class DashboardComponent {
  profile$ = track(this.users.me());
  records$ = track(this.records.list());
  constructor(private users: UserService, private records: RecordsService) {}
  count(list: RecordItem[], granted: boolean) { return list.filter(r => r.granted === granted).length; }
}
