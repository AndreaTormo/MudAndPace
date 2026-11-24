import { AdminProfile } from '../../core/models/auth.model';

export function profileFullName(item: AdminProfile): string {
  const parts = [item.profile?.firstName, item.profile?.lastName].filter(
    (part): part is string => Boolean(part && part.trim())
  );
  return parts.length > 0 ? parts.join(' ') : '—';
}

export function profileDisplayName(item: AdminProfile): string {
  const name = profileFullName(item);
  return name === '—' ? item.user.name : name;
}

export function hasProfileData(item: AdminProfile | null | undefined): boolean {
  const profile = item?.profile;
  if (!profile) return false;

  return [
    profile.firstName,
    profile.lastName,
    profile.phone,
    profile.avatarUrl,
    profile.city,
    profile.country,
    profile.birthDate
  ].some((value) => Boolean(value));
}

export function profileLocation(item: AdminProfile): string {
  return [item.profile?.city, item.profile?.country]
    .filter((part): part is string => Boolean(part && part.trim()))
    .join(' · ') || '—';
}

export function profileRoleLabel(item: AdminProfile): string {
  return item.user.canManage === true ? 'Administrador' : 'Usuario';
}

export function profileRoleClass(item: AdminProfile): string {
  return item.user.canManage === true ? 'badge-admin' : 'badge-user';
}

export function profileStatusLabel(item: AdminProfile): string {
  if (item.user.status === 'blocked') return 'Bloqueado';
  return item.user.isActive && item.user.status !== 'inactive' ? 'Activo' : 'Inactivo';
}

export function profileStatusClass(item: AdminProfile): string {
  if (item.user.status === 'blocked') return 'badge-blocked';
  return item.user.isActive && item.user.status !== 'inactive'
    ? 'badge-active'
    : 'badge-inactive';
}

export function profileEmailLabel(item: AdminProfile): string {
  return item.user.emailVerified ? 'Email verificado' : 'Email sin verificar';
}

export function profileEmailClass(item: AdminProfile): string {
  return item.user.emailVerified ? 'badge-email-verified' : 'badge-email-unverified';
}
