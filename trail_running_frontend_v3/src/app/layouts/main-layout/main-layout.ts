import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
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
      <app-navbar />
      <app-loader />
      <div class="flex">
        <app-sidebar />
        <main class="min-w-0 flex-1">
          <router-outlet />
        </main>
      </div>
    </div>
  `
})
export class MainLayout {}
