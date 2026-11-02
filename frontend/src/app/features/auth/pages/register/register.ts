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
    <section class="glass-panel rounded-2xl p-6 shadow-sm sm:p-8">
      <div class="mb-6">
        <h1 class="text-2xl font-semibold text-gray-900">Crear cuenta</h1>
        <p class="mt-1 text-sm text-gray-500">
          El perfil se crea automáticamente.
        </p>
      </div>

      <form class="space-y-4" [formGroup]="form" (ngSubmit)="onSubmit()">
        <div>
          <label class="form-label" for="name">Nombre</label>
          <input id="name" type="text" class="form-input" formControlName="name" autocomplete="name" />
          @if (form.controls.name.touched && form.controls.name.invalid) {
            <p class="form-error">El nombre debe tener al menos 2 caracteres.</p>
          }
        </div>

        <div>
          <label class="form-label" for="email">Email</label>
          <input id="email" type="email" class="form-input" formControlName="email" autocomplete="email" />
          @if (form.controls.email.touched && form.controls.email.invalid) {
            <p class="form-error">Introduce un email válido.</p>
          }
        </div>

        <div class="grid gap-4 sm:grid-cols-2">
          <div>
            <label class="form-label" for="password">Contraseña</label>
            <input
              id="password"
              type="password"
              class="form-input"
              formControlName="password"
              autocomplete="new-password"
            />
            @if (form.controls.password.touched && form.controls.password.invalid) {
              <p class="form-error">Mínimo 8 caracteres, con mayúscula, minúscula y número.</p>
            }
          </div>
          <div>
            <label class="form-label" for="confirmPassword">Repetir contraseña</label>
            <input
              id="confirmPassword"
              type="password"
              class="form-input"
              formControlName="confirmPassword"
              autocomplete="new-password"
            />
          </div>
        </div>

        @if (form.hasError('passwordMismatch') && form.controls.confirmPassword.touched) {
          <p class="form-error">Las contraseñas no coinciden.</p>
        }

        <div class="grid gap-4 sm:grid-cols-2">
          <div>
            <label class="form-label" for="firstName">Nombre real</label>
            <input id="firstName" type="text" class="form-input" formControlName="firstName" />
          </div>
          <div>
            <label class="form-label" for="lastName">Apellidos</label>
            <input id="lastName" type="text" class="form-input" formControlName="lastName" />
          </div>
        </div>

        <div class="grid gap-4 sm:grid-cols-2">
          <div>
            <label class="form-label" for="phone">Teléfono</label>
            <input id="phone" type="tel" class="form-input" formControlName="phone" />
          </div>
          <div>
            <label class="form-label" for="birthDate">Fecha de nacimiento</label>
            <input id="birthDate" type="date" class="form-input" formControlName="birthDate" />
          </div>
        </div>

        <div class="grid gap-4 sm:grid-cols-2">
          <div>
            <label class="form-label" for="city">Ciudad</label>
            <input id="city" type="text" class="form-input" formControlName="city" />
          </div>
          <div>
            <label class="form-label" for="country">País</label>
            <input id="country" type="text" class="form-input" formControlName="country" />
          </div>
        </div>

        @if (errorMessage(); as message) {
          <p class="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">
            {{ message }}
          </p>
        }

        <button type="submit" class="button-primary w-full" [disabled]="submitting()">
          {{ submitting() ? 'Creando cuenta...' : 'Crear cuenta' }}
        </button>
      </form>

      <p class="mt-6 text-center text-sm text-gray-600">
        ¿Ya tienes cuenta?
        <a routerLink="/auth/login" class="font-medium text-brand hover:underline">Iniciar sesión</a>
      </p>
    </section>
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
        confirmButtonColor: '#386641'
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
