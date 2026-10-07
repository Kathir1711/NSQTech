import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

/** Holds the simulated-latency setting (sent as ?delay=) and the count of in-flight API calls. */
@Injectable({ providedIn: 'root' })
export class LatencyService {
  private _delay = Number(sessionStorage.getItem('lk_delay') || 0);
  private _pending = new BehaviorSubject(0);
  pending$ = this._pending.asObservable();
  get delay() { return this._delay; }
  set delay(v: number) { this._delay = v; sessionStorage.setItem('lk_delay', String(v)); }
  bump(n: number) { Promise.resolve().then(() => this._pending.next(this._pending.value + n)); }
}
