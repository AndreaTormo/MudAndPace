import { Injectable, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { EventImage } from '../models/event.model';
import { EventService } from '../services/event.service';

@Injectable()
export class EventImagesStore {
  private readonly service = inject(EventService);

  private readonly _images = signal<EventImage[]>([]);
  private readonly _loading = signal(false);
  private readonly _error = signal<string | null>(null);
  private currentEventId = '';

  readonly images = this._images.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly error = this._error.asReadonly();

  async load(eventId: string): Promise<void> {
    this.currentEventId = eventId;
    this._error.set(null);
    this._loading.set(true);

    try {
      const images = await firstValueFrom(this.service.listImages(eventId));
      if (this.currentEventId === eventId) {
        this._images.set(images);
      }
    } catch {
      if (this.currentEventId === eventId) {
        this._error.set('No se han podido cargar las fotos del evento.');
      }
    } finally {
      if (this.currentEventId === eventId) {
        this._loading.set(false);
      }
    }
  }

  async upload(eventId: string, files: File[]): Promise<void> {
    const images = await firstValueFrom(this.service.uploadImages(eventId, files));
    if (this.currentEventId === eventId) {
      this._images.set(images);
    }
  }

  async remove(eventId: string, imageId: string): Promise<void> {
    const images = await firstValueFrom(this.service.deleteImage(eventId, imageId));
    if (this.currentEventId === eventId) {
      this._images.set(images);
    }
  }

  async setCover(eventId: string, imageId: string): Promise<void> {
    const images = await firstValueFrom(this.service.setCoverImage(eventId, imageId));
    if (this.currentEventId === eventId) {
      this._images.set(images);
    }
  }

  reset(): void {
    this.currentEventId = '';
    this._images.set([]);
    this._loading.set(false);
    this._error.set(null);
  }
}
