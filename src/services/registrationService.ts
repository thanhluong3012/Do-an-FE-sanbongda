import api from '@/lib/axios';

// Interface cho Tournament Registration
export interface TournamentRegistration {
  id: number;
  tournament_id: number;
  team_id: number;
  status: 'pending' | 'approved' | 'rejected';
  registered_at: string;
  team?: {
    id: number;
    name: string;
    logo?: string;
    captain?: {
      id: number;
      name: string;
      email: string;
    };
  };
  tournament?: {
    id: number;
    name: string;
    format: string;
    start_date: string;
  };
  rejection_reason?: string;
  created_at?: string;
  updated_at?: string;
}

// Interface cho Registration Request
export interface RegistrationRequest {
  tournament_id: number;
  team_id: number;
}

// Interface cho Rejection Request
export interface RejectionRequest {
  rejected_reason: string;
}

// Interface cho API Response
interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

// Interface cho query params
interface RegistrationQueryParams {
  tournament_id?: number;
  team_id?: number;
  status?: 'pending' | 'approved' | 'rejected';
}

export const registrationService = {
  // Lấy danh sách đăng ký
  getAll: async (params?: RegistrationQueryParams): Promise<TournamentRegistration[]> => {
    try {
      const response = await api.get('/tournament-registrations', { params });
      const raw = response.data;
      // Format 1: { success, data: { data: [...] } } (paginated)
      if (raw?.data?.data && Array.isArray(raw.data.data)) return raw.data.data;
      // Format 2: { success, data: [...] }
      if (Array.isArray(raw?.data)) return raw.data;
      // Format 3: direct array
      if (Array.isArray(raw)) return raw;
      return [];
    } catch (error) {
      console.error('Error fetching registrations:', error);
      throw error;
    }
  },

  // Chi tiết đăng ký
  getById: async (id: number): Promise<TournamentRegistration> => {
    try {
      const response = await api.get<ApiResponse<TournamentRegistration>>(`/tournament-registrations/${id}`);
      return response.data.data;
    } catch (error) {
      console.error(`Error fetching registration ${id}:`, error);
      throw error;
    }
  },

  // Đăng ký tham gia giải (User)
  create: async (data: RegistrationRequest): Promise<TournamentRegistration> => {
    try {
      const response = await api.post<ApiResponse<TournamentRegistration>>('/tournament-registrations', data);
      return response.data.data;
    } catch (error) {
      console.error('Error creating registration:', error);
      throw error;
    }
  },

  // Duyệt đăng ký (Admin/BTC)
  approve: async (id: number): Promise<TournamentRegistration> => {
    try {
      const response = await api.put<ApiResponse<TournamentRegistration>>(`/tournament-registrations/${id}/approve`);
      return response.data.data;
    } catch (error) {
      console.error(`Error approving registration ${id}:`, error);
      throw error;
    }
  },

  // Từ chối đăng ký (Admin/BTC)
  reject: async (id: number, data: RejectionRequest): Promise<TournamentRegistration> => {
    try {
      const response = await api.put<ApiResponse<TournamentRegistration>>(`/tournament-registrations/${id}/reject`, data);
      return response.data.data;
    } catch (error) {
      console.error(`Error rejecting registration ${id}:`, error);
      throw error;
    }
  },

  // Hủy đăng ký (User)
  cancel: async (id: number): Promise<void> => {
    try {
      await api.delete(`/tournament-registrations/${id}`);
    } catch (error) {
      console.error(`Error canceling registration ${id}:`, error);
      throw error;
    }
  },
};
