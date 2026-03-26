import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import axios from 'axios';

const AdminAuthContext = createContext();

export const useAdminAuth = () => {
  const context = useContext(AdminAuthContext);
  if (!context) {
    throw new Error('useAdminAuth must be used within an AdminAuthProvider');
  }
  return context;
};

export const AdminAuthProvider = ({ children }) => {
  const [admin, setAdmin] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

  const checkAuthStatus = useCallback(async ({ silent = false } = {}) => {
    if (!silent) {
      setLoading(true);
    }

    try {
      const token = localStorage.getItem('adminToken');

      if (!token) {
        setAdmin(null);
        setIsAuthenticated(false);
        if (!silent) {
          setLoading(false);
        }
        return;
      }

      // Add retry logic for token validation
      let retries = 2;
      let response;

      while (retries > 0) {
        try {
          response = await axios.post(
            `${API_BASE_URL}/api/admin/validate-token`,
            {},
            {
              headers: {
                Authorization: `Bearer ${token}`,
              },
              timeout: 10000, // 10 second timeout
            }
          );
          break; // Success, exit retry loop
        } catch (error) {
          retries--;
          if (retries === 0) throw error;
          // Wait 1 second before retry
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }

      if (response.data.success) {
        setAdmin(response.data.admin);
        setIsAuthenticated(true);
      } else {
        // Invalid token, remove it
        localStorage.removeItem('adminToken');
        localStorage.removeItem('adminUser');
        setAdmin(null);
        setIsAuthenticated(false);
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      // Token is invalid or network error, remove it
      localStorage.removeItem('adminToken');
      localStorage.removeItem('adminUser');
      setAdmin(null);
      setIsAuthenticated(false);
    } finally {
      if (!silent) {
        setLoading(false);
      }
    }
  }, [API_BASE_URL]);

  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    const adminUser = localStorage.getItem('adminUser');

    if (!token) {
      setLoading(false);
      return;
    }

    if (adminUser) {
      try {
        const parsedAdmin = JSON.parse(adminUser);
        setAdmin(parsedAdmin);
        setIsAuthenticated(true);
        setLoading(false);
        checkAuthStatus({ silent: true });
        return;
      } catch (_error) {
        localStorage.removeItem('adminUser');
      }
    }

    checkAuthStatus();
  }, [checkAuthStatus]);

  const setAdminSession = useCallback((nextAdmin, token) => {
    if (token) {
      localStorage.setItem('adminToken', token);
    }
    if (nextAdmin) {
      localStorage.setItem('adminUser', JSON.stringify(nextAdmin));
      setAdmin(nextAdmin);
      setIsAuthenticated(true);
      return;
    }

    localStorage.removeItem('adminUser');
    setAdmin(null);
    setIsAuthenticated(false);
  }, []);

  const login = async (email, password) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/api/admin/login`, {
        email,
        password,
      });

      if (response.data.success) {
        const { token, admin } = response.data;

        // Store token
        localStorage.setItem('adminToken', token);

        // Update state
        setAdmin(admin);
        setIsAuthenticated(true);

        return { success: true };
      } else {
        return { success: false, message: response.data.message };
      }
    } catch (error) {
      console.error('Login failed:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Login failed. Please try again.',
      };
    }
  };

  const logout = async () => {
    try {
      const token = localStorage.getItem('adminToken');

      if (token) {
        // Call logout endpoint
        await axios.post(
          `${API_BASE_URL}/api/admin/logout`,
          {},
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
      }
    } catch (error) {
      console.error('Logout API call failed:', error);
      // Continue with logout even if API call fails
    } finally {
      // Clear local state and storage
      localStorage.removeItem('adminToken');
      localStorage.removeItem('adminUser');
      setAdminSession(null);
    }
  };

  const value = {
    admin,
    loading,
    isAuthenticated,
    login,
    logout,
    checkAuthStatus,
    setAdminSession,
  };

  return (
    <AdminAuthContext.Provider value={value}>
      {children}
    </AdminAuthContext.Provider>
  );
};