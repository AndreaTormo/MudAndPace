import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import Swal from 'sweetalert2';
import { RegisterPayload } from '../../../../core/models/auth.model';
import { AuthStore } from '../../../../core/stores/auth.store';
import { isHttpError } from '../../../../shared/utils/error.util';
import { passwordsMatchValidator } from '../../utils/password-match.validator';

const PASSWORD_PATTERN = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/;

@Component({
  selector: 'app-register-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, RouterLink],
  template: `
    <div class="auth-form">
      <h1 class="auth-title">Empieza tu camino</h1>
      <p class="auth-subtitle">Crea tu cuenta y únete a la comunidad.</p>

      <form class="auth-fields" [formGroup]="form" (ngSubmit)="onSubmit()">
        <div class="auth-field">
          <label class="auth-label" for="name">Nombre</label>
          <div class="auth-input-wrap">
            <svg class="auth-input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <circle cx="12" cy="8" r="3.5" />
              <path d="M5 20a7 7 0 0114 0" />
            </svg>
            <input id="name" type="text" class="auth-input" formControlName="name" autocomplete="name" placeholder="Tu nombre" />
          </div>
          @if (form.controls.name.touched && form.controls.name.invalid) {
            <p class="auth-error">El nombre debe tener al menos 2 caracteres.</p>
          }
        </div>

        <div class="auth-field">
          <label class="auth-label" for="email">Email</label>
          <div class="auth-input-wrap">
            <svg class="auth-input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <rect x="3" y="5" width="18" height="14" rx="2" />
              <path d="M3.5 7l8.5 6 8.5-6" />
            </svg>
            <input id="email" type="email" class="auth-input" formControlName="email" autocomplete="email" placeholder="tu@email.com" />
          </div>
          @if (form.controls.email.touched && form.controls.email.invalid) {
            <p class="auth-error">Introduce un email válido.</p>
          }
        </div>

        <div class="auth-grid">
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
                autocomplete="new-password"
                placeholder="Mínimo 8 caracteres"
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
              <p class="auth-error">Mínimo 8 caracteres, con mayúscula, minúscula y número.</p>
            }
          </div>

          <div class="auth-field">
            <label class="auth-label" for="confirmPassword">Repetir contraseña</label>
            <div class="auth-input-wrap">
              <svg class="auth-input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <rect x="4" y="10" width="16" height="11" rx="2" />
                <path d="M8 10V7a4 4 0 018 0v3" />
                <path d="M12 15v2" />
              </svg>
              <input
                id="confirmPassword"
                [type]="showConfirmPassword() ? 'text' : 'password'"
                class="auth-input"
                formControlName="confirmPassword"
                autocomplete="new-password"
                placeholder="Repite tu contraseña"
              />
              <button
                type="button"
                class="auth-password-toggle"
                (click)="showConfirmPassword.set(!showConfirmPassword())"
                [attr.aria-label]="showConfirmPassword() ? 'Ocultar contraseña' : 'Mostrar contraseña'"
              >
                @if (showConfirmPassword()) {
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
          </div>
        </div>

        @if (form.hasError('passwordMismatch') && form.controls.confirmPassword.touched) {
          <p class="auth-error">Las contraseñas no coinciden.</p>
        }

        <div class="auth-grid">
          <div class="auth-field">
            <label class="auth-label" for="firstName">Nombre real</label>
            <div class="auth-input-wrap">
              <input id="firstName" type="text" class="auth-input" formControlName="firstName" autocomplete="given-name" placeholder="Opcional" />
            </div>
          </div>
          <div class="auth-field">
            <label class="auth-label" for="lastName">Apellidos</label>
            <div class="auth-input-wrap">
              <input id="lastName" type="text" class="auth-input" formControlName="lastName" autocomplete="family-name" placeholder="Opcional" />
            </div>
          </div>
        </div>

        <div class="auth-grid">
          <div class="auth-field">
            <label class="auth-label" for="phone">Teléfono</label>
            <div class="auth-input-wrap">
              <input id="phone" type="tel" class="auth-input" formControlName="phone" autocomplete="tel" placeholder="Opcional" />
            </div>
          </div>
          <div class="auth-field">
            <label class="auth-label" for="birthDate">Fecha de nacimiento</label>
            <div class="auth-input-wrap">
              <input id="birthDate" type="date" class="auth-input" formControlName="birthDate" />
            </div>
          </div>
        </div>

        <div class="auth-grid">
          <div class="auth-field">
            <label class="auth-label" for="city">Ciudad</label>
            <div class="auth-input-wrap">
              <input id="city" type="text" class="auth-input" formControlName="city" autocomplete="address-level2" placeholder="Opcional" />
            </div>
          </div>
          <div class="auth-field">
            <label class="auth-label" for="country">País</label>
            <div class="auth-input-wrap">
              <input id="country" type="text" class="auth-input" formControlName="country" autocomplete="country-name" placeholder="Opcional" />
            </div>
          </div>
        </div>

        @if (errorMessage(); as message) {
          <p class="auth-error-banner" role="alert">{{ message }}</p>
        }

        <button type="submit" class="button-sage auth-submit" [disabled]="submitting()">
          {{ submitting() ? 'Creando cuenta...' : 'Crear cuenta' }}
        </button>
      </form>

      <p class="auth-footer">
        ¿Ya tienes cuenta?
        <a routerLink="/auth/login" class="auth-link">Iniciar sesión</a>
      </p>
    </div>
  `
})
export class RegisterPage {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthStore);
  private readonly router = inject(Router);

  protected readonly form = this.fb.nonNullable.group(
    {
      name: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(120)]],
      email: ['', [Validators.required, Validators.email]],
      password: [
        '',
        [
          Validators.required,
          Validators.minLength(8),
          Validators.maxLength(72),
          Validators.pattern(PASSWORD_PATTERN)
        ]
      ],
      confirmPassword: ['', [Validators.required]],
      firstName: [''],
      lastName: [''],
      phone: [''],
      birthDate: [''],
      city: [''],
      country: ['']
    },
    { validators: passwordsMatchValidator }
  );

  protected readonly submitting = signal(false);
  protected readonly errorMessage = signal<string | null>(null);
  protected readonly showPassword = signal(false);
  protected readonly showConfirmPassword = signal(false);

  protected async onSubmit(): Promise<void> {
    if (this.submitting()) return;

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const value = this.form.getRawValue();
    const payload: RegisterPayload = {
      name: value.name.trim(),
      email: value.email.trim(),
      password: value.password,
      firstName: value.firstName.trim() || undefined,
      lastName: value.lastName.trim() || undefined,
      phone: value.phone.trim() || undefined,
      city: value.city.trim() || undefined,
      country: value.country.trim() || undefined,
      birthDate: value.birthDate || undefined
    };

    this.submitting.set(true);
    this.errorMessage.set(null);

    try {
      await firstValueFrom(this.auth.register(payload));
      await Swal.fire({
        icon: 'success',
        title: 'Cuenta creada',
        text: 'Ya puedes iniciar sesión.',
        confirmButtonColor: '#A8B995'
      });
      await this.router.navigate(['/auth/login']);
    } catch (error) {
      if (!isHttpError(error)) {
        this.errorMessage.set('No se pudo crear la cuenta. Inténtalo de nuevo.');
      }
    } finally {
      this.submitting.set(false);
    }
  }
}
