import React, { useState, useEffect, createContext } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { authAPI } from './services/api';

import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import DocumentUpload from './pages/DocumentUpload';
import DocumentView from './pages/DocumentView';
import Chat from './pages/Chat';
import Settings from './pages/Settings';
import Layout from './layouts/Layout';

export const AuthContext = createContext();
export const ThemeContext = createContext();

function App() {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [darkMode, setDarkMode] = useState(localStorage.getItem('darkMode') === 'true');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (token) {
      fetchUser();
    } else {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('darkMode', darkMode);
  }, [darkMode]);

  const fetchUser = async () => {
    try {
      const res = await authAPI.me();
      setUser(res.data);
    } catch (err) {
      logout();
    } finally {
      setLoading(false);
    }
  };

  const login = (newToken, userData) => {
    localStorage.setItem('token', newToken);
    localStorage.setItem('user', JSON.stringify(userData));
    setToken(newToken);
    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-500">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ user, token, login, logout }}>
      <ThemeContext.Provider value={{ darkMode, toggleTheme: () => setDarkMode(!darkMode) }}>
        <BrowserRouter>
          <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
            <Routes>
              <Route path="/" element={!user ? <Landing /> : <Navigate to="/dashboard" />} />
              <Route path="/login" element={!user ? <Login /> : <Navigate to="/dashboard" />} />
              <Route path="/register" element={!user ? <Register /> : <Navigate to="/dashboard" />} />

              <Route element={user ? <Layout /> : <Navigate to="/login" />}>
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/upload" element={<DocumentUpload />} />
                <Route path="/documents/:id" element={<DocumentView />} />
                <Route path="/chat" element={<Chat />} />
                <Route path="/chat/:documentId" element={<Chat />} />
                <Route path="/settings" element={<Settings />} />
              </Route>

              <Route path="*" element={<Navigate to="/" />} />
            </Routes>
          </div>
        </BrowserRouter>
      </ThemeContext.Provider>
    </AuthContext.Provider>
  );
}

export default App;