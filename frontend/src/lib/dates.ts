/* ── Date utilities for the trip window ── */

/** Parse "2026-07-10" into year, month (0-based), day without timezone issues */
function parseDate(iso: string): [number, number, number] {
  const [y, m, d] = iso.split('-').map(Number);
  return [y, m - 1, d];
}

/** Generate array of date strings between start and end (inclusive) */
export function getDateRange(start: string, end: string): string[] {
  const dates: string[] = [];
  const [sy, sm, sd] = parseDate(start);
  const [ey, em, ed] = parseDate(end);
  const d = new Date(sy, sm, sd);
  const endD = new Date(ey, em, ed);
  while (d <= endD) {
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    dates.push(`${yyyy}-${mm}-${dd}`);
    d.setDate(d.getDate() + 1);
  }
  return dates;
}

/** Format "2026-07-10" -> "10 Jul" (short Spanish) */
export function formatDateShort(iso: string): string {
  const months = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
  const [, m, d] = parseDate(iso);
  return `${d} ${months[m]}`;
}

/** Format day of week short */
export function formatDayOfWeek(iso: string): string {
  const days = ['Dom','Lun','Mar','Mié','Jue','Vie','Sáb'];
  const [y, m, d] = parseDate(iso);
  return days[new Date(y, m, d).getDay()];
}
