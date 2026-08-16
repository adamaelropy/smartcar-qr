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
        message: `Server error (${response.status}). Is the backend running on port 3000?`,
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

export async function fetchServices() {
  try {
    const response = await fetch(buildApiUrl('/services'));
    return parseResponse(response);
  } catch {
    return {
      ok: false,
      status: 0,
      data: {
        message: 'Unable to reach the server. Is the backend running on port 3000?',
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

export async function signup(username, password, confirmPassword) {
  const response = await fetch(buildApiUrl('/auth/signup'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password, confirmPassword }),
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

export async function fetchMyProfile(token) {
  const response = await fetch(buildApiUrl('/auth/me'), {
    headers: authHeaders(token),
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

export async function fetchMyVehicleQr(token) {
  const response = await fetch(buildApiUrl('/vehicles/me/qr'), {
    headers: authHeaders(token),
  });

  return parseResponse(response);
}

export async function fetchVehicleByQrToken(token) {
  const response = await fetch(buildApiUrl(`/qr/${encodeURIComponent(token)}`));

  return parseResponse(response);
}

export async function fetchMessages(token) {
  const response = await fetch(buildApiUrl('/messages'), {
    headers: authHeaders(token),
  });

  return parseResponse(response);
}

export async function sendAutoReply(token, threadId, mode = 'default') {
  const response = await fetch(buildApiUrl('/messages/reply'), {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify({ threadId, mode }),
  });

  return parseResponse(response);
}
