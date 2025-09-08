// client/src/App.jsx
import React, { useEffect, useState, useCallback } from 'react';
import { Routes, Route, useNavigate, Navigate } from 'react-router-dom';
import { api } from './api';
import Topbar from './components/Topbar';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';

export default function App() {
  const navigate = useNavigate();

  const [admin, setAdmin] = useState(null);
  const [loading, setLoading] = useState(true);

  // Centralized logout
  const clearAuth = useCallback(() => {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    localStorage.removeItem('scope');
    localStorage.removeItem('email');
    localStorage.removeItem('me');
    delete api.defaults.headers?.common?.Authorization;
    setAdmin(null);
    navigate('/login', { replace: true });
  }, [navigate]);

  // Auto-logout on 401 responses
  useEffect(() => {
    const id = api.interceptors.response.use(
      (res) => res,
      (err) => {
        if (err?.response?.status === 401) {
          clearAuth();
        }
        return Promise.reject(err);
      }
    );
    return () => api.interceptors.response.eject(id);
  }, [clearAuth]);

  // Load current admin (only if token exists)
  const fetchMe = useCallback(async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      setAdmin(null);
      setLoading(false);
      return;
    }
    try {
      const { data } = await api.get('/auth/me');
      setAdmin(data);
    } catch {
      setAdmin(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchMe(); }, [fetchMe]);

  if (loading) {
    return (
      <div className="min-h-screen grid place-items-center">
        Loading…
      </div>
    );
  }

  return (
    <div>
      {admin && <Topbar admin={admin} onLogout={clearAuth} />}

      <Routes>
        <Route
          path="/login"
          element={
            admin
              ? <Navigate to="/" replace />
              : <Login onAuthed={async () => { await fetchMe(); navigate('/', { replace: true }); }} />
          }
        />
        <Route
          path="/"
          element={
            <ProtectedRoute isAuthed={!!admin}>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        {/* Optional: catch-all */}
        <Route path="*" element={<Navigate to={admin ? '/' : '/login'} replace />} />
      </Routes>
    </div>
  );
}
