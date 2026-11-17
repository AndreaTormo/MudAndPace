import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { AuthStore } from '../../../../core/stores/auth.store';
import { isHttpError } from '../../../../shared/utils/error.util';

@Component({
  selector: 'app-login-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, RouterLink],
  template: `
    <div class="auth-form">
      <h1 class="auth-title">Bienvenido de nuevo</h1>
      <p class="auth-subtitle">Continúa tu camino y descubre nuevos desafíos.</p>

      <form class="auth-fields" [formGroup]="form" (ngSubmit)="onSubmit()">
        <div class="auth-field">
          <label class="auth-label" for="email">Email</label>
          <div class="auth-input-wrap">
            <svg class="auth-input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <rect x="3" y="5" width="18" height="14" rx="2" />
              <path d="M3.5 7l8.5 6 8.5-6" />
            </svg>
            <input
              id="email"
              type="email"
              class="auth-input"
              formControlName="email"
              autocomplete="email"
              placeholder="tu@email.com"
            />
          </div>
          @if (form.controls.email.touched && form.controls.email.invalid) {
            <p class="auth-error">Introduce un email válido.</p>
          }
        </div>

        <div class="auth-field">
          <label class="auth-label" for="password">Contraseña</label>
          <div class="auth-input-wrap">
            <svg class="auth-input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <rect x="4" y="10" width="16" height="11" rx="2" />
              <path d="M8 10V7a4 4 0 018 0v3" />
              <path d="M12 15v2" />
            </svg>
            <input
              id="password"
              [type]="showPassword() ? 'text' : 'password'"
              class="auth-input"
              formControlName="password"
              autocomplete="current-password"
              placeholder="Tu contraseña"
            />
            <button
              type="button"
              class="auth-password-toggle"
              (click)="showPassword.set(!showPassword())"
              [attr.aria-label]="showPassword() ? 'Ocultar contraseña' : 'Mostrar contraseña'"
            >
              @if (showPassword()) {
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                  <path d="M3 3l18 18" />
                  <path d="M10.6 10.7a2 2 0 002.8 2.8" />
                  <path d="M9.5 5.4A10.6 10.6 0 0112 5c5 0 9 4.5 9 7 0 1.1-.8 2.6-2.2 3.9M6.2 6.4C4 8 2.5 10.2 2.5 12c0 2.5 4 7 9.5 7 1.4 0 2.7-.3 3.9-.8" />
                </svg>
              } @else {
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                  <path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z" />
                  <circle cx="12" cy="12" r="2.5" />
                </svg>
              }
            </button>
          </div>
          @if (form.controls.password.touched && form.controls.password.invalid) {
            <p class="auth-error">Introduce tu contraseña.</p>
          }
        </div>

        <div class="auth-options">
          <label class="auth-check">
            <input type="checkbox" [checked]="remember()" (change)="remember.set(!remember())" />
            <span>Mantener sesión iniciada</span>
          </label>
          <button type="button" class="auth-link-button">¿Olvidaste tu contraseña?</button>
        </div>

        @if (errorMessage(); as message) {
          <p class="auth-error-banner" role="alert">{{ message }}</p>
        }

        <button type="submit" class="button-sage auth-submit" [disabled]="submitting()">
          {{ submitting() ? 'Entrando...' : 'Entrar →' }}
        </button>
      </form>

      <p class="auth-footer">
        ¿No tienes cuenta?
        <a routerLink="/auth/register" class="auth-link">Regístrate</a>
      </p>
    </div>
  `
})
export class LoginPage {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthStore);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  protected readonly form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required]]
  });

  protected readonly submitting = signal(false);
  protected readonly errorMessage = signal<string | null>(null);
  protected readonly showPassword = signal(false);
  protected readonly remember = signal(false);

  protected async onSubmit(): Promise<void> {
    if (this.submitting()) return;

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.submitting.set(true);
    this.errorMessage.set(null);

    try {
      await firstValueFrom(this.auth.login(this.form.getRawValue()));
      const returnUrl = this.route.snapshot.queryParamMap.get('returnUrl');
      const target = returnUrl?.startsWith('/') ? returnUrl : '/events';
      await this.router.navigateByUrl(target);
    } catch (error) {
      if (!isHttpError(error)) {
        this.errorMessage.set('No se pudo iniciar sesión. Inténtalo de nuevo.');
      }
    } finally {
      this.submitting.set(false);
    }
  }
}
