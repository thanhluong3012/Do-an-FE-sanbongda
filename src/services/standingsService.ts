import api from '@/lib/axios';

// Interface cho Group Standing
export interface GroupStanding {
  id: number;
  tournament_id: number;
  group_id?: number;
  team_id: number;
  matches_played: number;
  wins: number;
  draws: number;
  losses: number;
  goals_for: number;
  goals_against: number;
  goal_difference: number;
  fair_play?: number; // lower is better
  points: number;
  rank: number;
  team?: {
    id: number;
    name: string;
    logo?: string;
  };
  group?: {
    id: number;
    name: string;
  };
  created_at?: string;
  updated_at?: string;
}

// Interface cho API Response
interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

// Interface cho query params
interface StandingsQueryParams {
  tournament_id?: number;
  group_id?: number;
}

export const standingsService = {
  // Lấy bảng xếp hạng theo giải đấu
  getByTournament: async (tournamentId: number): Promise<GroupStanding[]> => {
    try {
      const response = await api.get<ApiResponse<GroupStanding[]>>('/standings', {
        params: { tournament_id: tournamentId }
      });
      return response.data.data || [];
    } catch (error) {
      console.error(`Error fetching standings for tournament ${tournamentId}:`, error);
      throw error;
    }
  },

  // Lấy bảng xếp hạng theo bảng đấu
  getByGroup: async (tournamentId: number, groupId: number): Promise<GroupStanding[]> => {
    try {
      const response = await api.get<ApiResponse<GroupStanding[]>>('/standings', {
        params: { 
          tournament_id: tournamentId,
          group_id: groupId
        }
      });
      return response.data.data || [];
    } catch (error) {
      console.error(`Error fetching standings for group ${groupId}:`, error);
      throw error;
    }
  },

  // Lấy tất cả bảng xếp hạng (có thể filter)
  getAll: async (params?: StandingsQueryParams): Promise<GroupStanding[]> => {
    try {
      const response = await api.get<ApiResponse<GroupStanding[]>>('/standings', { params });
      return response.data.data || [];
    } catch (error) {
      console.error('Error fetching standings:', error);
      throw error;
    }
  },
};
