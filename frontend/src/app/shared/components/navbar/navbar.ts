import {
  ChangeDetectionStrategy,
  Component,
  HostListener,
  computed,
  inject,
  input,
  signal
} from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { AuthStore } from '../../../core/stores/auth.store';
import { ThemeToggle } from '../theme-toggle/theme-toggle';
import { UserAvatar } from '../user-avatar/user-avatar';

@Component({
  selector: 'app-navbar',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, RouterLinkActive, ThemeToggle, UserAvatar],
  template: `
    <header [class]="headerClass()">
      <nav
        class="mx-auto grid h-16 max-w-7xl grid-cols-[auto_1fr_auto] items-center gap-4 px-4 sm:h-20 sm:px-6 lg:grid-cols-[1fr_auto_1fr] lg:px-8"
        aria-label="Navegación principal"
      >
        <div class="hidden items-center gap-1 lg:flex">
          <a
            routerLink="/events"
            [routerLinkActive]="activeLinkClass()"
            [routerLinkActiveOptions]="{ exact: true }"
            [class]="navLinkClass()"
          >
            Eventos
          </a>
          <a
            routerLink="/shop/experiences"
            [routerLinkActive]="activeLinkClass()"
            [class]="navLinkClass()"
          >
            Shop
          </a>
          @if (isAdmin()) {
            <a
              routerLink="/admin/profiles"
              [routerLinkActive]="activeLinkClass()"
              [class]="navLinkClass()"
            >
              Perfiles
            </a>
          }
        </div>

        <a
          routerLink="/shop"
          [class]="logoClass()"
          aria-label="Mud and Pace, ir a la portada"
        >
          <span class="inline-flex h-9 w-9 items-center justify-center" aria-hidden="true">
            <svg
              viewBox="0 0 32 32"
              class="h-8 w-8"
              fill="none"
              stroke="currentColor"
              stroke-width="2.5"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <path d="M3 23.5L11 11l5 6.5 2.5-3.5L29 23.5" />
              <path d="M5 23.5c4.2-4 8.4-6 12.5-6 3.2 0 6.2 1.2 9.5 3.8" />
              <path d="M8 23.5h16" />
            </svg>
          </span>
          <span class="whitespace-nowrap text-[1.05rem] font-bold tracking-[-0.02em]">
            Mud and Pace
          </span>
        </a>

        <div class="flex items-center justify-end gap-2">
          @if (isAdmin()) {
            <a
              routerLink="/events/create"
              [class]="newEventClass()"
              (click)="closeMenus()"
            >
              + Nuevo evento
            </a>
          }

          <app-theme-toggle />

          @if (isAuthenticated()) {
            <div class="relative hidden sm:block" data-profile-menu>
              <button
                type="button"
                [class]="profileButtonClass()"
                (click)="toggleProfileMenu()"
                [attr.aria-expanded]="profileMenuOpen()"
                aria-controls="profile-menu"
                aria-label="Abrir menú de usuario"
              >
                <app-user-avatar
                  [name]="displayName()"
                  [avatarUrl]="user()?.profile?.avatarUrl ?? null"
                />
                <span class="hidden max-w-[7rem] truncate text-sm font-medium md:inline">
                  {{ displayName() }}
                </span>
                <svg
                  class="h-3.5 w-3.5 shrink-0 transition-transform"
                  [class.rotate-180]="profileMenuOpen()"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2.2"
                  aria-hidden="true"
                >
                  <path stroke-linecap="round" stroke-linejoin="round" d="M6 9l6 6 6-6" />
                </svg>
              </button>

              @if (profileMenuOpen()) {
                <div
                  id="profile-menu"
                  class="shop-landing absolute right-0 mt-2 w-64 rounded-2xl border border-line bg-surface p-2 text-gray-800 shadow-2xl"
                >
                  <div class="px-3 py-2">
                    <p class="truncate text-sm font-semibold text-gray-900">
                      {{ displayName() }}
                    </p>
                    @if (user(); as currentUser) {
                      <p class="truncate text-xs text-gray-500">{{ currentUser.email }}</p>
                    }
                  </div>
                  <a
                    routerLink="/profile"
                    class="block rounded-xl px-3 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100"
                    (click)="closeMenus()"
                  >
                    Mi perfil
                  </a>
                  @if (isAdmin()) {
                    <a
                      routerLink="/admin/profiles"
                      class="block rounded-xl px-3 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100"
                      (click)="closeMenus()"
                    >
                      Perfiles de usuarios
                    </a>
                    <a
                      routerLink="/admin/comments"
                      class="block rounded-xl px-3 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100"
                      (click)="closeMenus()"
                    >
                      Comentarios
                    </a>
                    <a
                      routerLink="/admin/analytics"
                      class="block rounded-xl px-3 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100"
                      (click)="closeMenus()"
                    >
                      Análisis IA
                    </a>
                    <a
                      routerLink="/events/trash"
                      class="block rounded-xl px-3 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100"
                      (click)="closeMenus()"
                    >
                      Papelera de eventos
                    </a>
                  }
                  <button
                    type="button"
                    class="block w-full rounded-xl px-3 py-2 text-left text-sm font-medium text-red-600 transition-colors hover:bg-red-50"
                    (click)="logout()"
                  >
                    Cerrar sesión
                  </button>
                </div>
              }
            </div>
          }

          <button
            type="button"
            [class]="hamburgerClass()"
            (click)="menuOpen.set(!menuOpen())"
            [attr.aria-expanded]="menuOpen()"
            aria-controls="mobile-menu"
            [attr.aria-label]="menuOpen() ? 'Cerrar menú de navegación' : 'Abrir menú de navegación'"
          >
            @if (menuOpen()) {
              <svg
                class="h-5 w-5"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                aria-hidden="true"
              >
                <path d="M6 6l12 12M18 6L6 18" />
              </svg>
            } @else {
              <svg
                class="h-5 w-5"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                aria-hidden="true"
              >
                <path d="M4 7h16M4 12h16M4 17h16" />
              </svg>
            }
          </button>
        </div>
      </nav>

      @if (menuOpen()) {
        <div id="mobile-menu" [class]="mobileMenuClass()">
          <div class="flex items-center justify-between rounded-xl px-3 py-2">
            <span class="text-sm font-medium text-gray-700">Tema</span>
            <app-theme-toggle />
          </div>
          @if (isAuthenticated()) {
            <div class="mb-3 flex items-center gap-3 rounded-xl bg-gray-50 px-3 py-2">
              <app-user-avatar
                [name]="displayName()"
                [avatarUrl]="user()?.profile?.avatarUrl ?? null"
              />
              <div class="min-w-0">
                <p class="truncate text-sm font-semibold text-gray-900">{{ displayName() }}</p>
                @if (user(); as currentUser) {
                  <p class="truncate text-xs text-gray-500">{{ currentUser.email }}</p>
                }
              </div>
            </div>
          }
          <a
            routerLink="/events"
            routerLinkActive="bg-brand/10 text-brand"
            [routerLinkActiveOptions]="{ exact: true }"
            class="block rounded-xl px-3 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100"
            (click)="closeMenus()"
          >
            Eventos
          </a>
          <a
            routerLink="/shop/experiences"
            routerLinkActive="bg-brand/10 text-brand"
            class="block rounded-xl px-3 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100"
            (click)="closeMenus()"
          >
            Shop
          </a>
          @if (isAdmin()) {
            <a
              routerLink="/admin/profiles"
              routerLinkActive="bg-brand/10 text-brand"
              class="block rounded-xl px-3 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100"
              (click)="closeMenus()"
            >
              Perfiles de usuarios
            </a>
            <a
              routerLink="/admin/comments"
              routerLinkActive="bg-brand/10 text-brand"
              class="block rounded-xl px-3 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100"
              (click)="closeMenus()"
            >
              Comentarios
            </a>
            <a
              routerLink="/events/create"
              routerLinkActive="bg-brand/10 text-brand"
              class="block rounded-xl px-3 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100"
              (click)="closeMenus()"
            >
              + Nuevo evento
            </a>
            <a
              routerLink="/events/trash"
              routerLinkActive="bg-brand/10 text-brand"
              class="block rounded-xl px-3 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100"
              (click)="closeMenus()"
            >
              Papelera de eventos
            </a>
          }
          <a
            routerLink="/profile"
            routerLinkActive="bg-brand/10 text-brand"
            class="block rounded-xl px-3 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100"
            (click)="closeMenus()"
          >
            Mi perfil
          </a>
          <button
            type="button"
            class="block w-full rounded-xl px-3 py-2 text-left text-sm font-medium text-red-600 transition-colors hover:bg-red-50"
            (click)="logout()"
          >
            Cerrar sesión
          </button>
        </div>
      }
    </header>
  `
})
export class Navbar {
  private readonly auth = inject(AuthStore);
  private readonly router = inject(Router);

  readonly overlay = input(false);

  protected readonly menuOpen = signal(false);
  protected readonly profileMenuOpen = signal(false);
  protected readonly scrolled = signal(
    typeof window !== 'undefined' ? window.scrollY > 24 : false
  );

  protected readonly user = this.auth.user;
  protected readonly isAuthenticated = () => this.auth.isAuthenticated();
  protected readonly isAdmin = this.auth.isAdmin;
  protected readonly displayName = computed(
    () => this.user()?.name ?? this.auth.username() ?? ''
  );
  protected readonly atTop = computed(() => this.overlay() && !this.scrolled());

  protected readonly headerClass = computed(() => {
    if (!this.overlay()) {
      return 'sticky top-0 z-40 border-b border-gray-200/80 bg-gray-50/90 backdrop-blur transition-colors duration-300 dark:border-line dark:bg-night2/95';
    }

    return this.scrolled()
      ? 'fixed inset-x-0 top-0 z-40 border-b border-[#D3CDBE] bg-cream/95 text-forest backdrop-blur transition-colors duration-300 dark:border-line dark:bg-[#1A2118]/95 dark:text-gray-900'
      : 'nav-overlay-top fixed inset-x-0 top-0 z-40 bg-gradient-to-b from-[#14220e]/80 via-[#14220e]/35 to-transparent text-cream transition-colors duration-300';
  });

  protected readonly navLinkClass = computed(() => {
    if (this.atTop()) {
      return 'rounded-full px-4 py-2 text-sm font-medium text-cream/90 transition-colors hover:bg-cream/10 hover:text-cream focus-visible:outline-cream';
    }
    return 'rounded-full px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100 hover:text-gray-900';
  });

  protected readonly activeLinkClass = computed(() => {
    if (this.atTop()) {
      return 'text-cream';
    }
    return this.overlay() ? 'text-forest dark:text-brand' : 'text-brand';
  });

  protected readonly logoClass = computed(() => {
    const base = 'font-display flex items-center gap-2.5 justify-self-start rounded-xl transition-colors duration-300 focus-visible:outline-2 focus-visible:outline-offset-4 lg:justify-self-center';
    if (!this.overlay()) {
      return `${base} text-gray-900 dark:text-gray-900`;
    }
    return `${base} ${this.atTop() ? 'text-cream focus-visible:outline-cream' : 'text-forest dark:text-gray-900 focus-visible:outline-forest'}`;
  });

  protected readonly newEventClass = computed(() => {
    if (this.atTop()) {
      return 'hidden rounded-full border border-cream/80 px-5 py-2.5 text-sm font-medium text-cream transition-colors hover:bg-cream/10 focus-visible:outline-cream md:inline-flex';
    }
    return 'button-primary hidden whitespace-nowrap !rounded-full md:inline-flex';
  });

  protected readonly profileButtonClass = computed(() => {
    if (this.atTop()) {
      return 'flex items-center gap-2 rounded-full border border-cream/30 bg-cream/10 p-1 pr-2 text-cream transition-colors hover:bg-cream/20 focus-visible:outline-cream';
    }
    return 'flex items-center gap-2 rounded-full border border-gray-200 bg-surface p-1 pr-2 text-gray-700 transition-colors hover:bg-gray-100 dark:border-line dark:bg-night2';
  });

  protected readonly hamburgerClass = computed(() => {
    if (this.atTop()) {
      return 'grid h-10 w-10 place-items-center rounded-full border border-cream/40 text-cream transition-colors hover:bg-cream/10 focus-visible:outline-cream lg:hidden';
    }
    return 'grid h-10 w-10 place-items-center rounded-full border border-gray-200 text-gray-700 transition-colors hover:bg-gray-100 lg:hidden';
  });

  protected readonly mobileMenuClass = computed(() => {
    const base = 'space-y-1 px-4 py-3 shadow-xl lg:hidden';
    if (this.overlay()) {
      return `${base} shop-landing absolute inset-x-0 top-full border-t border-line bg-surface text-gray-800`;
    }
    return `${base} border-t border-gray-100`;
  });

  @HostListener('window:scroll')
  protected onWindowScroll(): void {
    this.scrolled.set(window.scrollY > 24);
  }

  @HostListener('document:click', ['$event'])
  protected onDocumentClick(event: MouseEvent): void {
    const target = event.target as Element | null;
    if (!target?.closest('[data-profile-menu]')) {
      this.profileMenuOpen.set(false);
    }
  }

  @HostListener('document:keydown.escape')
  protected onEscape(): void {
    this.closeMenus();
  }

  protected toggleProfileMenu(): void {
    this.profileMenuOpen.update((open) => !open);
    this.menuOpen.set(false);
  }

  protected closeMenus(): void {
    this.menuOpen.set(false);
    this.profileMenuOpen.set(false);
  }

  protected async logout(): Promise<void> {
    this.closeMenus();
    try {
      await firstValueFrom(this.auth.logout());
    } catch {
      // AuthStore limpia la sesión local aunque el servidor no responda.
    } finally {
      await this.router.navigate(['/auth/login']);
    }
  }
}
