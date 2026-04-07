import api from '@/lib/axios';

// Interface cho Team
export interface Team {
  id: number;
  name: string;
  short_name?: string;
  logo?: string;
  description?: string;
  contact_phone?: string;
  contact_email?: string;
  captain_id: number;
  captain?: {
    id: number;
    name: string;
    email: string;
  };
  members?: TeamMember[];
  created_at?: string;
  updated_at?: string;
}

// Interface cho thành viên đội
export interface TeamMember {
  id: number;
  team_id: number;
  player_name: string;
  code_id?: string;
  jersey_number?: number;
  position?: string;
  user?: {
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
  short_name?: string;
  logo?: string;
  contact_phone?: string;
  contact_email?: string;
}

// Interface cho TeamMember Request
export interface TeamMemberRequest {
  player_name: string;
  code_id?: string;
  jersey_number?: number;
  position?: string;
}

// Interface cho API Response
interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

const extractArray = <T>(raw: any): T[] => {
  if (raw?.data?.data && Array.isArray(raw.data.data)) return raw.data.data;
  if (Array.isArray(raw?.data)) return raw.data;
  if (Array.isArray(raw)) return raw;
  return [];
};

export const teamService = {
  // Lấy danh sách đội bóng (của user hiện tại)
  getAll: async (): Promise<Team[]> => {
    try {
      const response = await api.get('/teams');
      return extractArray<Team>(response.data);
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

  // ── Thành viên đội ──

  // Lấy danh sách thành viên
  getMembers: async (teamId: number): Promise<TeamMember[]> => {
    try {
      const response = await api.get(`/teams/${teamId}/members`);
      const raw = response.data;
      // Format: { success, data: { team: {...}, members: [...] } }
      if (Array.isArray(raw?.data?.members)) return raw.data.members;
      // Format: { success, data: [...] }
      if (Array.isArray(raw?.data)) return raw.data;
      // Format: direct array
      if (Array.isArray(raw)) return raw;
      return [];
    } catch (error) {
      console.error(`Error fetching members of team ${teamId}:`, error);
      throw error;
    }
  },

  // Thêm thành viên
  addMember: async (teamId: number, data: TeamMemberRequest): Promise<TeamMember> => {
    try {
      const response = await api.post<ApiResponse<TeamMember>>(`/teams/${teamId}/members`, data);
      return response.data.data;
    } catch (error) {
      console.error(`Error adding member to team ${teamId}:`, error);
      throw error;
    }
  },

  // Cập nhật thành viên
  updateMember: async (teamId: number, memberId: number, data: Partial<TeamMemberRequest>): Promise<TeamMember> => {
    try {
      const response = await api.put<ApiResponse<TeamMember>>(`/teams/${teamId}/members/${memberId}`, data);
      return response.data.data;
    } catch (error) {
      console.error(`Error updating member ${memberId}:`, error);
      throw error;
    }
  },

  // Xóa thành viên
  deleteMember: async (teamId: number, memberId: number): Promise<void> => {
    try {
      await api.delete(`/teams/${teamId}/members/${memberId}`);
    } catch (error) {
      console.error(`Error deleting member ${memberId}:`, error);
      throw error;
    }
  },
};
