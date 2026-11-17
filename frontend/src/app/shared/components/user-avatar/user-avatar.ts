import { ChangeDetectionStrategy, Component, computed, input, signal } from '@angular/core';
import { resolveAssetUrl } from '../../utils/asset.util';

@Component({
  selector: 'app-user-avatar',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <span [class]="containerClass()">
      @if (imageUrl(); as image) {
        <img
          [src]="image"
          [alt]="name() || 'Avatar'"
          class="h-full w-full object-cover"
          (error)="onError()"
        />
      } @else {
        {{ initial() }}
      }
    </span>
  `
})
export class UserAvatar {
  readonly name = input<string>('');
  readonly avatarUrl = input<string | null | undefined>(null);
  readonly size = input<'sm' | 'md' | 'lg'>('sm');

  private readonly failedUrl = signal<string | null>(null);

  protected readonly initial = computed(() => {
    const name = this.name()?.trim();
    return name ? name.charAt(0).toUpperCase() : '?';
  });

  protected readonly imageUrl = computed(() => {
    const raw = this.avatarUrl()?.trim();
    if (!raw) return null;

    const resolved = resolveAssetUrl(raw);
    return this.failedUrl() === resolved ? null : resolved;
  });

  protected readonly containerClass = computed(() => {
    const base =
      'grid shrink-0 place-items-center overflow-hidden bg-brand font-bold text-white dark:text-night';
    if (this.size() === 'lg') {
      return `${base} h-16 w-16 rounded-2xl text-2xl`;
    }
    if (this.size() === 'md') {
      return `${base} h-12 w-12 rounded-xl text-lg`;
    }
    return `${base} h-8 w-8 rounded-full text-xs`;
  });

  protected onError(): void {
    const url = this.imageUrl();
    if (url) this.failedUrl.set(url);
  }
}
