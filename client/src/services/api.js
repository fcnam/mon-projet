import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Create axios instance
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Handle responses and errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth endpoints
export const authAPI = {
  login: (credentials) => api.post('/auth/login', credentials),
  register: (userData) => api.post('/auth/register', userData),
  getCurrentUser: () => api.get('/auth/me'),
};

// Systems endpoints
export const systemsAPI = {
  getAll: () => api.get('/systems'),
  getById: (id) => api.get(`/systems/${id}`),
  update: (id, data) => api.put(`/systems/${id}`, data),
  switch: (id, targetId, reason) => api.post(`/systems/${id}/switch`, { targetSystemId: targetId, reason }),
  getStats: (id) => api.get(`/systems/${id}/stats`),
};

// Scenarios endpoints
export const scenariosAPI = {
  getAll: () => api.get('/scenarios'),
  getById: (id) => api.get(`/scenarios/${id}`),
  execute: (id, notes) => api.post(`/scenarios/${id}/execute`, { notes }),
  create: (data) => api.post('/scenarios', data),
};

// Incidents endpoints
export const incidentsAPI = {
  getAll: (params) => api.get('/incidents', { params }),
  getById: (id) => api.get(`/incidents/${id}`),
  create: (data) => api.post('/incidents', data),
  update: (id, data) => api.put(`/incidents/${id}`, data),
  getStats: () => api.get('/incidents/stats/summary'),
};

// Logs endpoints
export const logsAPI = {
  getAll: (params) => api.get('/logs', { params }),
  create: (data) => api.post('/logs', data),
};

// Users endpoints
export const usersAPI = {
  getAll: () => api.get('/users'),
  getById: (id) => api.get(`/users/${id}`),
  create: (data) => api.post('/users', data),
  update: (id, data) => api.put(`/users/${id}`, data),
  delete: (id) => api.delete(`/users/${id}`),
};

export default api;