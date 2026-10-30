import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { AuthService } from '../../../../core/services/auth.service';
import { AuthStore } from '../../../../core/stores/auth.store';
import { isHttpError } from '../../../../shared/utils/error.util';

@Component({
  selector: 'app-login-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, RouterLink],
  template: `
    <section class="glass-panel rounded-2xl p-6 shadow-sm sm:p-8">
      <div class="mb-6">
        <h1 class="text-2xl font-semibold text-gray-900">Iniciar sesión</h1>
        <p class="mt-1 text-sm text-gray-500">
          Accede con tu cuenta para gestionar eventos y tu perfil.
        </p>
      </div>

      <form class="space-y-4" [formGroup]="form" (ngSubmit)="onSubmit()">
        <div>
          <label class="form-label" for="email">Email</label>
          <input
            id="email"
            type="email"
            class="form-input"
            formControlName="email"
            autocomplete="email"
            placeholder="tu@email.com"
          />
          @if (form.controls.email.touched && form.controls.email.invalid) {
            <p class="form-error">Introduce un email válido.</p>
          }
        </div>

        <div>
          <label class="form-label" for="password">Contraseña</label>
          <input
            id="password"
            type="password"
            class="form-input"
            formControlName="password"
            autocomplete="current-password"
            placeholder="Tu contraseña"
          />
          @if (form.controls.password.touched && form.controls.password.invalid) {
            <p class="form-error">Introduce tu contraseña.</p>
          }
        </div>

        @if (errorMessage(); as message) {
          <p class="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">
            {{ message }}
          </p>
        }

        <button type="submit" class="button-primary w-full" [disabled]="submitting()">
          {{ submitting() ? 'Entrando...' : 'Entrar' }}
        </button>
      </form>

      <div class="mt-6 space-y-3 text-center text-sm text-gray-600">
        <p>
          ¿No tienes cuenta?
          <a routerLink="/auth/register" class="font-medium text-brand hover:underline">Crear cuenta</a>
        </p>
      </div>
    </section>
  `
})
export class LoginPage {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly store = inject(AuthStore);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  protected readonly form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required]]
  });

  protected readonly submitting = signal(false);
  protected readonly errorMessage = signal<string | null>(null);

  protected async onSubmit(): Promise<void> {
    if (this.submitting()) return;

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.submitting.set(true);
    this.errorMessage.set(null);

    try {
      const session = await firstValueFrom(this.auth.login(this.form.getRawValue()));
      this.store.setSession(session);
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
