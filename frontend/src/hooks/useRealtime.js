import { useState, useEffect, useCallback } from 'react';
import api from '../utils/api';

/**
 * Hook for auto-refreshing data at a given interval
 * @param {string} endpoint - API endpoint
 * @param {object} params - Query params
 * @param {number} interval - Refresh interval in ms (default 60s)
 */
export const useRealtime = (endpoint, params = {}, interval = 60000) => {
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  const fetchData = useCallback(async () => {
    try {
      const res = await api.get(endpoint, { params });
      setData(res.data.data || res.data);
      setLastUpdated(new Date());
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch data');
    } finally {
      setLoading(false);
    }
  }, [endpoint, JSON.stringify(params)]);

  useEffect(() => {
    fetchData();
    const timer = setInterval(fetchData, interval);
    return () => clearInterval(timer);
  }, [fetchData, interval]);

  return { data, loading, error, lastUpdated, refetch: fetchData };
};

/**
 * Hook for notifications with polling
 */
export const useNotifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount]     = useState(0);

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await api.get('/notifications');
      setNotifications(res.data.data || []);
      setUnreadCount(res.data.unread_count || 0);
    } catch (e) { /* silent */ }
  }, []);

  useEffect(() => {
    fetchNotifications();
    const timer = setInterval(fetchNotifications, 30000);
    return () => clearInterval(timer);
  }, [fetchNotifications]);

  const markRead = async (id) => {
    await api.put(`/notifications/${id}/read`);
    fetchNotifications();
  };

  const markAllRead = async () => {
    await api.put('/notifications/read-all');
    fetchNotifications();
  };

  return { notifications, unreadCount, markRead, markAllRead, refetch: fetchNotifications };
};
