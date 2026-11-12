import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ThemeStore } from '../../../core/stores/theme.store';

@Component({
  selector: 'app-theme-toggle',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <button
      type="button"
      class="grid h-10 w-10 place-items-center rounded-lg border border-gray-200 text-gray-700 transition-colors hover:bg-gray-100"
      (click)="theme.toggle()"
      [attr.aria-label]="theme.isDark() ? 'Activar modo claro' : 'Activar modo oscuro'"
      [attr.title]="theme.isDark() ? 'Modo claro' : 'Modo oscuro'"
    >
      @if (theme.isDark()) {
        <svg
          class="h-5 w-5"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
          aria-hidden="true"
        >
          <circle cx="12" cy="12" r="4" />
          <path d="M12 2v2M12 20v2M4.93 4.93l1.42 1.42M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.42-1.42M17.66 6.34l1.41-1.41" />
        </svg>
      } @else {
        <svg
          class="h-5 w-5"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
          aria-hidden="true"
        >
          <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" />
        </svg>
      }
    </button>
  `
})
export class ThemeToggle {
  protected readonly theme = inject(ThemeStore);
}
