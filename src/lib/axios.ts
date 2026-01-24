import axios from 'axios';

// Tạo axios instance với config mặc định
const api = axios.create({
  baseURL: 'http://localhost:8000/api', // Thay đổi URL này thành URL backend của bạn
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: false, // Nếu backend sử dụng cookies
});

//  để tự động thêm token vào header 
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor để xử lý response và error
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // Xử lý lỗi chung
    if (error.response?.status === 401) {
      // Token hết hạn hoặc không hợp lệ
      localStorage.removeItem('access_token');
      localStorage.removeItem('user');
      window.location.href = '/auth';
    }
    return Promise.reject(error);
  }
);

export default api;
