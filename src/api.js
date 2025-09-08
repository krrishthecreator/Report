// client/src/api.js
import axios from 'axios';

export const api = axios.create({ baseURL: 'http://localhost:4000/api' });

api.interceptors.request.use((cfg) => {
  const t = localStorage.getItem('token');
  if (t) cfg.headers.Authorization = `Bearer ${t}`;
  return cfg;
});
