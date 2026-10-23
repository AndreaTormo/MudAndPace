import {
  ChangeDetectionStrategy,
  Component,
  OnChanges,
  OnDestroy,
  OnInit,
  SimpleChanges,
  computed,
  inject,
  input,
  signal
} from '@angular/core';
import Swal from 'sweetalert2';
import { EventImage } from '../../../../core/models/event.model';
import { EventImagesStore } from '../../../../core/stores/event-images.store';
import { resolveAssetUrl } from '../../../../shared/utils/asset.util';

const ALLOWED_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);

@Component({
  selector: 'app-event-images',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [EventImagesStore],
  template: `
    <section class="rounded-2xl border border-gray-200 bg-white/80 p-6 backdrop-blur-sm">
      <div class="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 class="text-base font-semibold text-gray-900">Fotos del evento</h2>
          <p class="mt-0.5 text-sm text-gray-500">
            JPG, PNG o WebP · Máximo 5 MB por foto · Hasta {{ maxImages }} fotos
          </p>
        </div>
        <span class="badge bg-gray-100 text-gray-700">
          {{ images().length }} / {{ maxImages }}
        </span>
      </div>

      @if (error()) {
        <div class="mt-4 rounded-xl border border-red-200 bg-red-50 p-4">
          <p class="text-sm text-red-700">{{ error() }}</p>
          <button type="button" class="button-secondary mt-3" (click)="load()">
            Reintentar
          </button>
        </div>
      } @else if (loading()) {
        <div class="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          @for (item of [1, 2, 3, 4]; track item) {
            <div class="aspect-[4/3] animate-pulse rounded-xl bg-gray-200"></div>
          }
        </div>
      } @else {
        @if (images().length) {
          <div class="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            @for (image of images(); track image._id) {
              <figure class="overflow-hidden rounded-xl border border-gray-200 bg-white">
                <div class="relative">
                  <img
                    [src]="assetUrl(image.url)"
                    [alt]="image.alt || 'Foto del evento'"
                    class="aspect-[4/3] w-full object-cover"
                    loading="lazy"
                  />
                  @if (image.isCover) {
                    <span class="badge absolute left-2 top-2 bg-brand text-white">Portada</span>
                  }
                </div>
                <figcaption class="flex items-center justify-between gap-2 border-t border-gray-100 p-2">
                  @if (image.isCover) {
                    <span class="text-xs font-medium text-gray-500">Portada actual</span>
                  } @else {
                    <button
                      type="button"
                      class="text-xs font-medium text-brand hover:underline disabled:cursor-not-allowed disabled:opacity-50"
                      [disabled]="busy()"
                      [attr.aria-label]="'Usar como portada: ' + (image.originalName || 'foto')"
                      (click)="onSetCover(image)"
                    >
                      Usar como portada
                    </button>
                  }
                  <button
                    type="button"
                    class="icon-button icon-button-danger h-8 w-8"
                    [disabled]="busy()"
                    [attr.aria-label]="'Eliminar foto ' + (image.originalName || '')"
                    title="Eliminar foto"
                    (click)="onRemove(image)"
                  >
                    <svg
                      class="h-4 w-4"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="2"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      aria-hidden="true"
                    >
                      <path d="M3 6h18" />
                      <path d="M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2" />
                      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                      <path d="M10 11v6M14 11v6" />
                    </svg>
                  </button>
                </figcaption>
              </figure>
            }
          </div>
        } @else {
          <p class="mt-5 rounded-xl border border-dashed border-gray-300 bg-gray-50 p-5 text-center text-sm text-gray-500">
            Este evento todavía no tiene fotos.
          </p>
        }

        @if (images().length < maxImages) {
          <label
            class="mt-4 flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 px-4 py-6 text-center transition-colors hover:border-brand hover:bg-green-50/50"
            [class.border-brand]="dragging()"
            [class.bg-green-50]="dragging()"
            [class.pointer-events-none]="uploading()"
            [class.opacity-60]="uploading()"
            (dragover)="onDragOver($event)"
            (dragleave)="dragging.set(false)"
            (drop)="onDrop($event)"
          >
            <input
              #fileInput
              type="file"
              class="sr-only"
              accept="image/jpeg,image/png,image/webp"
              multiple
              [disabled]="uploading()"
              (change)="onFilesSelected($event)"
            />
            @if (uploading()) {
              <span class="text-sm font-medium text-gray-600">Subiendo fotos…</span>
            } @else {
              <span class="text-sm font-medium text-gray-700">Añadir fotos</span>
              <span class="mt-1 text-xs text-gray-500">
                Haz clic o arrastra archivos aquí. Puedes añadir
                {{ maxImages - images().length }} más.
              </span>
            }
          </label>
        } @else {
          <p class="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4 text-center text-sm text-amber-800">
            Has alcanzado el máximo de {{ maxImages }} fotos para este evento.
          </p>
        }
      }
    </section>
  `
})
export class EventImages implements OnInit, OnChanges, OnDestroy {
  private readonly store = inject(EventImagesStore);

  eventId = input.required<string>();

  protected readonly maxImages = 8;
  protected readonly images = this.store.images;
  protected readonly loading = this.store.loading;
  protected readonly error = this.store.error;
  protected readonly uploading = signal(false);
  protected readonly removingId = signal<string | null>(null);
  protected readonly coveringId = signal<string | null>(null);
  protected readonly dragging = signal(false);

  protected readonly busy = computed(
    () => this.uploading() || this.removingId() !== null || this.coveringId() !== null
  );

  ngOnInit(): void {
    this.load();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['eventId'] && !changes['eventId'].firstChange) {
      this.load();
    }
  }

  ngOnDestroy(): void {
    this.store.reset();
  }

  protected assetUrl(url: string): string {
    return resolveAssetUrl(url);
  }

  protected load(): void {
    void this.store.load(this.eventId());
  }

  protected onDragOver(event: DragEvent): void {
    event.preventDefault();
    if (!this.uploading()) {
      this.dragging.set(true);
    }
  }

  protected onDrop(event: DragEvent): void {
    event.preventDefault();
    this.dragging.set(false);

    if (this.busy()) {
      return;
    }

    const files = Array.from(event.dataTransfer?.files ?? []);
    void this.processFiles(files);
  }

  protected onFilesSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const files = Array.from(input.files ?? []);
    input.value = '';

    if (this.busy()) {
      return;
    }

    void this.processFiles(files);
  }

  private async processFiles(files: File[]): Promise<void> {
    if (!files.length) {
      return;
    }

    const remaining = this.maxImages - this.images().length;
    if (remaining <= 0) {
      this.showWarning('Límite alcanzado', `Este evento ya tiene ${this.maxImages} fotos.`);
      return;
    }

    if (files.length > remaining) {
      this.showWarning(
        'Demasiadas fotos',
        `Solo puedes añadir ${remaining} foto${remaining === 1 ? '' : 's'} más a este evento.`
      );
      return;
    }

    const invalid = files.filter(
      (file) => !ALLOWED_TYPES.has(file.type) || file.size > 5 * 1024 * 1024
    );

    if (invalid.length) {
      const names = invalid
        .slice(0, 3)
        .map((file) => file.name)
        .join(', ');
      const extra = invalid.length > 3 ? ` y ${invalid.length - 3} más` : '';
      this.showWarning(
        'Archivos no válidos',
        `No se han añadido ${names}${extra}. Solo se permiten JPG, PNG o WebP de hasta 5 MB.`
      );
      return;
    }

    this.uploading.set(true);

    try {
      await this.store.upload(this.eventId(), files);
      Swal.fire({
        icon: 'success',
        title: 'Fotos añadidas',
        text: 'Las fotos se han guardado correctamente.',
        timer: 1500,
        showConfirmButton: false
      });
    } catch {
      return;
    } finally {
      this.uploading.set(false);
    }
  }

  protected async onSetCover(image: EventImage): Promise<void> {
    if (this.busy()) {
      return;
    }

    this.coveringId.set(image._id);

    try {
      await this.store.setCover(this.eventId(), image._id);
    } catch {
      return;
    } finally {
      this.coveringId.set(null);
    }
  }

  protected async onRemove(image: EventImage): Promise<void> {
    if (this.busy()) {
      return;
    }

    const result = await Swal.fire({
      title: '¿Eliminar foto?',
      text: 'La foto se eliminará del evento de forma permanente.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#386641',
      cancelButtonColor: '#566F4B',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    });

    if (!result.isConfirmed) {
      return;
    }

    this.removingId.set(image._id);

    try {
      await this.store.remove(this.eventId(), image._id);
      Swal.fire({
        icon: 'success',
        title: 'Foto eliminada',
        timer: 1500,
        showConfirmButton: false
      });
    } catch {
      return;
    } finally {
      this.removingId.set(null);
    }
  }

  private showWarning(title: string, text: string): void {
    Swal.fire({
      icon: 'warning',
      title,
      text,
      confirmButtonColor: '#386641'
    });
  }
}
