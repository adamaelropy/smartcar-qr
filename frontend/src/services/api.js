export const API_BASE = (import.meta.env.VITE_API_URL || '/api').replace(/\/$/, '');

export function buildApiUrl(path = '') {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${API_BASE}${normalizedPath}`;
}

async function parseResponse(response) {
  let data;

  try {
    data = await response.json();
  } catch {
    return {
      ok: false,
      status: response.status,
      data: {
        message: `Server error (${response.status}). Unable to parse response from ${API_BASE}.`,
      },
    };
  }

  return { ok: response.ok, status: response.status, data };
}

function authHeaders(token) {
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  };
}

export async function fetchServices(options = {}) {
  try {
    const response = await fetch(buildApiUrl('/services'), { signal: options.signal });
    return parseResponse(response);
  } catch (err) {
    if (err?.name === 'AbortError') throw err;
    return {
      ok: false,
      status: 0,
      data: {
        message: `Unable to reach the server at ${API_BASE}. Please check your connection.`,
      },
    };
  }
}

export async function login(username, password) {
  const response = await fetch(buildApiUrl('/auth/login'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  });

  return parseResponse(response);
}

export async function signup(username, password, confirmPassword, anonymousId) {
  const payload = { username, password, confirmPassword };
  if (typeof anonymousId === 'string' && anonymousId.trim().length > 0) {
    payload.anonymousId = anonymousId.trim();
  }
  const response = await fetch(buildApiUrl('/auth/signup'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  return parseResponse(response);
}

export async function submitRegistration(formData, token) {
  const response = await fetch(buildApiUrl('/registration'), {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify(formData),
  });

  return parseResponse(response);
}

export async function fetchMyProfile(token, options = {}) {
  const response = await fetch(buildApiUrl('/auth/me'), {
    headers: authHeaders(token),
    signal: options.signal,
  });

  return parseResponse(response);
}

export async function updateMyProfile(token, profileData) {
  const response = await fetch(buildApiUrl('/auth/me'), {
    method: 'PUT',
    headers: authHeaders(token),
    body: JSON.stringify(profileData),
  });

  return parseResponse(response);
}

export async function changePassword(token, passwordData) {
  const response = await fetch(buildApiUrl('/auth/password'), {
    method: 'PUT',
    headers: authHeaders(token),
    body: JSON.stringify(passwordData),
  });

  return parseResponse(response);
}

export async function fetchMyVehicleQr(token, options = {}) {
  const response = await fetch(buildApiUrl('/vehicles/me/qr'), {
    headers: authHeaders(token),
    signal: options.signal,
  });

  return parseResponse(response);
}

export async function fetchVehicleByQrToken(token, options = {}) {
  const response = await fetch(buildApiUrl(`/qr/${encodeURIComponent(token)}`), {
    signal: options.signal,
  });

  return parseResponse(response);
}

export async function postQrMessage(qrToken, payload, authToken) {
  const headers = { 'Content-Type': 'application/json' };
  // If caller didn't pass an auth token, attempt to read the stored token from localStorage
  const effectiveToken = authToken || (typeof localStorage !== 'undefined' && localStorage.getItem('smartcar_token'));
  if (effectiveToken) headers.Authorization = `Bearer ${effectiveToken}`;

  try {
    const response = await fetch(buildApiUrl(`/qr/${encodeURIComponent(qrToken)}/message`), {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
    });

    return parseResponse(response);
  } catch (err) {
    if (err?.name === 'AbortError') throw err;
    return {
      ok: false,
      status: 0,
      data: {
        message: `Unable to reach the server at ${API_BASE}. Please check your connection.`,
      },
    };
  }
}

export async function fetchMessages(token, options = {}) {
  const response = await fetch(buildApiUrl('/messages'), {
    headers: authHeaders(token),
    signal: options.signal,
  });

  return parseResponse(response);
}

export async function sendMessage(token, threadId, message, mode = 'default') {
  const response = await fetch(buildApiUrl('/messages/send'), {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify({ threadId, message, mode }),
  });

  return parseResponse(response);
}

export async function sendAutoReply(token, threadId, mode = 'default') {
  return sendMessage(token, threadId, '', mode);
}

export async function markThreadRead(token, threadId) {
  const response = await fetch(buildApiUrl('/messages/read'), {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify({ threadId }),
  });

  return parseResponse(response);
}
