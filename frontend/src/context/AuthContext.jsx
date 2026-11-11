import React, { createContext, useContext, useState, useEffect } from 'react';
import { authService, notificationService } from '../services/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem('user');
    return savedUser ? JSON.parse(savedUser) : null;
  });
  const [token, setToken] = useState(() => localStorage.getItem('token') || null);
  const [loading, setLoading] = useState(true);
  const [unreadNotifications, setUnreadNotifications] = useState(0);

  // Fetch current user and unread notification count on mount
  useEffect(() => {
    const initAuth = async () => {
      const storedToken = localStorage.getItem('token');
      if (storedToken) {
        try {
          const res = await authService.getMe();
          if (res.data.success) {
            setUser(res.data.user);
            localStorage.setItem('user', JSON.stringify(res.data.user));
            // Also fetch notifications
            refreshNotifications();
          }
        } catch (err) {
          console.error('Failed to authenticate session:', err);
          logout();
        }
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  const refreshNotifications = async () => {
    try {
      const res = await notificationService.getAll({ limit: 10 });
      if (res.data.success) {
        setUnreadNotifications(res.data.unreadCount || 0);
      }
    } catch (err) {
      // Ignore background notification fetch error
    }
  };

  const login = async (email, password) => {
    const res = await authService.login({ email, password });
    if (res.data.success) {
      const { token: newToken, user: newUser } = res.data;
      localStorage.setItem('token', newToken);
      localStorage.setItem('user', JSON.stringify(newUser));
      setToken(newToken);
      setUser(newUser);
      refreshNotifications();
      return newUser;
    }
    throw new Error(res.data.message || 'Login failed');
  };

  const register = async (name, email, password, confirmPassword, currency = '$') => {
    const res = await authService.register({
      name,
      email,
      password,
      confirmPassword,
      currency
    });
    if (res.data.success) {
      const { token: newToken, user: newUser } = res.data;
      localStorage.setItem('token', newToken);
      localStorage.setItem('user', JSON.stringify(newUser));
      setToken(newToken);
      setUser(newUser);
      refreshNotifications();
      return newUser;
    }
    throw new Error(res.data.message || 'Registration failed');
  };

  const logout = async () => {
    try {
      await authService.logout();
    } catch (e) {
      // Proceed with client logout even if request fails
    }
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
    setUnreadNotifications(0);
  };

  const updateUser = (updatedUser) => {
    setUser(updatedUser);
    localStorage.setItem('user', JSON.stringify(updatedUser));
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        isAuthenticated: !!token && !!user,
        unreadNotifications,
        setUnreadNotifications,
        refreshNotifications,
        login,
        register,
        logout,
        updateUser
      }}
    >
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
