/* ── Identity: localStorage guest ID + admin PIN ── */

const GUEST_ID_KEY = 'asturias2026_guestId';
const ADMIN_PIN_KEY = 'asturias2026_adminPin';

export function getGuestId(): number | null {
  const v = localStorage.getItem(GUEST_ID_KEY);
  return v ? Number(v) : null;
}

export function setGuestId(id: number): void {
  localStorage.setItem(GUEST_ID_KEY, String(id));
}

export function clearGuestId(): void {
  localStorage.removeItem(GUEST_ID_KEY);
}

export function getAdminPin(): string | null {
  return localStorage.getItem(ADMIN_PIN_KEY);
}

export function setAdminPin(pin: string): void {
  localStorage.setItem(ADMIN_PIN_KEY, pin);
}

export function clearAdminPin(): void {
  localStorage.removeItem(ADMIN_PIN_KEY);
}

export function isAdmin(): boolean {
  return !!getAdminPin();
}
