import { Injectable, signal } from '@angular/core';

export type UserRole = 'admin' | 'user';

@Injectable({ providedIn: 'root' })
export class AuthStore {
  private readonly _role = signal<UserRole>('admin');

  readonly role = this._role.asReadonly();
  readonly isAdmin = signal(true);

  setRole(role: UserRole): void {
    this._role.set(role);
    this.isAdmin.set(role === 'admin');
  }
}
