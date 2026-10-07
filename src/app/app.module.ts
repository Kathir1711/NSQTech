import { APP_INITIALIZER, NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { FormsModule } from '@angular/forms';
import { HTTP_INTERCEPTORS, HttpClientModule } from '@angular/common/http';
import { RouterModule, Routes } from '@angular/router';
import { AppComponent } from './app.component';
import { ApiInterceptor } from './core/api.interceptor';
import { AuthService } from './core/auth.service';
import { AdminGuard, AuthGuard } from './core/guards';

const routes: Routes = [
  { path: 'login', loadChildren: () => import('./features/auth/auth.module').then(m => m.AuthModule) },
  { path: 'app/admin', canLoad: [AuthGuard, AdminGuard], loadChildren: () => import('./features/admin/admin.module').then(m => m.AdminModule) },
  { path: 'app', canLoad: [AuthGuard], loadChildren: () => import('./features/dashboard/dashboard.module').then(m => m.DashboardModule) },
  { path: '**', redirectTo: 'app' }
];

@NgModule({
  declarations: [AppComponent],
  imports: [BrowserModule, FormsModule, HttpClientModule, RouterModule.forRoot(routes)],
  providers: [
    { provide: HTTP_INTERCEPTORS, useClass: ApiInterceptor, multi: true },
    { provide: APP_INITIALIZER, multi: true, deps: [AuthService], useFactory: (a: AuthService) => () => a.restore() }
  ],
  bootstrap: [AppComponent]
})
export class AppModule {}
