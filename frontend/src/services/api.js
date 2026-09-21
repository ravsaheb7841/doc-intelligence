import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: API_URL,
  timeout: 120000,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  register: (data) => api.post('/api/auth/register', data),
  login: (data) => api.post('/api/auth/login', data),
  me: () => api.get('/api/auth/me'),
};

export const documentsAPI = {
  upload: (file, onProgress) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post('/api/documents/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: onProgress,
    });
  },
  list: () => api.get('/api/documents'),
  get: (id) => api.get(`/api/documents/${id}`),
  process: (id) => api.post(`/api/documents/${id}/process`),
  delete: (id) => api.delete(`/api/documents/${id}`),
  getPageImage: (id, pageNum) => {
    const token = localStorage.getItem('token');
    return `${API_URL}/api/documents/${id}/page/${pageNum}?token=${token}`;
  },
};

export const extractionAPI = {
  extract: (id, data = {}) => api.post(`/api/documents/${id}/extract`, data),
  get: (id) => api.get(`/api/documents/${id}/extraction`),
  delete: (id) => api.delete(`/api/documents/${id}/extraction`),
};

export const chatAPI = {
  index: (docId, data = {}) => api.post(`/api/documents/${docId}/index`, data),
  chat: (data) => api.post('/api/documents/chat', data),
  history: (docId) =>
    api.get('/api/documents/chat/history', {
      params: docId ? { document_id: docId } : {},
    }),
  clearHistory: (docId) =>
    api.delete('/api/documents/chat/history', {
      params: docId ? { document_id: docId } : {},
    }),
  summarize: (docId, length = 'medium') =>
    api.post(`/api/documents/${docId}/summarize`, { length }),
  entities: (docId) => api.post(`/api/documents/${docId}/entities`),
};

export default api;