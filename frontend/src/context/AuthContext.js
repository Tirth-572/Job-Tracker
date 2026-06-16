import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { authAPI } from '../services/api';
import { connectSocket, disconnectSocket } from '../services/socket';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
 const [user, setUser] = useState(() => {
 try {
 const stored = localStorage.getItem('user');
 return stored ? JSON.parse(stored) : null;
 } catch {
 return null;
 }
 });
 const [loading, setLoading] = useState(true);
 const validateOnMount = useRef(true);

 useEffect(() => {
 // Skip validation if we're just mounting after a fresh login
 if (!validateOnMount.current) {
 setLoading(false);
 return;
 }

 const token = localStorage.getItem('token');
 if (!token) {
 setLoading(false);
 return;
 }

 // Validate the token on initial mount only
 authAPI.getMe()
 .then(({ data }) => {
 setUser(data);
 localStorage.setItem('user', JSON.stringify(data));
 try { connectSocket(token); } catch (e) { /* optional */ }
 })
 .catch((err) => {
 // Token expired or invalid — clear everything silently
 console.warn('Token validation failed:', err.message);
 localStorage.removeItem('token');
 localStorage.removeItem('user');
 setUser(null);
 })
 .finally(() => setLoading(false));
 }, []);

 const login = useCallback(async (credentials) => {
 const { data } = await authAPI.login(credentials);
 localStorage.setItem('token', data.token);
 localStorage.setItem('user', JSON.stringify(data.user));
 setUser(data.user);
 setLoading(false);
 validateOnMount.current = false; // Skip getMe on next mount
 try { connectSocket(data.token); } catch (e) { /* socket optional */ }
 return data;
 }, []);

 const dummyLogin = useCallback(async (email) => {
 const { data } = await authAPI.dummyLogin({ email });
 localStorage.setItem('token', data.token);
 localStorage.setItem('user', JSON.stringify(data.user));
 setUser(data.user);
 setLoading(false);
 validateOnMount.current = false;
 try { connectSocket(data.token); } catch (e) {}
 return data;
 }, []);


 const register = useCallback(async (userData) => {
 const { data } = await authAPI.register(userData);
 localStorage.setItem('token', data.token);
 localStorage.setItem('user', JSON.stringify(data.user));
 setUser(data.user);
 setLoading(false);
 validateOnMount.current = false; // Skip getMe on next mount
 try { connectSocket(data.token); } catch (e) { /* socket optional */ }
 return data;
 }, []);

 const googleLogin = useCallback(async (data) => {
 const response = await authAPI.googleLogin(data);
 if (response.data.requiresRoleSelection) {
 return response.data;
 }
 localStorage.setItem('token', response.data.token);
 localStorage.setItem('user', JSON.stringify(response.data.user));
 setUser(response.data.user);
 setLoading(false);
 validateOnMount.current = false;
 try { connectSocket(response.data.token); } catch (e) {}
 return response.data;
 }, []);

 const logout = useCallback(() => {
 localStorage.removeItem('token');
 localStorage.removeItem('user');
 setUser(null);
 validateOnMount.current = true;
 try { disconnectSocket(); } catch (e) { /* ignore */ }
 window.location.href = '/login';
 }, []);

 const refreshUser = useCallback(async () => {
 try {
 const { data } = await authAPI.getMe();
 setUser(data);
 localStorage.setItem('user', JSON.stringify(data));
 } catch (e) {
 console.warn('Refresh user failed:', e.message);
 }
 }, []);

 return (
 <AuthContext.Provider value={{ user, loading, login, dummyLogin, register, googleLogin, logout, refreshUser }}>
 {children}
 </AuthContext.Provider>
 );
};

export const useAuth = () => {
 const ctx = useContext(AuthContext);
 if (!ctx) throw new Error('useAuth must be used within AuthProvider');
 return ctx;
};
