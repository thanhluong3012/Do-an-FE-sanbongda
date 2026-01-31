import api from '@/lib/axios';

export interface Field {
  id?: number;
  name: string;
  type: string;
  location: string;
  price: string;
  image?: string;
  description?: string;
  status: 'available' | 'maintenance' | 'unavailable';
  rating?: number;
  bookings?: number;
}

export const fieldService = {
  // Lấy tất cả sân
  getAll: async () => {
    const response = await api.get('/fields');
    return response.data;
  },

  // Lấy 1 sân theo ID
  getById: async (id: number) => {
    const response = await api.get(`/fields/${id}`);
    return response.data;
  },

  // Tạo sân mới
  create: async (data: Field) => {
    const response = await api.post('/fields', data);
    return response.data;
  },

  // Cập nhật sân
  update: async (id: number, data: Field) => {
    const response = await api.put(`/fields/${id}`, data);
    return response.data;
  },

  // Xóa sân
  delete: async (id: number) => {
    const response = await api.delete(`/fields/${id}`);
    return response.data;
  },

  // Tìm kiếm sân
  search: async (query: string) => {
    const response = await api.get(`/fields/search?q=${query}`);
    return response.data;
  },
};
