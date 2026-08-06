import { HttpClient } from '@angular/common/http';
import { computed, inject, Injectable, signal } from '@angular/core';
import { catchError, Observable, of, tap } from 'rxjs';
import { Credentials, Registration, User } from '../models/auth.models';
@Injectable({ providedIn: 'root' }) export class AuthService {
  private readonly http=inject(HttpClient); private readonly current=signal<User|null>(null);
  readonly user=this.current.asReadonly(); readonly isAuthenticated=computed(()=>this.current()!==null);
  login(value:Credentials){return this.http.post<User>('/api/auth/login',value).pipe(tap(user=>this.current.set(user)));}
  register(value:Registration){return this.http.post<User>('/api/auth/register',value).pipe(tap(user=>this.current.set(user)));}
  restore():Observable<User|null>{return this.http.get<User>('/api/auth/me').pipe(tap(user=>this.current.set(user)),catchError(()=>of(null)));}
  logout(){return this.http.post<void>('/api/auth/logout',{}).pipe(tap(()=>this.current.set(null)));}
}
