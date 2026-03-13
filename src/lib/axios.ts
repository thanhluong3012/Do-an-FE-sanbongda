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
      console.warn('⚠️ 401 Unauthorized - Clearing auth data');
      
      // Clear localStorage
      localStorage.removeItem('access_token');
      localStorage.removeItem('user');
      localStorage.removeItem('auth_timestamp');
      
      // Chỉ redirect nếu không phải đang ở trang auth
      const currentPath = window.location.pathname;
      if (!currentPath.includes('/auth')) {
        console.log('🔄 Redirecting to login page');
        window.location.href = '/auth';
      }
    }
    
    // Log errors để debug
    if (error.response?.status === 403) {
      console.warn('⚠️ 403 Forbidden - Insufficient permissions');
    }
    
    if (error.response?.status >= 500) {
      console.error('❌ Server error:', error.response.status, error.response.data);
    }
    
    return Promise.reject(error);
  }
);

export default api;
