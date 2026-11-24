import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { forkJoin, firstValueFrom } from 'rxjs';
import Swal from 'sweetalert2';
import { UpdateProfilePayload } from '../../core/models/auth.model';
import { AuthStore } from '../../core/stores/auth.store';
import { UserService } from '../../core/services/user.service';
import { UserAvatar } from '../../shared/components/user-avatar/user-avatar';
import { isHttpError, showUnexpectedError } from '../../shared/utils/error.util';

const MAX_AVATAR_SIZE = 5 * 1024 * 1024;
const AVATAR_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);

@Component({
  selector: 'app-profile-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, UserAvatar],
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
            <app-user-avatar
              size="lg"
              [name]="currentUser.name"
              [avatarUrl]="currentUser.profile?.avatarUrl ?? null"
            />
            <div class="min-w-0 flex-1">
              <p class="truncate text-lg font-semibold text-gray-900">{{ currentUser.name }}</p>
              <p class="truncate text-sm text-gray-500">{{ currentUser.email }}</p>
              <div class="mt-2 flex flex-wrap gap-2">
                <span [class]="'badge ' + roleBadgeClass()">
                  {{ isAdmin() ? 'Administrador' : 'Usuario' }}
                </span>
                <span [class]="'badge ' + emailBadgeClass()">
                  {{ currentUser.emailVerified ? 'Email verificado' : 'Email sin verificar' }}
                </span>
                <span [class]="'badge ' + statusBadgeClass()">
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
            <div class="mt-6 rounded-xl border border-dashed border-gray-300 p-4">
              <p class="text-sm font-semibold text-gray-900">Subir foto</p>
              <p class="mt-1 text-xs text-gray-500">JPG, PNG o WebP. Máximo 5 MB.</p>
              <div class="mt-3 flex flex-wrap items-center gap-3">
                <label
                  class="button-secondary cursor-pointer"
                  [class.pointer-events-none]="uploadingAvatar()"
                  [class.opacity-60]="uploadingAvatar()"
                >
                  {{ uploadingAvatar() ? 'Subiendo...' : 'Seleccionar foto' }}
                  <input
                    type="file"
                    class="hidden"
                    accept="image/jpeg,image/png,image/webp"
                    [disabled]="uploadingAvatar()"
                    (change)="onAvatarSelected($event)"
                  />
                </label>
                @if (avatarError(); as message) {
                  <p class="text-sm text-red-600" role="alert">{{ message }}</p>
                }
              </div>
            </div>
          </section>

          @if (errorMessage(); as message) {
            <p class="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">
              {{ message }}
            </p>
          }

          <div class="flex justify-end">
            <button
              type="submit"
              class="button-primary"
              [disabled]="saving() || uploadingAvatar()"
            >
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
  private readonly users = inject(UserService);
  private readonly router = inject(Router);

  protected readonly user = this.auth.user;
  protected readonly isAdmin = this.auth.isAdmin;
  protected readonly roleBadgeClass = computed(() =>
    this.isAdmin() ? 'badge-admin' : 'badge-user'
  );
  protected readonly emailBadgeClass = computed(() =>
    this.user()?.emailVerified ? 'badge-email-verified' : 'badge-email-unverified'
  );
  protected readonly statusBadgeClass = computed(() =>
    this.user()?.isActive ? 'badge-active' : 'badge-inactive'
  );
  protected readonly saving = signal(false);
  protected readonly uploadingAvatar = signal(false);
  protected readonly errorMessage = signal<string | null>(null);
  protected readonly avatarError = signal<string | null>(null);
  private profileLoadId = 0;

  protected readonly form = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(120)]],
    firstName: ['', [Validators.maxLength(80)]],
    lastName: ['', [Validators.maxLength(80)]],
    phone: ['', [Validators.maxLength(40)]],
    birthDate: [''],
    city: ['', [Validators.maxLength(120)]],
    country: ['', [Validators.maxLength(120)]],
    avatarUrl: [
      '',
      [
        Validators.pattern(
          /^$|^https?:\/\/[^\s]+$|^\/uploads\/avatars\/[a-f\d]{24}\/[A-Za-z0-9._-]+$/
        )
      ]
    ]
  });

  async ngOnInit(): Promise<void> {
    if (!this.user()) {
      try {
        await firstValueFrom(this.auth.refreshMe());
      } catch {
        return;
      }
    }
    void this.load();
  }

  private async load(): Promise<void> {
    const currentUser = this.user();
    if (!currentUser) return;

    const loadId = ++this.profileLoadId;
    this.form.controls.name.setValue(currentUser.name);

    try {
      const profile = await firstValueFrom(this.users.getProfile());
      if (loadId !== this.profileLoadId) return;

      this.form.patchValue({
        firstName: profile.firstName ?? '',
        lastName: profile.lastName ?? '',
        phone: profile.phone ?? '',
        birthDate: profile.birthDate ? profile.birthDate.slice(0, 10) : '',
        city: profile.city ?? '',
        country: profile.country ?? '',
        avatarUrl: profile.avatarUrl ?? ''
      });
      this.auth.updateUser({ ...(this.user() ?? currentUser), profile });
    } catch (error) {
      if (!isHttpError(error)) {
        showUnexpectedError(error);
      }
    }
  }

  protected async onSubmit(): Promise<void> {
    if (this.saving() || this.uploadingAvatar()) return;

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
    this.profileLoadId += 1;

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
        confirmButtonColor: '#A3B18A'
      });
    } catch (error) {
      if (!isHttpError(error)) {
        this.errorMessage.set('No se pudo guardar el perfil. Inténtalo de nuevo.');
      }
    } finally {
      this.saving.set(false);
    }
  }

  protected async onAvatarSelected(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';

    if (!file || this.uploadingAvatar() || this.saving()) return;

    this.avatarError.set(null);

    if (!AVATAR_TYPES.has(file.type)) {
      this.avatarError.set('Formato no válido. Usa JPG, PNG o WebP.');
      return;
    }

    if (file.size > MAX_AVATAR_SIZE) {
      this.avatarError.set('La imagen no puede superar los 5 MB.');
      return;
    }

    const currentUser = this.user();
    if (!currentUser) return;

    this.uploadingAvatar.set(true);
    this.profileLoadId += 1;

    try {
      const updatedProfile = await firstValueFrom(this.users.uploadAvatar(file));
      this.auth.updateUser({
        ...(this.user() ?? currentUser),
        profile: updatedProfile
      });
      this.form.controls.avatarUrl.setValue(updatedProfile.avatarUrl ?? '');
      void Swal.fire({
        icon: 'success',
        title: 'Avatar actualizado',
        timer: 1500,
        showConfirmButton: false
      });
    } catch (error) {
      if (!isHttpError(error)) {
        this.avatarError.set('No se pudo subir la foto. Inténtalo de nuevo.');
      }
    } finally {
      this.uploadingAvatar.set(false);
    }
  }

  protected async logout(): Promise<void> {
    try {
      await firstValueFrom(this.auth.logout());
    } catch {
      // AuthStore limpia la sesión local aunque el servidor no responda.
    } finally {
      await this.router.navigate(['/auth/login']);
    }
  }
}
