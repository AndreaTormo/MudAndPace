import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { ThemeToggle } from '../../shared/components/theme-toggle/theme-toggle';

@Component({
  selector: 'app-auth-layout',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, RouterLinkActive, RouterOutlet, ThemeToggle],
  template: `
    <div class="auth-shell">
      <img class="auth-photo" src="/auth-mountain.png" alt="" aria-hidden="true" />
      <div class="auth-shade" aria-hidden="true"></div>
      <div class="auth-topo" aria-hidden="true"></div>

      <div class="auth-content">
        <header class="auth-header">
          <a routerLink="/auth/login" class="auth-brand" aria-label="Mud and Pace">
            <img class="auth-logo auth-logo-light" src="/logo-light.svg" alt="" />
            <img class="auth-logo auth-logo-dark" src="/logo-dark.svg" alt="" />
            <span>Mud and Pace</span>
          </a>
          <div class="auth-header-right">
            <span class="auth-header-text">Acceso a la plataforma</span>
            <app-theme-toggle />
          </div>
        </header>

        <main class="auth-main">
          <section class="auth-pane">
            <div class="auth-form-area">
              <div class="auth-card">
                <nav class="auth-tabs" aria-label="Acceso">
                  <a
                    routerLink="/auth/login"
                    routerLinkActive="is-active"
                    ariaCurrentWhenActive="page"
                    class="auth-tab"
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                      <path d="M15 17h5v-1a5 5 0 00-5-5" />
                      <circle cx="9" cy="8" r="3.5" />
                      <path d="M3.5 19a5.5 5.5 0 0111 0" />
                    </svg>
                    <span>Iniciar sesión</span>
                  </a>
                  <a
                    routerLink="/auth/register"
                    routerLinkActive="is-active"
                    ariaCurrentWhenActive="page"
                    class="auth-tab"
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                      <path d="M15 20v-1.5a4.5 4.5 0 00-4.5-4.5H6A4.5 4.5 0 001.5 18.5V20" />
                      <circle cx="8.25" cy="7.5" r="3.25" />
                      <path d="M18 8v6M15 11h6" />
                    </svg>
                    <span>Registrarse</span>
                  </a>
                </nav>
                <router-outlet />
              </div>
            </div>
          </section>

          <section class="auth-visual" aria-hidden="true">
            <div class="auth-quote">
              <span>EL ASFALTO SE ACABA.</span> 
              <span>LA AVENTURA COMIENZA.</span>
              <i></i>
            </div>
          </section>
        </main>
      </div>
    </div>
  `
})
export class AuthLayout {}
