// API Configuration
// This ensures API calls work in both development and production

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

// Helper function to build full API URLs
export const getApiUrl = (endpoint) => {
  // Remove leading slash if present to avoid double slashes
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;
  return `${API_BASE_URL}/${cleanEndpoint}`;
};

// Export base URL for direct use
export const API_URL = API_BASE_URL;

// Helper for fetch with automatic URL building
export const apiFetch = (endpoint, options = {}) => {
  return fetch(getApiUrl(endpoint), options);
};

export default {
  getApiUrl,
  API_URL,
  apiFetch
};
