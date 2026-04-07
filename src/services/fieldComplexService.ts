import api from '@/lib/axios';

// Interface cho sân con (sub-field) 
export interface SubField {
  id: number;
  field_cluster_id: number;
  name?: string; // Backend không trả về name
  field_type: '5v5' | '7v7' | '11v11'; // Loại sân
  status: 'available' | 'maintenance'; // Trạng thái
  created_at?: string;
  updated_at?: string;
  field_cluster?: any;
}

// Interface cho giá theo giờ
export interface FieldHourlyPrice {
  id: number;
  field_cluster_id: number; // Giá theo cụm sân
  day_type: 'weekday' | 'weekend'; // Loại ngày
  field_type: '5v5' | '7v7' | '11v11'; // Loại sân
  price_hour: number; // Giá mỗi giờ (VNĐ)
  created_at?: string;
  updated_at?: string;
  field_cluster?: any;
}

// Interface cho cụm sân (field cluster)
export interface FieldComplex {
  id: number;
  owner_id: number;
  name: string;
  address: string;
  district?: string;
  city?: string;
  phone?: string;
  email?: string;
  description?: string;
  image?: string;
  open_time: string; // Format: "HH:mm:ss" - Từ backend
  close_time: string; // Format: "HH:mm:ss" - Từ backend
  opening_time?: string; // Alias cho compatibility
  closing_time?: string; // Alias cho compatibility
  status?: string; // 'active', 'inactive'
  created_at?: string;
  updated_at?: string;
  // Relations
  fields?: SubField[];
  hourly_prices?: any[];
  owner?: any;
}

// Interface cho booking request
export interface BookingRequest {
  field_id: number;
  user_id?: number;
  booking_date: string; // Format: "YYYY-MM-DD"
  start_time: string; // Format: "HH:mm"
  end_time: string; // Format: "HH:mm"
  total_price: number;
  customer_name?: string;
  customer_phone?: string;
  customer_email?: string;
  note?: string;
}

export const fieldComplexService = {
  // Lấy tất cả cụm sân (Public API - không cần quyền đặc biệt)
  getAll: async () => {
    const response = await api.get('/public/field-clusters');
    // Backend trả về { success, message, data }
    return response.data?.data || response.data;
  },

  // Lấy 1 cụm sân theo ID (Public API - không cần quyền đặc biệt)
  getById: async (id: number) => {
    const response = await api.get(`/public/field-clusters/${id}`);
    // Backend trả về { success, message, data }
    const fieldComplex = response.data?.data || response.data;
    // Thêm alias cho compatibility với code cũ
    if (fieldComplex && !fieldComplex.opening_time) {
      fieldComplex.opening_time = fieldComplex.open_time;
      fieldComplex.closing_time = fieldComplex.close_time;
    }
    return fieldComplex;
  },

  // Lấy các sân con của 1 cụm sân (Public API - không cần quyền đặc biệt)
  getFieldsByClusterId: async (clusterId: number) => {
    const response = await api.get('/public/fields', {
      params: { field_cluster_id: clusterId }
    });
    return response.data?.data || response.data;
  },

  // Lấy các sân con AVAILABLE của 1 cụm sân (dùng cho booking - chỉ sân hoạt động)
  getAvailableFieldsByClusterId: async (clusterId: number) => {
    const response = await api.get('/public/fields', {
      params: { 
        field_cluster_id: clusterId,
        status: 'available' // Chỉ lấy sân đang hoạt động, không lấy sân bảo trì
      }
    });
    return response.data?.data || response.data;
  },

  // Lấy giá theo giờ của 1 cụm sân (Public API - không cần quyền đặc biệt)
  getFieldClusterPrices: async (fieldClusterId: number) => {
    const response = await api.get('/public/field-hourly-prices', {
      params: { field_cluster_id: fieldClusterId }
    });
    return response.data?.data || response.data;
  },

  // Lấy giá cho loại sân cụ thể
  getPriceForFieldType: (prices: FieldHourlyPrice[], fieldType: string, isWeekend: boolean): number => {
    const dayType = isWeekend ? 'weekend' : 'weekday';
    const priceInfo = prices.find(
      p => p.field_type === fieldType && p.day_type === dayType
    );
    return priceInfo ? Number(priceInfo.price_hour) : 0;
  },

  // Tạo booking (Cần đăng nhập)
  createBooking: async (data: BookingRequest) => {
    const response = await api.post('/bookings', data);
    return response.data?.data || response.data;
  },

  // ============ OWNER MANAGEMENT APIs ============
  
  // Lấy tất cả cụm sân của owner (Authenticated - Owner/Admin)
  getOwnerFieldClusters: async () => {
    const response = await api.get('/field-clusters');
    return response.data?.data || response.data;
  },

  // Tạo cụm sân mới (Owner/Admin)
  createFieldCluster: async (data: Partial<FieldComplex>) => {
    const response = await api.post('/field-clusters', data);
    return response.data?.data || response.data;
  },

  // Cập nhật cụm sân (Owner/Admin)
  updateFieldCluster: async (id: number, data: Partial<FieldComplex>) => {
    const response = await api.put(`/field-clusters/${id}`, data);
    return response.data?.data || response.data;
  },

  // Xóa cụm sân (Owner/Admin)
  deleteFieldCluster: async (id: number) => {
    const response = await api.delete(`/field-clusters/${id}`);
    return response.data?.data || response.data;
  },

  // Tạo sân con (Owner/Admin)
  createField: async (data: Partial<SubField>) => {
    const response = await api.post('/fields', data);
    return response.data?.data || response.data;
  },

  // Cập nhật sân con (Owner/Admin)
  updateField: async (id: number, data: Partial<SubField>) => {
    const response = await api.put(`/fields/${id}`, data);
    return response.data?.data || response.data;
  },

  // Xóa sân con (Owner/Admin)
  deleteField: async (id: number) => {
    const response = await api.delete(`/fields/${id}`);
    return response.data?.data || response.data;
  },

  // Tạo giá theo giờ (Owner/Admin)
  createHourlyPrice: async (data: Partial<FieldHourlyPrice>) => {
    const response = await api.post('/field-hourly-prices', data);
    return response.data?.data || response.data;
  },

  // Cập nhật giá theo giờ (Owner/Admin)
  updateHourlyPrice: async (id: number, data: Partial<FieldHourlyPrice>) => {
    const response = await api.put(`/field-hourly-prices/${id}`, data);
    return response.data?.data || response.data;
  },

  // Xóa giá theo giờ (Owner/Admin)
  deleteHourlyPrice: async (id: number) => {
    const response = await api.delete(`/field-hourly-prices/${id}`);
    return response.data?.data || response.data;
  },

  // ============ AVAILABILITY CHECK API ============
  
  /**
   * Check sân availability theo ngày và loại sân
   * @param clusterId - ID cụm sân
   * @param date - Ngày cần check (YYYY-MM-DD)
   * @param fieldType - Loại sân (5v5, 7v7, 11v11)
   * @returns Danh sách sân với availability info cho từng buổi
   */
  checkAvailability: async (clusterId: number, date: string, fieldType: string) => {
    const response = await api.get(`/public/field-clusters/${clusterId}/availability`, {
      params: { date, field_type: fieldType }
    });
    return response.data?.data || response.data;
  },
};
