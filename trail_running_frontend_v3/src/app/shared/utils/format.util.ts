export function formatDistance(km: number): string {
  return `${km.toLocaleString('es-ES')} km`;
}

export function formatElevation(meters: number | undefined | null): string {
  if (meters === undefined || meters === null) {
    return '-';
  }
  return `${Math.round(meters).toLocaleString('es-ES')} m`;
}

export function formatDate(iso: string | undefined): string {
  if (!iso) {
    return '-';
  }
  return new Date(iso).toLocaleDateString('es-ES', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });
}
