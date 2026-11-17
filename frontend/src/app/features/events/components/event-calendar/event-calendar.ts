import { ChangeDetectionStrategy, Component, OnInit, computed, input, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Event } from '../../../../core/models/event.model';
import { formatTime } from '../../../../shared/utils/format.util';
import {
  CalendarDay,
  addMonths,
  buildEventsByDay,
  buildMonthGrid,
  eventsInMonth,
  firstEventDayKey,
  formatEventDateRange,
  formatLongDate,
  formatMonthYear,
  initialMonth,
  keyToDate,
  startOfMonth,
  toDateKey
} from '../../utils/calendar.util';

@Component({
  selector: 'app-event-calendar',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink],
  template: `
    <div class="rounded-2xl border border-gray-200 bg-surface/80 p-4 shadow-sm backdrop-blur-sm dark:border-line sm:p-6">
      <div class="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div class="flex flex-wrap items-center gap-2">
          <button
            type="button"
            class="icon-button"
            aria-label="Mes anterior"
            title="Mes anterior"
            (click)="previousMonth()"
          >
            <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <path d="m15 18-6-6 6-6" />
            </svg>
          </button>
          <h2 class="min-w-48 text-center text-lg font-bold text-gray-900 sm:text-xl">
            {{ monthLabel() }}
          </h2>
          <button
            type="button"
            class="icon-button"
            aria-label="Mes siguiente"
            title="Mes siguiente"
            (click)="nextMonth()"
          >
            <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <path d="m9 18 6-6-6-6" />
            </svg>
          </button>
          <button type="button" class="button-secondary" (click)="goToToday()">Hoy</button>
        </div>

        <p class="text-sm font-medium text-gray-500">
          {{ monthEventCount() }} {{ monthEventCount() === 1 ? 'evento' : 'eventos' }} este mes
        </p>
      </div>

      <div class="hidden sm:block">
        <div class="grid grid-cols-7 gap-1 text-center text-xs font-semibold uppercase tracking-wider text-gray-400">
          @for (day of weekDays; track day) {
            <div class="py-2">{{ day }}</div>
          }
        </div>

        <div class="grid grid-cols-7 gap-1">
          @for (week of weeks(); track $index) {
            @for (day of week; track day.key) {
              <div
                role="button"
                tabindex="0"
                [class]="dayCellClass(day)"
                [attr.aria-label]="dayAriaLabel(day)"
                [attr.aria-pressed]="isSelected(day)"
                (click)="selectDay(day)"
                (keydown.enter)="selectDay(day)"
                (keydown.space)="selectDay(day); $event.preventDefault()"
              >
                <span [class]="dayNumberClass(day)">
                  {{ day.date.getDate() }}
                </span>

                <div class="flex min-w-0 flex-col gap-0.5">
                  @for (event of visibleDayEvents(day); track event._id) {
                    <a
                      [routerLink]="['/events', event._id]"
                      [class]="eventChipClass(event)"
                      [title]="event.name"
                      (click)="$event.stopPropagation()"
                    >
                      {{ event.name }}
                    </a>
                  }
                  @if (hiddenDayEventsCount(day) > 0) {
                    <span class="px-1.5 text-[11px] font-medium text-gray-500">
                      +{{ hiddenDayEventsCount(day) }} más
                    </span>
                  }
                </div>
              </div>
            }
          }
        </div>

        <div class="mt-5 rounded-xl border border-gray-200 bg-gray-50/60 p-4 dark:border-line dark:bg-night/70">
          <h3 class="mb-3 text-sm font-semibold text-gray-900">
            {{ selectedDayLabel() }}
          </h3>

          @if (selectedDayEvents().length === 0) {
            <p class="text-sm text-gray-500">No hay eventos para este día.</p>
          } @else {
            <ul class="space-y-2">
              @for (event of selectedDayEvents(); track event._id) {
                <li>
                  <a
                    [routerLink]="['/events', event._id]"
                    class="flex flex-col gap-1 rounded-lg border border-gray-200 p-3 transition-colors hover:border-brand/40 hover:bg-brand/5 dark:border-line dark:hover:bg-night2 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <span class="min-w-0">
                      <span class="block truncate text-sm font-semibold text-gray-900">
                        {{ event.name }}
                      </span>
                      <span class="mt-0.5 block text-xs text-gray-500">
                        {{ eventLocation(event) }} · {{ formatEventDateRange(event) }}
                      </span>
                    </span>
                    <span class="flex shrink-0 items-center gap-2 text-xs text-gray-500">
                      <span>{{ eventTime(event) }}</span>
                      <span [class]="eventBadgeClass(event)">{{ eventStatusLabel(event) }}</span>
                    </span>
                  </a>
                </li>
              }
            </ul>
          }
        </div>
      </div>

      <div class="sm:hidden">
        @if (monthEvents().length === 0) {
          <p class="rounded-xl border border-dashed border-gray-200 p-6 text-center text-sm text-gray-500">
            No hay eventos en este mes.
          </p>
        } @else {
          <ul class="space-y-2">
            @for (event of monthEvents(); track event._id) {
              <li>
                <a
                  [routerLink]="['/events', event._id]"
                  class="block rounded-xl border border-gray-200 bg-surface/80 p-4 transition-colors hover:border-brand/40 hover:bg-brand/5 dark:border-line dark:hover:bg-night2"
                >
                  <p class="text-xs font-semibold uppercase tracking-wide text-brand dark:text-accent">
                    {{ formatEventDateRange(event) }}
                  </p>
                  <p class="mt-1 font-semibold text-gray-900">{{ event.name }}</p>
                  <p class="mt-1 text-sm text-gray-500">{{ eventLocation(event) }}</p>
                  <div class="mt-2 flex items-center gap-2 text-xs text-gray-500">
                    <span>{{ eventTime(event) }}</span>
                    <span [class]="eventBadgeClass(event)">{{ eventStatusLabel(event) }}</span>
                  </div>
                </a>
              </li>
            }
          </ul>
        }
      </div>
    </div>
  `
})
export class EventCalendar implements OnInit {
  events = input.required<Event[]>();

  protected readonly weekDays = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

  private readonly viewDate = signal(startOfMonth(new Date()));
  private readonly selectedDate = signal<Date | null>(null);

  protected readonly monthLabel = computed(() => formatMonthYear(this.viewDate()));
  protected readonly weeks = computed(() => {
    const days = buildMonthGrid(this.viewDate());
    return Array.from({ length: 6 }, (_, index) => days.slice(index * 7, index * 7 + 7));
  });
  protected readonly eventsByDay = computed(() => buildEventsByDay(this.events()));
  protected readonly monthEvents = computed(() => eventsInMonth(this.events(), this.viewDate()));
  protected readonly monthEventCount = computed(() => this.monthEvents().length);
  protected readonly selectedKey = computed(() => {
    const selected = this.selectedDate();
    return selected ? toDateKey(selected) : null;
  });
  protected readonly selectedDayLabel = computed(() => {
    const selected = this.selectedDate();
    return selected ? formatLongDate(selected) : 'Selecciona un día';
  });
  protected readonly selectedDayEvents = computed(() => {
    const selected = this.selectedDate();
    if (!selected) {
      return [];
    }
    const key = this.selectedKey();
    return key ? this.eventsByDay().get(key) ?? [] : [];
  });

  ngOnInit(): void {
    const month = initialMonth(this.events());
    this.viewDate.set(month);
    this.selectFirstDay(month);
  }

  protected previousMonth(): void {
    this.changeMonth(-1);
  }

  protected nextMonth(): void {
    this.changeMonth(1);
  }

  protected goToToday(): void {
    const today = new Date();
    this.viewDate.set(startOfMonth(today));
    this.selectedDate.set(new Date(today.getFullYear(), today.getMonth(), today.getDate()));
  }

  protected selectDay(day: CalendarDay): void {
    this.selectedDate.set(new Date(day.date.getFullYear(), day.date.getMonth(), day.date.getDate()));
    if (!day.inMonth) {
      this.viewDate.set(startOfMonth(day.date));
    }
  }

  protected isSelected(day: CalendarDay): boolean {
    const selected = this.selectedDate();
    return selected !== null && selected.getTime() === day.date.getTime();
  }

  protected visibleDayEvents(day: CalendarDay): Event[] {
    return this.dayEvents(day).slice(0, 2);
  }

  protected hiddenDayEventsCount(day: CalendarDay): number {
    return Math.max(0, this.dayEvents(day).length - 2);
  }

  protected dayAriaLabel(day: CalendarDay): string {
    const count = this.dayEvents(day).length;
    const suffix = count === 0 ? ', sin eventos' : `, ${count} ${count === 1 ? 'evento' : 'eventos'}`;
    return `${formatLongDate(day.date)}${suffix}`;
  }

  protected dayNumberClass(day: CalendarDay): string {
    const base = 'inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold';
    return day.isToday
      ? `${base} bg-brand text-white dark:bg-brand dark:text-night`
      : base;
  }

  protected dayCellClass(day: CalendarDay): string {
    const base =
      'relative flex min-h-24 flex-col gap-1 rounded-lg border p-1.5 text-left align-top transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-brand/60';

    if (this.isSelected(day)) {
      return `${base} border-brand bg-brand/5 ring-2 ring-brand/30`;
    }
    if (day.isToday) {
      return `${base} border-brand/60 bg-surface`;
    }
    if (!day.inMonth) {
      return `${base} border-gray-200 bg-gray-50/60 text-gray-400 dark:border-line`;
    }
    return `${base} border-gray-200 bg-surface hover:border-brand/40 hover:bg-brand/5 dark:border-line dark:hover:bg-night2`;
  }

  protected eventChipClass(event: Event): string {
    const base = 'block truncate rounded px-1.5 py-0.5 text-[11px] font-medium leading-4 transition-colors';
    if (!event.isActive) {
      return `${base} bg-gray-100 text-gray-500 hover:bg-gray-200`;
    }
    if (event.status === 'draft') {
      return `${base} bg-amber-100 text-amber-800 hover:bg-amber-200`;
    }
    return `${base} bg-blue-50 text-blue-700 hover:bg-blue-100`;
  }

  protected eventBadgeClass(event: Event): string {
    const base = 'rounded-full px-2 py-0.5 text-[11px] font-semibold';
    if (!event.isActive) {
      return `${base} bg-gray-100 text-gray-500`;
    }
    if (event.status === 'draft') {
      return `${base} bg-amber-100 text-amber-800`;
    }
    return `${base} bg-blue-50 text-blue-700`;
  }

  protected eventStatusLabel(event: Event): string {
    if (!event.isActive) {
      return 'Inactivo';
    }
    return event.status === 'draft' ? 'Borrador' : 'Publicado';
  }

  protected eventLocation(event: Event): string {
    const location = event.location;
    if (!location) {
      return 'Sin ubicación';
    }
    return [location.name, location.city].filter((part): part is string => Boolean(part)).join(' · ');
  }

  protected eventTime(event: Event): string {
    return formatTime(event.startDate);
  }

  protected readonly formatEventDateRange = formatEventDateRange;

  private dayEvents(day: CalendarDay): Event[] {
    return this.eventsByDay().get(day.key) ?? [];
  }

  private changeMonth(offset: number): void {
    const month = addMonths(this.viewDate(), offset);
    this.viewDate.set(month);
    this.selectFirstDay(month);
  }

  private selectFirstDay(month: Date): void {
    const key = firstEventDayKey(this.eventsByDay(), month);
    this.selectedDate.set(key ? keyToDate(key) : null);
  }
}
