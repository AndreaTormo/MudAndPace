import { Injectable, computed, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { AdminProfile } from '../models/auth.model';
import { UserService } from '../services/user.service';
import { hasProfileData } from '../../shared/utils/profile.util';

@Injectable({ providedIn: 'root' })
export class AdminProfilesStore {
  private readonly users = inject(UserService);

  private readonly _profiles = signal<AdminProfile[]>([]);
  private readonly _loading = signal(false);
  private readonly _error = signal<string | null>(null);
  private readonly _loaded = signal(false);

  readonly profiles = this._profiles.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly error = this._error.asReadonly();
  readonly loaded = this._loaded.asReadonly();

  readonly count = computed(() => this._profiles().length);
  readonly adminCount = computed(
    () => this._profiles().filter((item) => item.user.role === 'ADMIN').length
  );
  readonly activeCount = computed(
    () =>
      this._profiles().filter(
        (item) =>
          item.user.isActive &&
          item.user.status !== 'inactive' &&
          item.user.status !== 'blocked'
      ).length
  );
  readonly incompleteCount = computed(
    () => this._profiles().filter((item) => !hasProfileData(item)).length
  );
  readonly isEmpty = computed(
    () => !this._loading() && !this._error() && this._profiles().length === 0
  );

  async load(): Promise<void> {
    if (this._loading()) return;

    this._loading.set(true);
    this._error.set(null);

    try {
      const profiles = await firstValueFrom(this.users.getAllProfiles());
      this._profiles.set(profiles);
      this._loaded.set(true);
    } catch {
      this._error.set('No se han podido cargar los perfiles. Inténtalo de nuevo.');
    } finally {
      this._loading.set(false);
    }
  }
}
