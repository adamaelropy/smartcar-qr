const API_BASE = '/api';

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

export async function login(username, password) {
  const response = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  });

  return parseResponse(response);
}

export async function signup(username, password, confirmPassword) {
  const response = await fetch(`${API_BASE}/auth/signup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password, confirmPassword }),
  });

  return parseResponse(response);
}

export async function submitRegistration(formData, token) {
  const response = await fetch(`${API_BASE}/registration`, {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify(formData),
  });

  return parseResponse(response);
}
