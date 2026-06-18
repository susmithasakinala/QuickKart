import React, { createContext, useState, useEffect } from 'react';
import axios from 'axios';
import { API_URL } from '../config';

export const AuthContext = createContext();

const API_BASE_URL = `${API_URL}/api/auth`;

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token') || '');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `${token}`;
      fetchProfile();
    } else {
      delete axios.defaults.headers.common['Authorization'];
      setUser(null);
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const fetchProfile = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/profile`);
      setUser(res.data);
    } catch (err) {
      console.error('Error fetching profile:', err.response?.data?.message || err.message);
      logout();
    } finally {
      setLoading(false);
    }
  };

  const login = async (name, email, password, role) => {
    try {
      const res = await axios.post(`${API_BASE_URL}/login`, { name, email, password, role });
      localStorage.setItem('token', res.data.token);
      setToken(res.data.token);
      setUser(res.data.user);
      return res.data.user;
    } catch (err) {
      throw new Error(err.response?.data?.message || 'Login failed');
    }
  };

  const register = async (name, email, password, role) => {
    try {
      const res = await axios.post(`${API_BASE_URL}/register`, {
        name,
        email,
        password,
        role
      });
      return res.data;
    } catch (err) {
      throw new Error(err.response?.data?.message || 'Registration failed');
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken('');
    setUser(null);
  };

  const switchRole = async (targetRole) => {
    try {
      const res = await axios.post(`${API_BASE_URL}/switch-role`, { role: targetRole });
      localStorage.setItem('token', res.data.token);
      setToken(res.data.token);
      setUser(res.data.user);
      return res.data.user;
    } catch (err) {
      throw new Error(err.response?.data?.message || 'Failed to switch role');
    }
  };

  const updateProfile = async (details) => {
    try {
      const res = await axios.put(`${API_BASE_URL}/profile`, details);
      setUser(res.data.user);
      return res.data.user;
    } catch (err) {
      throw new Error(err.response?.data?.message || 'Profile update failed');
    }
  };

  const deleteAccount = async () => {
    try {
      await axios.delete(`${API_BASE_URL}/profile`);
      logout();
    } catch (err) {
      throw new Error(err.response?.data?.message || 'Failed to delete account');
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      token,
      loading,
      login,
      register,
      logout,
      switchRole,
      updateProfile,
      deleteAccount
    }}>
      {children}
    </AuthContext.Provider>
  );
};
