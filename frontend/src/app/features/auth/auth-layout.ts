import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink, RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-auth-layout',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, RouterOutlet],
  template: `
    <div class="relative min-h-screen overflow-hidden bg-gray-50">
      <div class="mountain-backdrop" aria-hidden="true"></div>
      <div class="mountain-fade" aria-hidden="true"></div>

      <div class="relative z-10 flex min-h-screen flex-col">
        <header
          class="mx-auto flex h-16 w-full max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8"
        >
          <a routerLink="/auth/login" class="flex items-center gap-2 text-lg font-semibold text-gray-900">
            <img
              src="logo.png"
              alt="Mud and Pace"
              width="32"
              height="32"
              class="h-8 w-8 rounded-lg object-cover"
            />
            <span>Mud and Pace</span>
          </a>
          <span class="text-sm text-gray-500">Acceso a la plataforma</span>
        </header>

        <main class="flex flex-1 items-start justify-center px-4 py-10 sm:px-6 sm:py-16">
          <div class="w-full max-w-md">
            <router-outlet />
          </div>
        </main>
      </div>
    </div>
  `
})
export class AuthLayout {}
