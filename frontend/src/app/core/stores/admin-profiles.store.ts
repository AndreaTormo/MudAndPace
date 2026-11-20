import { Injectable, computed, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { AdminProfile } from '../models/auth.model';
import { PaginationMeta } from '../models/pagination.model';
import { UserService } from '../services/user.service';
import { hasProfileData } from '../../shared/utils/profile.util';

const PAGE_SIZE = 10;

@Injectable({ providedIn: 'root' })
export class AdminProfilesStore {
  private readonly users = inject(UserService);

  private readonly _profiles = signal<AdminProfile[]>([]);
  private readonly _loading = signal(false);
  private readonly _error = signal<string | null>(null);
  private readonly _loaded = signal(false);
  private readonly _page = signal(1);

  readonly profiles = this._profiles.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly error = this._error.asReadonly();
  readonly loaded = this._loaded.asReadonly();

  readonly count = computed(() => this._profiles().length);
  readonly adminCount = computed(
    () => this._profiles().filter((item) => item.user.canManage === true).length
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

  readonly pagination = computed<PaginationMeta>(() => {
    const total = this._profiles().length;
    const totalPages = Math.ceil(total / PAGE_SIZE);
    return {
      total,
      page: Math.min(this._page(), Math.max(1, totalPages)),
      limit: PAGE_SIZE,
      totalPages
    };
  });

  readonly visibleProfiles = computed(() => {
    const { page, limit } = this.pagination();
    const start = (page - 1) * limit;
    return this._profiles().slice(start, start + limit);
  });

  setPage(page: number): void {
    const { totalPages } = this.pagination();
    this._page.set(Math.max(1, Math.min(page, Math.max(1, totalPages))));
  }

  async load(): Promise<void> {
    if (this._loading()) return;

    this._loading.set(true);
    this._error.set(null);

    try {
      const profiles = await firstValueFrom(this.users.getAllProfiles());
      this._profiles.set(profiles);
      this._page.set(1);
      this._loaded.set(true);
    } catch {
      this._error.set('No se han podido cargar los perfiles. Inténtalo de nuevo.');
    } finally {
      this._loading.set(false);
    }
  }
}
