import { Event } from '../../../core/models/event.model';

export interface CalendarDay {
  date: Date;
  key: string;
  inMonth: boolean;
  isToday: boolean;
}

export interface EventRange {
  start: Date;
  end: Date;
}

export function toDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function startOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

export function addMonths(date: Date, amount: number): Date {
  return new Date(date.getFullYear(), date.getMonth() + amount, 1);
}

export function buildMonthGrid(monthDate: Date): CalendarDay[] {
  const first = startOfMonth(monthDate);
  const mondayOffset = (first.getDay() + 6) % 7;
  const start = new Date(first.getFullYear(), first.getMonth(), first.getDate() - mondayOffset);
  const todayKey = toDateKey(new Date());

  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(start.getFullYear(), start.getMonth(), start.getDate() + index);
    return {
      date,
      key: toDateKey(date),
      inMonth: date.getMonth() === first.getMonth() && date.getFullYear() === first.getFullYear(),
      isToday: toDateKey(date) === todayKey
    };
  });
}

export function eventRange(event: Event): EventRange | null {
  const start = new Date(event.startDate);
  if (Number.isNaN(start.getTime())) {
    return null;
  }

  let end = event.endDate ? new Date(event.endDate) : new Date(start);
  if (Number.isNaN(end.getTime()) || end.getTime() < start.getTime()) {
    end = new Date(start);
  }

  return {
    start: new Date(start.getFullYear(), start.getMonth(), start.getDate()),
    end: new Date(end.getFullYear(), end.getMonth(), end.getDate())
  };
}

export function buildEventsByDay(events: Event[]): Map<string, Event[]> {
  const byDay = new Map<string, Event[]>();

  for (const event of events) {
    const range = eventRange(event);
    if (!range) {
      continue;
    }

    const cursor = new Date(range.start);
    while (cursor.getTime() <= range.end.getTime()) {
      const key = toDateKey(cursor);
      const list = byDay.get(key) ?? [];
      list.push(event);
      byDay.set(key, list);
      cursor.setDate(cursor.getDate() + 1);
    }
  }

  for (const list of byDay.values()) {
    list.sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());
  }

  return byDay;
}

export function eventsInMonth(events: Event[], monthDate: Date): Event[] {
  const monthStart = startOfMonth(monthDate);
  const monthEnd = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0);

  return events
    .filter((event) => {
      const range = eventRange(event);
      if (!range) {
        return false;
      }
      return range.start.getTime() <= monthEnd.getTime() && range.end.getTime() >= monthStart.getTime();
    })
    .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());
}

export function initialMonth(events: Event[], from = new Date()): Date {
  const today = new Date(from.getFullYear(), from.getMonth(), from.getDate());
  const startDates = events
    .map((event) => new Date(event.startDate))
    .filter((date) => !Number.isNaN(date.getTime()))
    .sort((a, b) => a.getTime() - b.getTime());

  const next = startDates.find((date) => date.getTime() >= today.getTime());
  const reference = next ?? startDates[startDates.length - 1] ?? today;
  return startOfMonth(reference);
}

export function firstEventDayKey(eventsByDay: Map<string, Event[]>, monthDate: Date): string | null {
  const daysInMonth = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0).getDate();

  for (let day = 1; day <= daysInMonth; day += 1) {
    const key = toDateKey(new Date(monthDate.getFullYear(), monthDate.getMonth(), day));
    if (eventsByDay.has(key)) {
      return key;
    }
  }

  return null;
}

export function formatMonthYear(date: Date): string {
  const label = date.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });
  return label.charAt(0).toUpperCase() + label.slice(1);
}

export function formatLongDate(date: Date): string {
  const label = date.toLocaleDateString('es-ES', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  });
  return label.charAt(0).toUpperCase() + label.slice(1);
}

export function formatEventDateRange(event: Event): string {
  const range = eventRange(event);
  if (!range) {
    return '-';
  }

  const start = range.start.toLocaleDateString('es-ES', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });

  if (range.start.getTime() === range.end.getTime()) {
    return start;
  }

  const end = range.end.toLocaleDateString('es-ES', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });
  return `${start} – ${end}`;
}

export function keyToDate(key: string): Date {
  const [year, month, day] = key.split('-').map(Number);
  return new Date(year, month - 1, day);
}
