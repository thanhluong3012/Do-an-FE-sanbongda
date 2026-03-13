import api from '@/lib/axios';

// Interface cho Match
export interface Match {
  id: number;
  tournament_id: number;
  round_id?: number;
  group_id?: number;
  home_team_id: number;
  away_team_id: number;
  scheduled_time: string;
  field_id: number;
  home_score?: number;
  away_score?: number;
  winner_id?: number;
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  home_team?: {
    id: number;
    name: string;
    logo?: string;
  };
  away_team?: {
    id: number;
    name: string;
    logo?: string;
  };
  field?: {
    id: number;
    name: string;
    field_type: string;
  };
  round?: {
    id: number;
    name: string;
    round_type: string;
  };
  group?: {
    id: number;
    name: string;
  };
  created_at?: string;
  updated_at?: string;
}

// Interface cho Match Request
export interface MatchRequest {
  tournament_id: number;
  round_id?: number;
  group_id?: number;
  home_team_id: number;
  away_team_id: number;
  scheduled_time: string;
  field_id: number;
}

// Interface cho Score Update
export interface ScoreUpdateRequest {
  home_score: number;
  away_score: number;
  status: 'completed' | 'in_progress';
}

// Interface cho API Response
interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

// Interface cho query params
interface MatchQueryParams {
  tournament_id?: number;
  round_id?: number;
  group_id?: number;
  status?: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
}

export const matchService = {
  // Lấy danh sách trận đấu
  getAll: async (params?: MatchQueryParams): Promise<Match[]> => {
    try {
      const response = await api.get<ApiResponse<Match[]>>('/matches', { params });
      return response.data.data || [];
    } catch (error) {
      console.error('Error fetching matches:', error);
      throw error;
    }
  },

  // Chi tiết trận đấu
  getById: async (id: number): Promise<Match> => {
    try {
      const response = await api.get<ApiResponse<Match>>(`/matches/${id}`);
      return response.data.data;
    } catch (error) {
      console.error(`Error fetching match ${id}:`, error);
      throw error;
    }
  },

  // Tạo trận đấu (Admin/BTC)
  create: async (data: MatchRequest): Promise<Match> => {
    try {
      const response = await api.post<ApiResponse<Match>>('/matches', data);
      return response.data.data;
    } catch (error) {
      console.error('Error creating match:', error);
      throw error;
    }
  },

  // Cập nhật tỷ số (Admin/BTC) - QUAN TRỌNG
  updateScore: async (id: number, data: ScoreUpdateRequest): Promise<Match> => {
    try {
      const response = await api.put<ApiResponse<Match>>(`/matches/${id}/score`, data);
      return response.data.data;
    } catch (error) {
      console.error(`Error updating match score ${id}:`, error);
      throw error;
    }
  },

  // Cập nhật trận đấu
  update: async (id: number, data: Partial<MatchRequest>): Promise<Match> => {
    try {
      const response = await api.put<ApiResponse<Match>>(`/matches/${id}`, data);
      return response.data.data;
    } catch (error) {
      console.error(`Error updating match ${id}:`, error);
      throw error;
    }
  },

  // Xóa trận đấu
  delete: async (id: number): Promise<void> => {
    try {
      await api.delete(`/matches/${id}`);
    } catch (error) {
      console.error(`Error deleting match ${id}:`, error);
      throw error;
    }
  },
};
