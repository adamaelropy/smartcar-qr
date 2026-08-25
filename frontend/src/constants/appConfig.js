export const SUPPORT_EMAIL = 'support@smartcar-qr.app';
export const GOOGLE_MAPS_BASE_URL = 'https://maps.google.com/?q=';
export const QR_PATH_PREFIX = '/qr';
export const API_FALLBACK_MESSAGE = 'Unable to reach the server. Please check your connection.';

export function buildQrUrl(qrToken) {
  if (!qrToken) return '';
  return `${window.location.origin}${QR_PATH_PREFIX}/${qrToken}`;
}

export function buildGoogleMapsUrl(lat, lng) {
  return `${GOOGLE_MAPS_BASE_URL}${lat},${lng}`;
}
