import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink, RouterOutlet } from '@angular/router';
import { ThemeToggle } from '../../shared/components/theme-toggle/theme-toggle';

@Component({
  selector: 'app-auth-layout',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, RouterOutlet, ThemeToggle],
  template: `
    <div class="relative min-h-screen overflow-hidden bg-gray-50">
      <div class="mountain-backdrop" aria-hidden="true"></div>
      <div class="mountain-fade" aria-hidden="true"></div>

      <div class="relative z-10 flex min-h-screen flex-col">
        <header
          class="mx-auto flex h-16 w-full max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8"
        >
          <a routerLink="/auth/login" class="flex items-center gap-2.5 text-gray-900 dark:text-[#EAF1E3]" style="font-family: Inter, system-ui, sans-serif;" aria-label="Mud and Pace">
            <span class="inline-flex h-9 w-9 items-center justify-center text-brand" aria-hidden="true">
              <svg viewBox="0 0 32 32" class="h-8 w-8" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M3 23.5L11 11l5 6.5 2.5-3.5L29 23.5" />
                <path d="M5 23.5c4.2-4 8.4-6 12.5-6 3.2 0 6.2 1.2 9.5 3.8" />
                <path d="M8 23.5h16" />
              </svg>
            </span>
            <span class="text-[1.05rem] font-semibold tracking-[-0.02em]">Mud and Pace</span>
          </a>
          <div class="flex items-center gap-3">
            <span class="hidden text-sm text-gray-500 sm:inline">Acceso a la plataforma</span>
            <app-theme-toggle />
          </div>
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
