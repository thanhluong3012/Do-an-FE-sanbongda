// API Configuration for VietQR integration

// Get API URL from environment
export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

// API Endpoints
export const API_ENDPOINTS = {
  // VietQR endpoints
  vietqr: {
    createQR: (bookingId: number) => `${API_URL}/vietqr/create-payment/${bookingId}`,
    checkStatus: (bookingId: number) => `${API_URL}/vietqr/check-status/${bookingId}`,
    getBanks: `${API_URL}/vietqr/banks`,
  },
  
  // Booking endpoints
  booking: {
    list: `${API_URL}/books`,
    detail: (id: number) => `${API_URL}/books/${id}`,
    create: `${API_URL}/books`,
    uploadBill: (id: number) => `${API_URL}/books/${id}/upload-payment-proof`,
    confirmPayment: (id: number) => `${API_URL}/books/${id}/confirm-payment`,
  }
};

// Helper to get token from storage
export const getAuthToken = (): string | null => {
  return sessionStorage.getItem('access_token') || localStorage.getItem('access_token');
};

// Helper to create auth headers
export const getAuthHeaders = () => {
  const token = getAuthToken();
  return {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  };
};
