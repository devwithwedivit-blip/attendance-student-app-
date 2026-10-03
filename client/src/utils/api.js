import { handleMockRequest } from './mockBackend';

// In local dev, Vite proxy handles /api → localhost:5000
// In production (Netlify), set VITE_API_URL to your deployed backend URL
// e.g. https://your-backend.onrender.com
const BASE_URL = import.meta.env.VITE_API_URL || '';

/**
 * Universal API request wrapper with automatic offline / static-host fallback
 */
export async function apiRequest(endpoint, options = {}) {
  const token = localStorage.getItem('veriface_token');
  const headers = options.headers || {};

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  // If body is NOT FormData, default to application/json
  if (options.body && !(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
    options.body = JSON.stringify(options.body);
  }

  try {
    const response = await fetch(`${BASE_URL}${endpoint}`, {
      ...options,
      headers
    });

    // Check if Netlify or a static host returned HTML 404 for an API endpoint
    const contentType = response.headers.get('content-type') || '';
    const isHtmlResponse = contentType.includes('text/html');

    if (response.status === 404 && (!BASE_URL || isHtmlResponse)) {
      console.info(`[ERP Engine] Endpoint ${endpoint} handled by in-browser mock engine.`);
      return await handleMockRequest(endpoint, options);
    }

    if (response.status === 401) {
      // Unauthorized: token might be expired
      localStorage.removeItem('veriface_token');
      localStorage.removeItem('veriface_user');
      if (!window.location.pathname.includes('/login') && !window.location.pathname.includes('/signup')) {
        window.location.href = '/login';
      }
    }

    // Handle file downloads (e.g. CSV export)
    if (contentType && contentType.includes('text/csv')) {
      const blob = await response.blob();
      return blob;
    }

    const data = await response.json().catch(() => null);

    if (!response.ok) {
      const errorMsg = data?.error || `Request failed with status ${response.status}`;
      throw new Error(errorMsg);
    }

    return data;
  } catch (err) {
    // If backend is not running or network request fails on static host, fall back to mock
    if (!BASE_URL || err.name === 'TypeError' || err.message?.includes('fetch') || err.message?.includes('Failed to fetch')) {
      console.info(`[ERP Engine] Falling back to in-browser storage for ${endpoint}`);
      return await handleMockRequest(endpoint, options);
    }
    throw err;
  }
}

export const api = {
  get: (endpoint) => apiRequest(endpoint, { method: 'GET' }),
  post: (endpoint, body) => apiRequest(endpoint, { method: 'POST', body }),
  patch: (endpoint, body) => apiRequest(endpoint, { method: 'PATCH', body }),
  put: (endpoint, body) => apiRequest(endpoint, { method: 'PUT', body }),
  delete: (endpoint) => apiRequest(endpoint, { method: 'DELETE' }),

  // Custom helper for multipart photo check-in/out
  postMultipart: (endpoint, formData) => {
    return apiRequest(endpoint, {
      method: 'POST',
      body: formData
    });
  }
};
