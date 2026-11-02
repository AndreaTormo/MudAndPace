import { ChangeDetectionStrategy, Component, effect, inject } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
import { AuthStore } from '../../core/stores/auth.store';
import { Navbar } from '../../shared/components/navbar/navbar';
import { Sidebar } from '../../shared/components/sidebar/sidebar';
import { Loader } from '../../shared/components/loader/loader';

@Component({
  selector: 'app-main-layout',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterOutlet, Navbar, Sidebar, Loader],
  template: `
    <div class="min-h-screen bg-gray-50">
      <div class="mountain-backdrop" aria-hidden="true"></div>
      <div class="mountain-fade" aria-hidden="true"></div>
      <div class="relative z-10">
        <app-navbar />
        <app-loader />
        <div class="flex">
          <app-sidebar />
          <main class="min-w-0 flex-1">
            <router-outlet />
          </main>
        </div>
      </div>
    </div>
  `
})
export class MainLayout {
  private readonly auth = inject(AuthStore);
  private readonly router = inject(Router);

  constructor() {
    if (this.auth.isAuthenticated()) {
      this.auth.refreshMe().subscribe({ error: () => undefined });
    }
  }

  private readonly redirectOnExpiry = effect(() => {
    if (this.auth.sessionExpired() && !this.router.url.startsWith('/auth')) {
      void this.router.navigate(['/auth/login'], {
        queryParams: { returnUrl: this.router.url }
      });
    }
  });
}
