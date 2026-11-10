import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { AdminProfile } from '../../../../core/models/auth.model';
import { UserAvatar } from '../../../../shared/components/user-avatar/user-avatar';
import { formatDate } from '../../../../shared/utils/format.util';
import {
  hasProfileData as checkProfileData,
  profileDisplayName,
  profileEmailClass,
  profileEmailLabel,
  profileFullName,
  profileLocation,
  profileRoleLabel,
  profileStatusClass,
  profileStatusLabel
} from '../../../../shared/utils/profile.util';

@Component({
  selector: 'app-admin-profile-row',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [UserAvatar],
  template: `
    <div
      class="flex flex-col gap-3 p-4 transition-colors hover:bg-gray-50/70 sm:flex-row sm:items-center sm:gap-4"
    >
      <div class="flex min-w-0 flex-1 items-center gap-4">
        <app-user-avatar
          size="md"
          [name]="displayName()"
          [avatarUrl]="profile().profile?.avatarUrl ?? null"
        />

        <div class="min-w-0">
          <p class="truncate font-semibold text-gray-900">{{ profile().user.name }}</p>
          <p class="truncate text-sm text-gray-500">{{ profile().user.email }}</p>
          <div class="mt-1 flex flex-wrap gap-x-4 gap-y-0.5 text-xs text-gray-500">
            <span>
              <strong class="font-semibold text-gray-900">{{ fullName() }}</strong>
              · Nombre real
            </span>
            <span>
              <strong class="font-semibold text-gray-900">{{ phone() }}</strong>
              · Teléfono
            </span>
            <span>
              <strong class="font-semibold text-gray-900">{{ location() }}</strong>
              · Ubicación
            </span>
            <span>
              <strong class="font-semibold text-gray-900">{{ birthDate() }}</strong>
              · Nacimiento
            </span>
            <span>Alta: {{ formatDate(profile().user.created_At) }}</span>
          </div>
        </div>
      </div>

      <div class="flex flex-wrap items-center gap-2 sm:max-w-[18rem] sm:justify-end">
        <span class="badge bg-brand/10 text-brand">{{ roleLabel() }}</span>
        <span [class]="'badge ' + statusClass()">{{ statusLabel() }}</span>
        <span [class]="'badge ' + emailClass()">{{ emailLabel() }}</span>
        @if (!hasProfileData()) {
          <span class="badge bg-amber-100 text-amber-800">Perfil sin completar</span>
        }
      </div>
    </div>
  `
})
export class AdminProfileRow {
  readonly profile = input.required<AdminProfile>();

  protected readonly formatDate = formatDate;
  protected readonly displayName = computed(() => profileDisplayName(this.profile()));
  protected readonly fullName = computed(() => profileFullName(this.profile()));
  protected readonly hasProfileData = computed(() => checkProfileData(this.profile()));
  protected readonly location = computed(() => profileLocation(this.profile()));
  protected readonly roleLabel = computed(() => profileRoleLabel(this.profile()));
  protected readonly statusLabel = computed(() => profileStatusLabel(this.profile()));
  protected readonly statusClass = computed(() => profileStatusClass(this.profile()));
  protected readonly emailLabel = computed(() => profileEmailLabel(this.profile()));
  protected readonly emailClass = computed(() => profileEmailClass(this.profile()));
  protected readonly phone = computed(() => this.profile().profile?.phone?.trim() || '—');
  protected readonly birthDate = computed(() =>
    formatDate(this.profile().profile?.birthDate ?? undefined)
  );
}
