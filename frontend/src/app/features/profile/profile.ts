import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { forkJoin, firstValueFrom } from 'rxjs';
import Swal from 'sweetalert2';
import { UpdateProfilePayload } from '../../core/models/auth.model';
import { AuthService } from '../../core/services/auth.service';
import { AuthStore } from '../../core/stores/auth.store';
import { UserService } from '../../core/services/user.service';
import { isHttpError, showUnexpectedError } from '../../shared/utils/error.util';

@Component({
  selector: 'app-profile-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule],
  template: `
    <div class="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
      <div class="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 class="text-2xl font-semibold text-gray-900">Mi perfil</h1>
          <p class="mt-0.5 text-sm text-gray-500">Actualiza tus datos personales y de contacto.</p>
        </div>
        <button type="button" class="button-secondary" (click)="logout()">Cerrar sesión</button>
      </div>

      @if (user(); as currentUser) {
        <section class="glass-panel mb-6 rounded-2xl p-5">
          <div class="flex flex-col gap-4 sm:flex-row sm:items-center">
            <div
              class="grid h-16 w-16 shrink-0 place-items-center rounded-2xl bg-brand text-2xl font-bold text-white"
              aria-hidden="true"
            >
              {{ initial() }}
            </div>
            <div class="min-w-0 flex-1">
              <p class="truncate text-lg font-semibold text-gray-900">{{ currentUser.name }}</p>
              <p class="truncate text-sm text-gray-500">{{ currentUser.email }}</p>
              <div class="mt-2 flex flex-wrap gap-2">
                <span class="badge bg-brand/10 text-brand">
                  {{ currentUser.role === 'ADMIN' ? 'Administrador' : 'Usuario' }}
                </span>
                <span
                  class="badge"
                  [class.badge-active]="currentUser.emailVerified"
                  [class.badge-inactive]="!currentUser.emailVerified"
                >
                  {{ currentUser.emailVerified ? 'Email verificado' : 'Email sin verificar' }}
                </span>
                <span
                  class="badge"
                  [class.badge-active]="currentUser.isActive"
                  [class.badge-inactive]="!currentUser.isActive"
                >
                  {{ currentUser.isActive ? 'Cuenta activa' : 'Cuenta inactiva' }}
                </span>
              </div>
            </div>
          </div>
        </section>

        <form class="space-y-6" [formGroup]="form" (ngSubmit)="onSubmit()">
          <section class="glass-panel rounded-2xl p-5">
            <h2 class="mb-4 text-base font-semibold text-gray-900">Cuenta</h2>
            <div class="grid gap-4 sm:grid-cols-2">
              <div>
                <label class="form-label" for="name">Nombre visible</label>
                <input
                  id="name"
                  type="text"
                  class="form-input"
                  formControlName="name"
                  autocomplete="name"
                />
                @if (form.controls.name.touched && form.controls.name.invalid) {
                  <p class="form-error">El nombre debe tener entre 2 y 120 caracteres.</p>
                }
              </div>
              <div>
                <label class="form-label" for="email">Email</label>
                <input
                  id="email"
                  type="email"
                  class="form-input"
                  [value]="currentUser.email"
                  disabled
                />
              </div>
            </div>
          </section>

          <section class="glass-panel rounded-2xl p-5">
            <h2 class="mb-4 text-base font-semibold text-gray-900">Datos personales</h2>
            <div class="grid gap-4 sm:grid-cols-2">
              <div>
                <label class="form-label" for="firstName">Nombre real</label>
                <input
                  id="firstName"
                  type="text"
                  class="form-input"
                  formControlName="firstName"
                  autocomplete="given-name"
                />
              </div>
              <div>
                <label class="form-label" for="lastName">Apellidos</label>
                <input
                  id="lastName"
                  type="text"
                  class="form-input"
                  formControlName="lastName"
                  autocomplete="family-name"
                />
              </div>
              <div>
                <label class="form-label" for="phone">Teléfono</label>
                <input
                  id="phone"
                  type="tel"
                  class="form-input"
                  formControlName="phone"
                  autocomplete="tel"
                />
              </div>
              <div>
                <label class="form-label" for="birthDate">Fecha de nacimiento</label>
                <input
                  id="birthDate"
                  type="date"
                  class="form-input"
                  formControlName="birthDate"
                />
              </div>
              <div>
                <label class="form-label" for="city">Ciudad</label>
                <input
                  id="city"
                  type="text"
                  class="form-input"
                  formControlName="city"
                  autocomplete="address-level2"
                />
              </div>
              <div>
                <label class="form-label" for="country">País</label>
                <input
                  id="country"
                  type="text"
                  class="form-input"
                  formControlName="country"
                  autocomplete="country-name"
                />
              </div>
            </div>
            <div class="mt-4">
              <label class="form-label" for="avatarUrl">URL del avatar</label>
              <input
                id="avatarUrl"
                type="url"
                class="form-input"
                formControlName="avatarUrl"
                placeholder="https://..."
              />
              @if (form.controls.avatarUrl.touched && form.controls.avatarUrl.invalid) {
                <p class="form-error">Introduce una URL válida o deja el campo vacío.</p>
              }
            </div>
          </section>

          @if (errorMessage(); as message) {
            <p class="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">
              {{ message }}
            </p>
          }

          <div class="flex justify-end">
            <button type="submit" class="button-primary" [disabled]="saving()">
              {{ saving() ? 'Guardando...' : 'Guardar cambios' }}
            </button>
          </div>
        </form>
      }
    </div>
  `
})
export class ProfilePage implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthStore);
  private readonly authService = inject(AuthService);
  private readonly users = inject(UserService);
  private readonly router = inject(Router);

  protected readonly user = this.auth.user;
  protected readonly saving = signal(false);
  protected readonly errorMessage = signal<string | null>(null);
  protected readonly initial = computed(() => {
    const name = this.user()?.name?.trim();
    return name ? name.charAt(0).toUpperCase() : '?';
  });

  protected readonly form = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(120)]],
    firstName: ['', [Validators.maxLength(80)]],
    lastName: ['', [Validators.maxLength(80)]],
    phone: ['', [Validators.maxLength(40)]],
    birthDate: [''],
    city: ['', [Validators.maxLength(120)]],
    country: ['', [Validators.maxLength(120)]],
    avatarUrl: ['', [Validators.pattern(/^$|^https?:\/\/.+/)]]
  });

  ngOnInit(): void {
    void this.load();
  }

  private async load(): Promise<void> {
    const currentUser = this.user();
    if (!currentUser) return;

    this.form.controls.name.setValue(currentUser.name);

    try {
      const profile = await firstValueFrom(this.users.getProfile());
      this.form.patchValue({
        firstName: profile.firstName ?? '',
        lastName: profile.lastName ?? '',
        phone: profile.phone ?? '',
        birthDate: profile.birthDate ? profile.birthDate.slice(0, 10) : '',
        city: profile.city ?? '',
        country: profile.country ?? '',
        avatarUrl: profile.avatarUrl ?? ''
      });
      this.auth.updateUser({ ...currentUser, profile });
    } catch (error) {
      if (!isHttpError(error)) {
        showUnexpectedError(error);
      }
    }
  }

  protected async onSubmit(): Promise<void> {
    if (this.saving()) return;

    const currentUser = this.user();
    if (!currentUser) return;

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const value = this.form.getRawValue();
    const profilePayload: UpdateProfilePayload = {
      firstName: value.firstName.trim(),
      lastName: value.lastName.trim(),
      phone: value.phone.trim(),
      birthDate: value.birthDate || null,
      city: value.city.trim(),
      country: value.country.trim(),
      avatarUrl: value.avatarUrl.trim()
    };

    this.saving.set(true);
    this.errorMessage.set(null);

    try {
      const [updatedUser, updatedProfile] = await firstValueFrom(
        forkJoin([
          this.users.update(currentUser._id, { name: value.name.trim() }),
          this.users.updateProfile(profilePayload)
        ])
      );
      this.auth.updateUser({ ...updatedUser, profile: updatedProfile });
      await Swal.fire({
        icon: 'success',
        title: 'Perfil actualizado',
        text: 'Tus datos se han guardado correctamente.',
        confirmButtonColor: '#386641'
      });
    } catch (error) {
      if (!isHttpError(error)) {
        this.errorMessage.set('No se pudo guardar el perfil. Inténtalo de nuevo.');
      }
    } finally {
      this.saving.set(false);
    }
  }

  protected async logout(): Promise<void> {
    try {
      await firstValueFrom(this.authService.logout());
    } catch {
      // La sesión local se limpia igualmente aunque el servidor no responda.
    } finally {
      this.auth.clear();
      await this.router.navigate(['/auth/login']);
    }
  }
}
