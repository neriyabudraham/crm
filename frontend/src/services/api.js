import axios from 'axios';

const api = axios.create({
  baseURL: 'https://crm.botomat.co.il/api',
});

// הוספת הטוקן לכל בקשה באופן אוטומטי
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
