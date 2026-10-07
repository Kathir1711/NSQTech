import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { RecordItem, User } from './models';

@Injectable({ providedIn: 'root' })
export class RecordsService {
  constructor(private http: HttpClient) {}
  list() { return this.http.get<RecordItem[]>('/api/records'); }
}
@Injectable({ providedIn: 'root' })
export class UserService {
  constructor(private http: HttpClient) {}
  me() { return this.http.get<User>('/api/me'); }
  list() { return this.http.get<User[]>('/api/users'); }
  create(u: Partial<User> & { password: string }) { return this.http.post<User>('/api/users', u); }
  update(id: string, patch: Partial<User> & { password?: string }) { return this.http.put<User>(`/api/users/${id}`, patch); }
  remove(id: string) { return this.http.delete<void>(`/api/users/${id}`); }
}
