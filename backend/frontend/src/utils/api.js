/**
 * API helper that automatically includes the current user ID for audit trail.
 * Use this for all mutate operations (insert, update, delete) so the audit log
 * correctly attributes actions to the logged-in user.
 */

const getBaseUrl = () => process.env.REACT_APP_API_URL || '';

const getAuthHeaders = (omitContentType = false) => {
  const headers = {};
  if (!omitContentType) headers['Content-Type'] = 'application/json';
  const userId = sessionStorage.getItem('id');
  if (userId) headers['X-User-Id'] = userId;
  return headers;
};

/**
 * Add user_id_session to a JSON body for DatabaseController endpoints.
 */
const withUserContext = (body) => {
  if (body && typeof body === 'object') {
    const userId = sessionStorage.getItem('id');
    if (userId) {
      return { ...body, user_id_session: parseInt(userId, 10) };
    }
  }
  return body;
};

/**
 * Fetch wrapper that adds X-User-Id header and optionally user_id_session to body.
 * @param {string} endpoint - e.g. 'select', 'insert', 'update', 'delete', 'audit-trail'
 * @param {object} options - fetch options (method, body, etc.)
 * @param {boolean} includeUserInBody - if true, adds user_id_session to JSON body (for DatabaseController)
 */
export async function apiFetch(endpoint, options = {}, includeUserInBody = false) {
  const url = getBaseUrl() + endpoint;
  const isFormData = options.body && options.body instanceof FormData;
  const opts = {
    ...options,
    headers: { ...getAuthHeaders(isFormData), ...(options.headers || {}) },
  };
  if (includeUserInBody && opts.body && typeof opts.body === 'string') {
    try {
      const parsed = JSON.parse(opts.body);
      opts.body = JSON.stringify(withUserContext(parsed));
    } catch (e) {
      // leave body as-is
    }
  }
  return fetch(url, opts);
}
