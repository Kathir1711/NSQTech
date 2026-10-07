import { Observable, of } from 'rxjs';
import { catchError, map, startWith } from 'rxjs/operators';

export type Role = 'General User' | 'Admin';
export interface User { id: string; userId: string; name: string; email: string; role: Role; active: boolean; lastLogin?: string }
export interface RecordItem { id: string; title: string; owner: string; category: string; updatedAt: string; access: Role; granted: boolean }

/** Wraps a request into a stream of {loading, data, error, ms} so each UI block renders its own async state. */
export interface LoadState<T> { loading: boolean; data?: T; error?: string; ms?: number }
export function track<T>(src: Observable<T>): Observable<LoadState<T>> {
  const t = performance.now();
  return src.pipe(
    map(data => ({ loading: false, data, ms: Math.round(performance.now() - t) } as LoadState<T>)),
    catchError(e => of({ loading: false, error: e?.error?.message || 'Request failed. Try again.' } as LoadState<T>)),
    startWith({ loading: true } as LoadState<T>)
  );
}
