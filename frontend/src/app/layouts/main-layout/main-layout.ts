import { ChangeDetectionStrategy, Component, computed, effect, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { filter, map } from 'rxjs/operators';
import { AuthStore } from '../../core/stores/auth.store';
import { Navbar } from '../../shared/components/navbar/navbar';
import { Sidebar } from '../../shared/components/sidebar/sidebar';
import { Loader } from '../../shared/components/loader/loader';
import { ChatWidget } from '../../shared/components/chat-widget/chat-widget';

@Component({
  selector: 'app-main-layout',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterOutlet, Navbar, Sidebar, Loader, ChatWidget],
  template: `
    <div class="min-h-screen bg-gray-50" [class.admin-shell]="isAdminShell()">
      <div class="mountain-backdrop" aria-hidden="true"></div>
      <div class="mountain-fade" aria-hidden="true"></div>
      <div class="relative z-10">
        <app-navbar [overlay]="isShopHome()" />
        <app-loader />
        <div class="flex">
          @if (!isShopHome()) {
            <app-sidebar />
          }
          <main class="min-w-0 flex-1">
            <router-outlet />
          </main>
        </div>
        @defer (on idle) {
          <app-chat-widget />
        }
      </div>
    </div>
  `
})
export class MainLayout {
  private readonly auth = inject(AuthStore);
  private readonly router = inject(Router);

  protected readonly isShopHome = toSignal(
    this.router.events.pipe(
      filter((event): event is NavigationEnd => event instanceof NavigationEnd),
      map((event) => event.urlAfterRedirects.split('?')[0] === '/shop')
    ),
    {
      initialValue: ['/', '/shop'].includes(this.router.url.split('?')[0])
    }
  );

  private readonly isAdmin = this.auth.isAdmin;
  protected readonly isAdminShell = computed(() => this.isAdmin() && !this.isShopHome());

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
