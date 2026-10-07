import { Injectable } from '@angular/core';
import { HttpEvent, HttpHandler, HttpInterceptor, HttpRequest } from '@angular/common/http';
import { Observable } from 'rxjs';
import { finalize } from 'rxjs/operators';
import { LatencyService } from './latency.service';

@Injectable()
export class ApiInterceptor implements HttpInterceptor {
  constructor(private latency: LatencyService) {}
  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    if (!req.url.startsWith('/api')) return next.handle(req);
    const token = sessionStorage.getItem('lk_token');
    const cloned = req.clone({
      setHeaders: token ? { Authorization: `Bearer ${token}` } : {},
      setParams: this.latency.delay ? { delay: String(this.latency.delay) } : {}
    });
    this.latency.bump(1);
    return next.handle(cloned).pipe(finalize(() => this.latency.bump(-1)));
  }
}
