import api from '@/lib/axios';

// Interface cho Tournament
export interface Tournament {
  id: number;
  name: string;
  description?: string;
  format: 'round_robin' | 'knockout' | 'group_knockout';
  max_teams: number;
  min_teams: number;
  registration_start: string;
  registration_end: string;
  start_date: string;
  end_date: string;
  status: 'draft' | 'open' | 'in_progress' | 'completed' | 'cancelled';
  field_cluster_id: number;
  organizer_id?: number;
  organizer?: {
    id: number;
    name: string;
    email: string;
  };
  field_cluster?: {
    id: number;
    name: string;
    address?: string;
  };
  registered_teams_count?: number;
  schedules?: any[];
  registrations?: any[];
  groups?: any[];
  rounds?: any[];
  matches?: any[];
  created_at?: string;
  updated_at?: string;
}

// Interface cho Tournament Request
export interface TournamentRequest {
  name: string;
  description?: string;
  format: 'round_robin' | 'knockout' | 'group_knockout';
  max_teams: number;
  min_teams: number;
  registration_start: string;
  registration_end: string;
  start_date: string;
  end_date: string;
  field_cluster_id: number;
}

// Interface cho API Response
interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

// Interface cho query params
interface TournamentQueryParams {
  status?: 'draft' | 'open' | 'in_progress' | 'completed' | 'cancelled';
  format?: 'round_robin' | 'knockout' | 'group_knockout';
}

export const tournamentService = {
  // Lấy danh sách giải đấu
  getAll: async (params?: TournamentQueryParams): Promise<Tournament[]> => {
    try {
      const response = await api.get('/tournaments', { params });
      console.log('🔍 Tournament API Response:', response.data);
      
      // Backend có thể trả về nhiều format khác nhau
      
      // Format 1: Laravel pagination { success: true, data: { data: [...], current_page: 1, ... } }
      if (response.data?.data?.data && Array.isArray(response.data.data.data)) {
        console.log('✅ Found paginated data:', response.data.data.data.length, 'items');
        return response.data.data.data;
      }
      
      // Format 2: { success: true, data: [...] }
      if (Array.isArray(response.data?.data)) {
        console.log('✅ Found array in data:', response.data.data.length, 'items');
        return response.data.data;
      }
      
      // Format 3: Trả về trực tiếp mảng [...]
      if (Array.isArray(response.data)) {
        console.log('✅ Direct array:', response.data.length, 'items');
        return response.data;
      }
      
      // Format 4: { tournaments: [...] }
      if (response.data?.tournaments && Array.isArray(response.data.tournaments)) {
        console.log('✅ Found tournaments array:', response.data.tournaments.length, 'items');
        return response.data.tournaments;
      }
      
      console.warn('⚠️ Unknown response format:', response.data);
      return [];
    } catch (error) {
      console.error('❌ Error fetching tournaments:', error);
      throw error;
    }
  },

  // Chi tiết giải đấu (có quan hệ đầy đủ)
  getById: async (id: number): Promise<Tournament> => {
    try {
      const response = await api.get(`/tournaments/${id}`);
      console.log('🔍 Tournament Detail API Response:', response.data);
      
      // Xử lý nhiều format response
      if (response.data?.data) {
        return response.data.data;
      }
      if (response.data?.tournament) {
        return response.data.tournament;
      }
      // Nếu không có wrapper, trả về trực tiếp
      return response.data;
    } catch (error) {
      console.error(`❌ Error fetching tournament ${id}:`, error);
      throw error;
    }
  },

  // Tạo giải đấu mới (Admin/BTC)
  create: async (data: TournamentRequest): Promise<Tournament> => {
    try {
      const response = await api.post<ApiResponse<Tournament>>('/tournaments', data);
      return response.data.data;
    } catch (error) {
      console.error('Error creating tournament:', error);
      throw error;
    }
  },

  // Publish giải đấu (Mở đăng ký)
  publish: async (id: number): Promise<Tournament> => {
    try {
      const response = await api.put<ApiResponse<Tournament>>(`/tournaments/${id}/publish`);
      return response.data.data;
    } catch (error) {
      console.error(`Error publishing tournament ${id}:`, error);
      throw error;
    }
  },

  // Cập nhật giải đấu
  update: async (id: number, data: Partial<TournamentRequest>): Promise<Tournament> => {
    try {
      const response = await api.put<ApiResponse<Tournament>>(`/tournaments/${id}`, data);
      return response.data.data;
    } catch (error) {
      console.error(`Error updating tournament ${id}:`, error);
      throw error;
    }
  },

  // Xóa giải đấu
  delete: async (id: number): Promise<void> => {
    try {
      await api.delete(`/tournaments/${id}`);
    } catch (error) {
      console.error(`Error deleting tournament ${id}:`, error);
      throw error;
    }
  },
};
