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
    const token = sessionStorage.getItem('access_token');
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
      // Chỉ xóa token khi request CÓ GỬI token mà vẫn bị 401
      // (= token hết hạn / bị thu hồi). Không xóa khi gọi public API
      // vì sẽ gây chain failure cho các request auth khác đang chạy song song.
      const requestHadToken = !!error.config?.headers?.Authorization;
      if (requestHadToken) {
        console.warn('⚠️ 401 Unauthorized (with token) - Clearing auth data');
        sessionStorage.removeItem('access_token');
        sessionStorage.removeItem('user');
        sessionStorage.removeItem('auth_timestamp');
      } else {
        console.warn('⚠️ 401 Unauthorized (no token) - Skipping token clear');
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
