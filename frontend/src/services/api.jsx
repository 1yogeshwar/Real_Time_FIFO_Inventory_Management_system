import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const api = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auth
export const login = async (username, password) => {
  const response = await api.post('/auth/login', { username, password });
  return response.data;
};

// Inventory
export const getInventoryStatus = async () => {
  const response = await api.get('/inventory/status');
  return response.data;
};

export const getTransactions = async (limit = 50, offset = 0) => {
  const response = await api.get('/inventory/transactions', {
    params: { limit, offset }
  });
  return response.data;
};

export const simulateEvents = async (events) => {
  const response = await api.post('/inventory/simulate', { events });
  return response.data;
};

export default api;