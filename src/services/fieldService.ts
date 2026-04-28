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

  // Lấy danh sách khung giờ đã book theo ngày (API mới)
  getBookedSlots: async (fieldId: number, date: string): Promise<BookedSlot[]> => {
    try {
      console.log(`🔍 API: GET /fields/${fieldId}/booked-slots?date=${date}`);
      const response = await api.get(`/fields/${fieldId}/booked-slots`, {
        params: { date }
      });
      
      console.log('📦 Booked slots response:', response.data);
      const data = response.data?.data || response.data;
      const slots = data?.booked_slots || [];
      
      console.log(`✅ Received ${slots.length} booked slots for ${date}`);
      return slots;
    } catch (error) {
      console.error('❌ Error fetching booked slots:', error);
      return [];
    }
  },

  // Kiểm tra xem 1 slot cụ thể có available không (API mới)
  checkAvailability: async (fieldId: number, data: {
    date: string;
    start_time: string;
    end_time: string;
  }): Promise<{ is_available: boolean; message: string }> => {
    try {
      console.log(`🔍 API: POST /fields/${fieldId}/check-availability`, data);
      const response = await api.post(`/fields/${fieldId}/check-availability`, data);
      
      console.log('📦 Availability check response:', response.data);
      const result = response.data?.data || response.data;
      
      return {
        is_available: result.is_available ?? true,
        message: result.message || 'Khung giờ có thể đặt'
      };
    } catch (error: any) {
      console.error('❌ Error checking availability:', error);
      console.error('❌ Error response:', error.response?.data);
      console.error('❌ Error status:', error.response?.status);
      
      // Nếu API trả về validation error hoặc conflict
      if (error.response?.data) {
        const errorData = error.response.data;
        return {
          is_available: false,
          message: errorData.message || errorData.error || 'Không thể kiểm tra khả dụng'
        };
      }
      
      // Nếu network error hoặc server error, cho phép booking (fail-open)
      console.warn('⚠️ Availability check failed, allowing booking to proceed');
      return {
        is_available: true,
        message: 'Không thể kiểm tra khả dụng, tiếp tục đặt sân'
      };
    }
  },
};

// Interface cho booked slot
export interface BookedSlot {
  id: number;
  start_time: string;
  end_time: string;
  booking_type: 'regular' | 'tournament';
  status: string;
}
