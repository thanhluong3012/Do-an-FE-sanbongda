import api from '@/lib/axios';

// Interface cho Match
export interface Match {
  id: number;
  tournament_id: number;
  match_number: number;
  round_id?: number;
  group_id?: number;
  home_team_id?: number | null;
  away_team_id?: number | null;
  match_date: string;
  match_time: string;
  field_id?: number;
  home_score?: number | null;
  away_score?: number | null;
  winner_id?: number | null;
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  home_from_position?: string; // For knockout brackets (e.g., "Thắng trận 1")
  away_from_position?: string; // For knockout brackets (e.g., "Thắng trận 2")
  home_team?: {
    id: number;
    name: string;
    logo?: string;
  } | null;
  away_team?: {
    id: number;
    name: string;
    logo?: string;
  } | null;
  field?: {
    id: number;
    name: string;
    field_type: string;
    field_cluster?: {
      id: number;
      name: string;
      address: string;
      phone?: string;
      open_time: string;
      close_time: string;
      description?: string;
      image?: string;
    };
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
  home_team_id?: number | null;
  away_team_id?: number | null;
  match_date: string; // Format: "YYYY-MM-DD"
  match_time: string; // Format: "HH:MM"
  field_id?: number;
}

// Interface cho Score Update
export interface ScoreUpdateRequest {
  home_score: number;
  away_score: number;
  home_penalty_score?: number;
  away_penalty_score?: number;
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
      const response = await api.get<ApiResponse<Match[]>>('/tournament-matches', { params });
      return response.data.data || [];
    } catch (error) {
      console.error('Error fetching matches:', error);
      throw error;
    }
  },

  // Chi tiết trận đấu
  getById: async (id: number): Promise<Match> => {
    try {
      const response = await api.get<ApiResponse<Match>>(`/tournament-matches/${id}`);
      return response.data.data;
    } catch (error) {
      console.error(`Error fetching match ${id}:`, error);
      throw error;
    }
  },

  // Tạo trận đấu (Admin/BTC)
  create: async (data: MatchRequest): Promise<Match> => {
    try {
      const response = await api.post<ApiResponse<Match>>('/tournament-matches', data);
      return response.data.data;
    } catch (error) {
      console.error('Error creating match:', error);
      throw error;
    }
  },

  // Cập nhật tỷ số (Admin/BTC) - QUAN TRỌNG
  updateScore: async (id: number, data: ScoreUpdateRequest): Promise<Match> => {
    try {
      const response = await api.put<ApiResponse<Match>>(`/tournament-matches/${id}/update-score`, data);
      return response.data.data;
    } catch (error) {
      console.error(`Error updating match score ${id}:`, error);
      throw error;
    }
  },

  // Cập nhật trận đấu
  update: async (id: number, data: Partial<MatchRequest>): Promise<Match> => {
    try {
      const response = await api.put<ApiResponse<Match>>(`/tournament-matches/${id}`, data);
      return response.data.data;
    } catch (error) {
      console.error(`Error updating match ${id}:`, error);
      throw error;
    }
  },

  // Xóa trận đấu
  delete: async (id: number): Promise<void> => {
    try {
      await api.delete(`/tournament-matches/${id}`);
    } catch (error) {
      console.error(`Error deleting match ${id}:`, error);
      throw error;
    }
  },

  // Gán đội vào trận đấu (drag-drop) - PATCH /api/tournament-matches/{id}/assign-team
  assignTeam: async (matchId: number, data: { home_team_id?: number; away_team_id?: number }): Promise<Match> => {
    try {
      const response = await api.patch<ApiResponse<Match>>(`/tournament-matches/${matchId}/assign-team`, data);
      return response.data.data;
    } catch (error) {
      console.error(`Error assigning team to match ${matchId}:`, error);
      throw error;
    }
  },

  // Đổi sân thi đấu - PATCH /api/tournament-matches/{id}/field
  updateField: async (matchId: number, fieldId: number): Promise<Match> => {
    try {
      const response = await api.patch<ApiResponse<Match>>(`/tournament-matches/${matchId}/field`, { field_id: fieldId });
      return response.data.data;
    } catch (error) {
      console.error(`Error updating match field ${matchId}:`, error);
      throw error;
    }
  },

  // Đổi lịch thi đấu (ngày giờ) - PATCH /api/tournament-matches/{id}/schedule
  updateSchedule: async (matchId: number, data: { match_date: string; match_time: string }): Promise<Match> => {
    try {
      const response = await api.patch<ApiResponse<Match>>(`/tournament-matches/${matchId}/schedule`, data);
      return response.data.data;
    } catch (error) {
      console.error(`Error updating match schedule ${matchId}:`, error);
      throw error;
    }
  },
};
