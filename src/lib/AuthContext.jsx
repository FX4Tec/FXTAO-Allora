
import React, { createContext, useState, useContext, useEffect } from 'react';
import api from '@/services/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [authError, setAuthError] = useState(null);
  const [assistedTenant, setAssistedTenant] = useState(() => {
    try {
      const stored = localStorage.getItem('assistedTenant');
      return stored ? JSON.parse(stored) : null;
    } catch (error) {
      localStorage.removeItem('assistedTenant');
      return null;
    }
  });

  useEffect(() => {
    checkUserAuth();
  }, []);

  const checkUserAuth = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      setIsLoadingAuth(false);
      return;
    }

    try {
      setIsLoadingAuth(true);
      const response = await api.get('/auth/me');
      setUser(response.data);
      setIsAuthenticated(true);
    } catch (error) {
      console.error('User auth check failed:', error);
      logout(false);
    } finally {
      setIsLoadingAuth(false);
    }
  };

  const login = async (email, password) => {
    try {
      const response = await api.post('/auth/login', { email, password });
      const { token, user } = response.data;

      localStorage.setItem('token', token);
      localStorage.removeItem('assistedTenant');
      setAssistedTenant(null);
      setUser(user);
      setIsAuthenticated(true);
      return user;
    } catch (error) {
      console.error('Login failed', error);
      throw error.response?.data?.error ? new Error(error.response.data.error) : error;
    }
  };

  const logout = (redirect = true) => {
    localStorage.removeItem('token');
    localStorage.removeItem('assistedTenant');
    setAssistedTenant(null);
    setUser(null);
    setIsAuthenticated(false);
    if (redirect) {
      window.location.href = '/Login';
    }
  };

  const startAssistedAccess = (tenant, targetPage = 'Settings') => {
    const payload = {
      id: tenant.id,
      slug: tenant.slug,
      display_name: tenant.display_name,
      legal_name: tenant.legal_name,
      plan_code: tenant.plan_code,
    };
    localStorage.setItem('assistedTenant', JSON.stringify(payload));
    setAssistedTenant(payload);
    window.location.href = `/${targetPage}`;
  };

  const endAssistedAccess = () => {
    localStorage.removeItem('assistedTenant');
    setAssistedTenant(null);
    window.location.href = '/SaasAdmin';
  };

  return (
    <AuthContext.Provider value={{
      user,
      isAuthenticated,
      isLoadingAuth,
      authError,
      login,
      logout,
      checkUserAuth,
      assistedTenant,
      startAssistedAccess,
      endAssistedAccess
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
