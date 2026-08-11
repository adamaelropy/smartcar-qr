const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

export const fetchServices = async (params = {}) => {
  const searchParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      searchParams.append(key, value);
    }
  });

  const queryString = searchParams.toString();
  const url = `${API_BASE_URL}/services${queryString ? `?${queryString}` : ''}`;

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error('Failed to fetch services');
  }

  const data = await response.json();
  return data.services || [];
};

export const searchServices = async (query) => {
  if (!query || !query.trim()) {
    return [];
  }

  const response = await fetch(`${API_BASE_URL}/services/search?query=${encodeURIComponent(query)}`);

  if (!response.ok) {
    throw new Error('Failed to search services');
  }

  const data = await response.json();
  return data.services || [];
};

export const filterServices = async ({ type, availability } = {}) => {
  const params = new URLSearchParams();

  if (type) params.append('type', type);
  if (availability !== undefined && availability !== null && availability !== '') {
    params.append('availability', String(availability));
  }

  const queryString = params.toString();
  const url = `${API_BASE_URL}/services/filter${queryString ? `?${queryString}` : ''}`;

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error('Failed to filter services');
  }

  const data = await response.json();
  return data.services || [];
};
