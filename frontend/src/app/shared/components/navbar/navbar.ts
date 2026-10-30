import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { AuthService } from '../../../core/services/auth.service';
import { AuthStore } from '../../../core/stores/auth.store';

@Component({
  selector: 'app-navbar',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, RouterLinkActive],
  template: `
    <header class="sticky top-0 z-40 border-b border-gray-200 bg-white/90 backdrop-blur">
      <nav
        class="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8"
        aria-label="Navegación principal"
      >
        <a routerLink="/events" class="flex items-center gap-2 text-lg font-semibold text-gray-900">
          <img
            src="logo.png"
            alt="Mud and Pace"
            width="32"
            height="32"
            class="h-8 w-8 rounded-lg object-cover"
          />
          <span class="hidden sm:inline">Mud and Pace</span>
        </a>

        <div class="hidden items-center gap-2 sm:flex">
          <a
            routerLink="/events"
            routerLinkActive="text-brand"
            [routerLinkActiveOptions]="{ exact: true }"
            class="rounded-full px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100 hover:text-gray-900"
          >
            Eventos
          </a>
          @if (isAdmin()) {
            <a routerLink="/events/create" class="button-primary">+ Nuevo evento</a>
          }
          @if (user(); as currentUser) {
            <a
              routerLink="/profile"
              routerLinkActive="bg-gray-100"
              class="flex items-center gap-2 rounded-full px-2 py-1.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100"
              [attr.aria-label]="'Ver perfil de ' + currentUser.name"
            >
              <span
                class="grid h-8 w-8 place-items-center rounded-full bg-brand text-xs font-bold text-white"
                aria-hidden="true"
              >
                {{ initial() }}
              </span>
              <span class="hidden max-w-[9rem] truncate md:inline">{{ currentUser.name }}</span>
              @if (isAdmin()) {
                <span class="badge bg-brand/10 text-brand">Admin</span>
              }
            </a>
            <button
              type="button"
              class="rounded-full px-3 py-2 text-sm font-medium text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-900"
              (click)="logout()"
            >
              Salir
            </button>
          }
        </div>

        <button
          type="button"
          class="grid h-10 w-10 place-items-center rounded-lg border border-gray-200 text-gray-700 transition-colors hover:bg-gray-100 sm:hidden"
          (click)="menuOpen.set(!menuOpen())"
          [attr.aria-expanded]="menuOpen()"
          aria-controls="mobile-menu"
          [attr.aria-label]="
            menuOpen() ? 'Cerrar menú de navegación' : 'Abrir menú de navegación'
          "
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
      </nav>

      @if (menuOpen()) {
        <div id="mobile-menu" class="space-y-1 border-t border-gray-100 px-4 py-3 sm:hidden">
          @if (user(); as currentUser) {
            <div class="mb-3 rounded-xl bg-gray-50 px-3 py-2">
              <p class="truncate text-sm font-semibold text-gray-900">{{ currentUser.name }}</p>
              <p class="truncate text-xs text-gray-500">{{ currentUser.email }}</p>
            </div>
          }
          <a
            routerLink="/events"
            routerLinkActive="bg-gray-100 text-brand"
            [routerLinkActiveOptions]="{ exact: true }"
            class="block rounded-lg px-3 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100"
            (click)="menuOpen.set(false)"
          >
            Eventos
          </a>
          @if (isAdmin()) {
            <a
              routerLink="/events/create"
              routerLinkActive="bg-gray-100 text-brand"
              class="block rounded-lg px-3 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100"
              (click)="menuOpen.set(false)"
            >
              + Nuevo evento
            </a>
            <a
              routerLink="/events/trash"
              routerLinkActive="bg-gray-100 text-brand"
              class="block rounded-lg px-3 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100"
              (click)="menuOpen.set(false)"
            >
              Papelera de eventos
            </a>
          }
          <a
            routerLink="/profile"
            routerLinkActive="bg-gray-100 text-brand"
            class="block rounded-lg px-3 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100"
            (click)="menuOpen.set(false)"
          >
            Mi perfil
          </a>
          <button
            type="button"
            class="block w-full rounded-lg px-3 py-2 text-left text-sm font-medium text-red-600 transition-colors hover:bg-red-50"
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
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  protected readonly menuOpen = signal(false);
  protected readonly user = this.auth.user;
  protected readonly isAdmin = this.auth.isAdmin;
  protected readonly initial = computed(() => {
    const name = this.user()?.name?.trim();
    return name ? name.charAt(0).toUpperCase() : '?';
  });

  protected async logout(): Promise<void> {
    this.menuOpen.set(false);
    try {
      await firstValueFrom(this.authService.logout());
    } catch {
      // La sesión local se limpia igualmente aunque el servidor no responda.
    } finally {
      this.auth.clear();
      await this.router.navigate(['/auth/login']);
    }
  }
}
