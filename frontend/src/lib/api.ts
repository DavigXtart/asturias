/* ── Axios instance with header injection ── */

import axios from 'axios';
import { getGuestId, getAdminPin } from './identity';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL as string,
});

api.interceptors.request.use((config) => {
  const guestId = getGuestId();
  if (guestId !== null) {
    config.headers['X-Guest-Id'] = String(guestId);
  }
  const pin = getAdminPin();
  if (pin) {
    config.headers['X-Admin-Pin'] = pin;
  }
  return config;
});

export default api;
