import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 60000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for adding auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    if (config.data instanceof FormData && config.headers) {
      // Let browser set multipart boundary automatically.
      delete config.headers['Content-Type'];
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for handling token refresh and returning data
api.interceptors.response.use(
  (response) => {
    const data = response.data;
    const config = response.config as any;

    if (config?.returnFullResponse) {
      return data;
    }

    // Only unwrap DRF paginated responses: object with array 'results' and numeric 'count'
    if (data && Array.isArray(data.results) && typeof data.count === 'number') {
      const results = data.results;
      Object.defineProperties(results, {
        count: { value: data.count, writable: true, configurable: true, enumerable: false },
        next: { value: data.next, writable: true, configurable: true, enumerable: false },
        previous: { value: data.previous, writable: true, configurable: true, enumerable: false },
        results: { value: data.results, writable: true, configurable: true, enumerable: false },
      });
      return results;
    }
    return data;
  },
  async (error) => {
    const originalRequest = error.config;
    const isAuthRequest = originalRequest?.url && (
      originalRequest.url.includes('/auth/login/') ||
      originalRequest.url.includes('/auth/register/')
    );

    // If the error is 401 and not already retrying, and not a login/register request
    if (error.response?.status === 401 && !originalRequest._retry && !isAuthRequest) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem('refresh_token');
        if (!refreshToken) {
          throw new Error('No refresh token available');
        }

        const response = await axios.post(`${API_BASE_URL}/auth/token/refresh/`, {
          refresh: refreshToken,
        });

        const { access } = response.data;
        localStorage.setItem('access_token', access);

        // Retry the original request with the new token
        originalRequest.headers.Authorization = `Bearer ${access}`;
        return api(originalRequest);
      } catch (refreshError) {
        // Refresh token failed or not present, clear invalid tokens
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('user');
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default api;
