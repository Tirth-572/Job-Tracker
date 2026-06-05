import React, { createContext, useContext, useState, useEffect } from 'react';
import { getSocket } from '../services/socket';
import { notificationAPI } from '../services/api';
import { useAuth } from './AuthContext';

const NotificationContext = createContext({ notifications: [], unreadCount: 0, markRead: () => {}, markAllRead: () => {} });

export const NotificationProvider = ({ children }) => {
 const { user } = useAuth();
 const [notifications, setNotifications] = useState([]);
 const [unreadCount, setUnreadCount] = useState(0);

 useEffect(() => {
 if (!user) {
 setNotifications([]);
 setUnreadCount(0);
 return;
 }

 // Fetch notifications only when user is authenticated
 notificationAPI.getAll()
 .then(({ data }) => setNotifications(data))
 .catch(() => {});

 notificationAPI.getUnreadCount()
 .then(({ data }) => setUnreadCount(data.count))
 .catch(() => {});

 const socket = getSocket();
 if (!socket) return;

 const handler = (notif) => {
 setNotifications(prev => [notif, ...prev]);
 setUnreadCount(prev => prev + 1);
 };
 socket.on('notification', handler);
 return () => socket.off('notification', handler);
 }, [user]);

 const markRead = async (id) => {
 try {
 await notificationAPI.markRead(id);
 setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
 setUnreadCount(prev => Math.max(0, prev - 1));
 } catch (e) { /* ignore */ }
 };

 const markAllRead = async () => {
 try {
 await notificationAPI.markAllRead();
 setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
 setUnreadCount(0);
 } catch (e) { /* ignore */ }
 };

 return (
 <NotificationContext.Provider value={{ notifications, unreadCount, markRead, markAllRead }}>
 {children}
 </NotificationContext.Provider>
 );
};

export const useNotifications = () => useContext(NotificationContext);
