import axios from 'axios';

const api = axios.create({
  baseURL: 'https://crm.botomat.co.il/api',
});

// הוספת הטוקן לכל בקשה באופן אוטומטי
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken') || localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// טיפול ב-401: ניסיון refresh, ואם נכשל — מעבר לדף התחברות
let isRefreshing = false;
let refreshQueue = [];

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;
    if (error.response?.status !== 401 || original._retry) return Promise.reject(error);
    if (original.url?.includes('/account/login') || original.url?.includes('/account/refresh')) return Promise.reject(error);

    original._retry = true;
    const refreshToken = localStorage.getItem('refreshToken');
    if (!refreshToken) {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('account');
      window.location.href = '/';
      return Promise.reject(error);
    }

    if (isRefreshing) {
      return new Promise((resolve, reject) => refreshQueue.push({ resolve, reject, original }));
    }

    isRefreshing = true;
    try {
      const r = await axios.post('https://crm.botomat.co.il/api/account/refresh', { refreshToken });
      localStorage.setItem('accessToken', r.data.accessToken);
      refreshQueue.forEach(({ resolve, original: o }) => {
        o.headers.Authorization = `Bearer ${r.data.accessToken}`;
        resolve(api(o));
      });
      refreshQueue = [];
      original.headers.Authorization = `Bearer ${r.data.accessToken}`;
      return api(original);
    } catch (e) {
      refreshQueue.forEach(({ reject }) => reject(e));
      refreshQueue = [];
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('account');
      window.location.href = '/';
      return Promise.reject(e);
    } finally {
      isRefreshing = false;
    }
  }
);

export default api;
