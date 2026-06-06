/* ── Date utilities for the trip window ── */

/** Generate array of date strings between start and end (inclusive) */
export function getDateRange(start: string, end: string): string[] {
  const dates: string[] = [];
  const d = new Date(start + 'T00:00:00');
  const endD = new Date(end + 'T00:00:00');
  while (d <= endD) {
    dates.push(d.toISOString().slice(0, 10));
    d.setDate(d.getDate() + 1);
  }
  return dates;
}

/** Format "2026-07-10" -> "10 Jul" (short Spanish) */
export function formatDateShort(iso: string): string {
  const months = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
  const d = new Date(iso + 'T00:00:00');
  return `${d.getDate()} ${months[d.getMonth()]}`;
}

/** Format day of week short */
export function formatDayOfWeek(iso: string): string {
  const days = ['Dom','Lun','Mar','Mié','Jue','Vie','Sáb'];
  const d = new Date(iso + 'T00:00:00');
  return days[d.getDay()];
}
