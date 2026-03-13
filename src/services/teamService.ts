import api from '@/lib/axios';

// Interface cho Team
export interface Team {
  id: number;
  name: string;
  logo?: string;
  description?: string;
  captain_id: number;
  captain?: {
    id: number;
    name: string;
    email: string;
  };
  created_at?: string;
  updated_at?: string;
}

// Interface cho Team Request
export interface TeamRequest {
  name: string;
  logo?: string;
  description?: string;
  captain_id: number;
}

// Interface cho API Response
interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export const teamService = {
  // Lấy danh sách đội bóng
  getAll: async (): Promise<Team[]> => {
    try {
      const response = await api.get<ApiResponse<Team[]>>('/teams');
      return response.data.data || [];
    } catch (error) {
      console.error('Error fetching teams:', error);
      throw error;
    }
  },

  // Chi tiết đội bóng
  getById: async (id: number): Promise<Team> => {
    try {
      const response = await api.get<ApiResponse<Team>>(`/teams/${id}`);
      return response.data.data;
    } catch (error) {
      console.error(`Error fetching team ${id}:`, error);
      throw error;
    }
  },

  // Tạo đội bóng mới
  create: async (data: TeamRequest): Promise<Team> => {
    try {
      const response = await api.post<ApiResponse<Team>>('/teams', data);
      return response.data.data;
    } catch (error) {
      console.error('Error creating team:', error);
      throw error;
    }
  },

  // Cập nhật đội bóng
  update: async (id: number, data: Partial<TeamRequest>): Promise<Team> => {
    try {
      const response = await api.put<ApiResponse<Team>>(`/teams/${id}`, data);
      return response.data.data;
    } catch (error) {
      console.error(`Error updating team ${id}:`, error);
      throw error;
    }
  },

  // Xóa đội bóng
  delete: async (id: number): Promise<void> => {
    try {
      await api.delete(`/teams/${id}`);
    } catch (error) {
      console.error(`Error deleting team ${id}:`, error);
      throw error;
    }
  },
};
