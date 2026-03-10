import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

// Create axios instance
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000, // 30 seconds
});

// Request interceptor to add auth token
apiClient.interceptors.request.use(
  (config) => {
    // Add admin token if available
    const adminToken = localStorage.getItem('adminToken');
    if (adminToken) {
      config.headers.Authorization = `Bearer ${adminToken}`;
    }
    
    // Add student token if no admin token and student token exists
    if (!adminToken) {
      const studentToken = localStorage.getItem('studentAuthToken');
      if (studentToken) {
        config.headers.Authorization = `Bearer ${studentToken}`;
      }
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle auth errors
apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      const adminToken = localStorage.getItem('adminToken');
      const studentToken = localStorage.getItem('studentAuthToken');
      
      if (adminToken) {
        // Admin token expired
        localStorage.removeItem('adminToken');
        localStorage.removeItem('adminUser');
        
        // Redirect to login if not already there
        if (window.location.pathname !== '/login') {
          window.location.href = '/login?expired=true';
        }
      } else if (studentToken) {
        // Student token expired
        localStorage.removeItem('studentAuthToken');
        localStorage.removeItem('studentId');
        localStorage.removeItem('studentName');
        localStorage.removeItem('rollNumber');
        localStorage.removeItem('email');
        localStorage.removeItem('institute');
        
        // Redirect to login if not already there
        if (window.location.pathname !== '/login') {
          window.location.href = '/login?expired=true';
        }
      }
    }
    
    return Promise.reject(error);
  }
);

export default apiClient;