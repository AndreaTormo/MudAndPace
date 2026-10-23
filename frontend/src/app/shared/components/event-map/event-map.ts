import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { EventLocation } from '../../../core/models/event.model';

const BBOX_DELTA = 0.08;

@Component({
  selector: 'app-event-map',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (hasCoordinates()) {
      <section class="overflow-hidden rounded-2xl border border-gray-200 bg-white/80 backdrop-blur-sm">
        <div class="flex flex-wrap items-start justify-between gap-2 px-4 pt-3">
          <div>
            <h2 class="text-base font-semibold text-gray-900">Ubicación</h2>
            <p class="text-sm text-gray-500">{{ label() }}</p>
          </div>
          <div class="flex items-center gap-3 text-xs font-medium">
            <a class="text-brand hover:underline" [href]="osmUrl()" target="_blank" rel="noopener noreferrer">
              Ver mapa
            </a>
            <a class="text-brand hover:underline" [href]="directionsUrl()" target="_blank" rel="noopener noreferrer">
              Indicaciones
            </a>
          </div>
        </div>
        <iframe
          class="mt-3 h-56 w-full border-0"
          [src]="embedUrl()"
          [title]="'Mapa de ' + label()"
          loading="lazy"
          referrerpolicy="no-referrer-when-downgrade"
        ></iframe>
      </section>
    } @else {
      <section class="rounded-2xl border border-gray-200 bg-white/80 backdrop-blur-sm p-4">
        <h2 class="text-base font-semibold text-gray-900">Ubicación</h2>
        <p class="mt-1 text-sm text-gray-400">Ubicación no disponible en el mapa.</p>
      </section>
    }
  `
})
export class EventMap {
  private readonly sanitizer = inject(DomSanitizer);

  location = input<EventLocation | null | undefined>(null);

  protected readonly coords = computed(() => {
    const raw = this.location()?.coordinates;
    if (!Array.isArray(raw) || raw.length !== 2) {
      return null;
    }
    const [lng, lat] = raw;
    if (!Number.isFinite(lng) || !Number.isFinite(lat)) {
      return null;
    }
    if (Math.abs(lng) > 180 || Math.abs(lat) > 90) {
      return null;
    }
    return { lat, lng };
  });

  protected readonly hasCoordinates = computed(() => this.coords() !== null);

  protected readonly label = computed(() => {
    const location = this.location();
    if (!location) {
      return '';
    }
    return [location.name, location.city].filter((part): part is string => Boolean(part)).join(' · ');
  });

  protected readonly osmUrl = computed(() => {
    const coords = this.coords();
    if (!coords) {
      return null;
    }
    return `https://www.openstreetmap.org/?mlat=${coords.lat}&mlon=${coords.lng}#map=13/${coords.lat}/${coords.lng}`;
  });

  protected readonly directionsUrl = computed(() => {
    const coords = this.coords();
    if (!coords) {
      return null;
    }
    return `https://www.google.com/maps/dir/?api=1&destination=${coords.lat},${coords.lng}`;
  });

  protected readonly embedUrl = computed<SafeResourceUrl | null>(() => {
    const coords = this.coords();
    if (!coords) {
      return null;
    }
    const minLng = coords.lng - BBOX_DELTA;
    const minLat = coords.lat - BBOX_DELTA;
    const maxLng = coords.lng + BBOX_DELTA;
    const maxLat = coords.lat + BBOX_DELTA;
    const bbox = `${minLng},${minLat},${maxLng},${maxLat}`;
    const url = `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${coords.lat},${coords.lng}`;
    return this.sanitizer.bypassSecurityTrustResourceUrl(url);
  });
}
