import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AuthStore } from '../../../core/stores/auth.store';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, RouterLinkActive],
  template: `
    <aside class="sticky top-16 hidden h-[calc(100vh-4rem)] w-56 shrink-0 border-r border-gray-200 bg-white px-4 py-6 lg:block">
      <nav class="space-y-6" aria-label="Navegación lateral">
        <div>
          <p class="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-gray-400">Principal</p>
          <ul class="space-y-1">
            <li>
              <a
                routerLink="/routes"
                routerLinkActive="bg-brand/10 text-brand"
                class="block rounded-lg px-3 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100"
              >
                Rutas
              </a>
            </li>
            <li>
              <a
                routerLink="/events"
                routerLinkActive="bg-brand/10 text-brand"
                class="block rounded-lg px-3 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100"
              >
                Eventos
              </a>
            </li>
          </ul>
        </div>

        @if (auth.isAdmin()) {
          <div>
            <p class="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-gray-400">Administración</p>
            <ul class="space-y-1">
              <li>
                <a
                  routerLink="/routes/trash"
                  routerLinkActive="bg-brand/10 text-brand"
                  class="block rounded-lg px-3 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100"
                >
                  Papelera de rutas
                </a>
              </li>
              <li>
                <a
                  routerLink="/events/trash"
                  routerLinkActive="bg-brand/10 text-brand"
                  class="block rounded-lg px-3 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100"
                >
                  Papelera de eventos
                </a>
              </li>
            </ul>
          </div>
        }
      </nav>
    </aside>
  `
})
export class Sidebar {
  protected readonly auth = inject(AuthStore);
}
