import api from '@/lib/axios';

// Interface cho giá theo buổi dành cho giải đấu
export interface TournamentSessionPrice {
  id: number;
  field_cluster_id: number;
  field_type: '5v5' | '7v7' | '11v11';
  day_type: 'weekday' | 'weekend';
  session_type: 'morning' | 'afternoon' | 'evening' | 'full_day';
  price_per_session: number; // Backend expects 'price_per_session' not 'price'
  created_at?: string;
  updated_at?: string;
}

interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export const tournamentSessionPriceService = {
  // Lấy giá theo cụm sân
  getByClusterId: async (clusterId: number): Promise<TournamentSessionPrice[]> => {
    try {
      const response = await api.get<ApiResponse<TournamentSessionPrice[]>>('/tournament-session-prices', {
        params: { field_cluster_id: clusterId }
      });
      const data = response.data.data || response.data;
      return Array.isArray(data) ? data : [];
    } catch (error) {
      console.error('Error fetching tournament session prices:', error);
      throw error;
    }
  },

  // Tạo mới
  create: async (data: Omit<TournamentSessionPrice, 'id' | 'created_at' | 'updated_at'>): Promise<TournamentSessionPrice> => {
    try {
      console.log('Sending create request with data:', data);
      const response = await api.post<ApiResponse<TournamentSessionPrice>>('/tournament-session-prices', data);
      console.log('Create response:', response);
      console.log('Create response data:', response.data);
      return response.data.data;
    } catch (error: any) {
      console.error('Error creating tournament session price:', error);
      console.error('Error response status:', error?.response?.status);
      console.error('Error response data:', error?.response?.data);
      console.error('Error config:', error?.config);
      throw error;
    }
  },

  // Cập nhật
  update: async (id: number, data: Partial<TournamentSessionPrice>): Promise<TournamentSessionPrice> => {
    try {
      const response = await api.put<ApiResponse<TournamentSessionPrice>>(`/tournament-session-prices/${id}`, data);
      return response.data.data;
    } catch (error) {
      console.error('Error updating tournament session price:', error);
      throw error;
    }
  },

  // Xóa
  delete: async (id: number): Promise<void> => {
    try {
      await api.delete(`/tournament-session-prices/${id}`);
    } catch (error) {
      console.error('Error deleting tournament session price:', error);
      throw error;
    }
  },
};
