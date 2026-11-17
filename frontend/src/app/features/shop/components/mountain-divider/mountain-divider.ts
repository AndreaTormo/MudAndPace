import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'app-mountain-divider',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'block w-full'
  },
  styles: `
    .ridge {
      fill: var(--ridge);
    }

    .ridge-line {
      fill: none;
      stroke: var(--ridge-line);
      stroke-width: 1.5;
      vector-effect: non-scaling-stroke;
    }
  `,
  template: `
    <svg
      viewBox="0 0 1440 160"
      preserveAspectRatio="none"
      class="block h-full w-full"
      aria-hidden="true"
    >
      <path
        class="ridge"
        [attr.transform]="flip() ? 'translate(1440 0) scale(-1 1)' : null"
        d="M0 98l86-31 76 18 92-48 84 37 94-23 82 43 96-32 88 21 84-46 95 38 88-27 96 43 86-33 84 25 94-41 84 51 31 19v105H0z"
      />
      <path
        class="ridge-line"
        [attr.transform]="flip() ? 'translate(1440 0) scale(-1 1)' : null"
        d="M0 98l86-31 76 18 92-48 84 37 94-23 82 43 96-32 88 21 84-46 95 38 88-27 96 43 86-33 84 25 94-41 84 51 31 19"
      />
    </svg>
  `
})
export class MountainDivider {
  readonly flip = input(false);
}
