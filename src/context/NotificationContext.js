import React, { createContext, useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from './AuthContext';
import { API_URL } from '../config';

export const NotificationContext = createContext();

const API_BASE_URL = `${API_URL}/api/notifications`;

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);
  const [toast, setToast] = useState({ message: '', show: false });
  const { token, user } = useContext(AuthContext);

  useEffect(() => {
    if (token && user) {
      fetchNotifications();
      const interval = setInterval(fetchNotifications, 10000);
      return () => clearInterval(interval);
    } else {
      setNotifications([]);
    }
  }, [token, user]);

  const fetchNotifications = async () => {
    try {
      const res = await axios.get(API_BASE_URL);
      setNotifications(res.data);
    } catch (err) {
      console.error('Error fetching notifications:', err);
    }
  };

  const markAsRead = async (id) => {
    try {
      await axios.put(`${API_BASE_URL}/${id}/read`);
      setNotifications(prev => prev.map(n => n._id === id ? { ...n, read: true } : n));
    } catch (err) {
      console.error('Error marking notification as read:', err);
    }
  };

  const markAllAsRead = async () => {
    try {
      await axios.put(`${API_BASE_URL}/read-all`);
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      triggerToast('✔️ All notifications marked as read.');
    } catch (err) {
      console.error('Error marking all notifications as read:', err);
    }
  };

  const clearAllNotifications = async () => {
    try {
      await axios.delete(`${API_BASE_URL}/clear-all`);
      setNotifications([]);
      triggerToast('🗑️ All notifications cleared.');
    } catch (err) {
      console.error('Error clearing notifications:', err);
    }
  };

  const triggerToast = (message) => {
    setToast({ message, show: true });
    setTimeout(() => {
      setToast({ message: '', show: false });
    }, 4000);
  };

  return (
    <NotificationContext.Provider value={{
      notifications,
      fetchNotifications,
      markAsRead,
      markAllAsRead,
      clearAllNotifications,
      toast,
      triggerToast
    }}>
      {children}
      {toast.show && (
        <div className="quickkart-toast">
          <span style={{ fontSize: '20px' }}>🔔</span>
          <span style={{ fontWeight: '600' }}>{toast.message}</span>
        </div>
      )}
    </NotificationContext.Provider>
  );
};
