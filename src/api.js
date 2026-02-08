/**
 * A wrapper for the fetch API that automatically handles API URLs and authentication tokens.
 */

/**
 * Constructs the full API URL by prepending the base URL from environment variables.
 * In production (e.g., on Netlify), it uses VITE_API_URL.
 * In local development, it falls back to an empty string, making requests relative to the frontend's origin.
 * @param {string} endpoint - The API endpoint (e.g., '/api/user').
 * @returns {string} The full URL for the API request.
 */
const getApiUrl = (endpoint) => {
  // Support both env var names used across the project/configs
  const apiUrl = import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE_URL || '';
  return `${apiUrl}${endpoint}`;
};

/**
 * Performs a fetch request with default headers and authentication.
 * @param {string} endpoint - The API endpoint to call (e.g., '/api/login').
 * @param {object} [options={}] - The options for the fetch call (method, body, custom headers, etc.).
 * @returns {Promise<Response>} The fetch Response object.
 */
export const apiFetch = (endpoint, options = {}) => {
  const url = getApiUrl(endpoint);
  const token = localStorage.getItem('authToken');

  const method = (options.method || 'GET').toUpperCase();
  const incomingHeaders = options.headers || {};
  const headers = {
    Accept: 'application/json',
    ...incomingHeaders,
  };

  const hasExplicitContentType = Object.prototype.hasOwnProperty.call(headers, 'Content-Type');

  if (options.body instanceof FormData) {
    if (!hasExplicitContentType) {
      delete headers['Content-Type'];
    }
  } else if (!hasExplicitContentType && (method !== 'GET' || options.body)) {
    headers['Content-Type'] = 'application/json';
  }

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  return fetch(url, {
    ...options,
    headers,
  });
};
