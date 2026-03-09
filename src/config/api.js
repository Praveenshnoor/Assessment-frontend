// API Configuration
// This ensures API calls work in both development and production

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

// Timeout for API requests (30 seconds for cold starts)
const API_TIMEOUT = 30000;

// Helper function to build full API URLs
export const getApiUrl = (endpoint) => {
  // Remove leading slash if present to avoid double slashes
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;
  return `${API_BASE_URL}/${cleanEndpoint}`;
};

// Export base URL for direct use
export const API_URL = API_BASE_URL;

// Helper for fetch with automatic URL building and timeout
export const apiFetch = async (endpoint, options = {}) => {
  const controller = new AbortController();

  // Don't apply tight timeouts to upload routes or report generations
  const isLongRequest = endpoint.includes('/upload') || endpoint.includes('/export') || endpoint.includes('/predict');
  const timeoutDuration = isLongRequest ? 120000 : API_TIMEOUT;

  // If external signal provided, listen to it and abort our controller
  if (options.signal) {
    options.signal.addEventListener('abort', () => controller.abort());
  }

  const timeoutId = setTimeout(() => controller.abort(), timeoutDuration);

  try {
    const response = await fetch(getApiUrl(endpoint), {
      ...options,
      signal: controller.signal
    });

    // Check for maintenance mode (503 status)
    if (response.status === 503 && !endpoint.includes('/settings/public')) {
      try {
        const cloned = response.clone();
        const data = await cloned.json();
        if (data.code === 'MAINTENANCE') {
          localStorage.setItem('maintenance_message', data.message || '');
          if (window.location.pathname !== '/maintenance') {
            // Let admins bypass maintenance
            if (!window.location.pathname.startsWith('/admin')) {
              sessionStorage.setItem('redirect_after_recovery', window.location.pathname + window.location.search);
              window.location.href = '/maintenance';
              return new Promise(() => { }); // prevent resolving so calling components don't crash
            }
          }
        }
      } catch (e) {
        // Ignore if parsing fails
      }
    }

    return response;
  } catch (error) {
    // Catch absolute network failures (server completely off) or aborts (timeouts)
    if (error.name === 'TypeError' || error.name === 'AbortError') {
      if (
        !endpoint.includes('/settings/public') &&
        window.location.pathname !== '/server-down' &&
        window.location.pathname !== '/maintenance'
      ) {
        sessionStorage.setItem('redirect_after_recovery', window.location.pathname + window.location.search);
        window.location.href = '/server-down';
        return new Promise(() => { }); // block execution
      }
    }
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
};

export default {
  getApiUrl,
  API_URL,
  apiFetch
};
