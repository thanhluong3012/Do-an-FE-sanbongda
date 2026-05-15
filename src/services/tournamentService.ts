import api from '@/lib/axios';
import { Match } from './matchService';

// Interface cho Round
export interface TournamentRound {
  round_name: string;
  round_order: number;
  matches: Match[];
}

// Interface cho Group
export interface TournamentGroup {
  id: number;
  group_name: string;
  standings?: Array<{
    ranking: number;
    team: { id: number; name: string; logo?: string };
    points?: number;
    wins?: number;
    draws?: number;
    losses?: number;
  }>;
  matches: Match[];
}

// Interface cho Bracket Structure
export interface TournamentBracket {
  format: 'round_robin' | 'knockout' | 'group_knockout';
  tournament: Tournament;
  teams: Array<{
    id: number;
    name: string;
    logo?: string;
  }>;
  rounds?: TournamentRound[];
  groups?: TournamentGroup[];
}

// Interface cho Tournament
export interface Tournament {
  bookings: any;
  tournament: any;
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
  status: 'draft' | 'open' | 'in_progress' | 'completed' | 'cancelled' | 'deleted';
  schedule_published?: boolean; // Trạng thái công khai lịch thi đấu
  rejected_reason?: string; // Lý do từ chối thanh toán
  deleted_bookings?: number; // Số booking bị xóa khi giải bị hủy
  field_cluster_id: number;
  organizer_id?: number;
  
  // Participation type (for my_tournaments query)
  participation_type?: 'organizer' | 'participant' | 'both'; // Loại tham gia: tổ chức, tham gia, hoặc cả hai
  
  // Payment fields
  payment_method?: 'cash' | 'transfer';
  payment_status?: 'pending' | 'paid' | 'rejected' | 'failed';
  payment_proof?: string;
  payment_proof_url?: string; // alias – some responses use this
  total_price?: number;
  
  // Rules file fields
  tournament_rules_file?: string;
  rules_file_info?: {
    file_url?: string;
    file_name?: string;
    download_url?: string;
    has_file: boolean;
  };
  
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
  approved_teams_count?: number;
  is_full?: boolean;
  available_slots?: number;
  schedules?: any[];
  registrations?: Array<{
    id: number;
    team_id: number;
    registration_status: string; // Backend field name
    team?: {
      id: number;
      name: string;
      logo?: string;
    };
  }>;
  teams?: Array<{
    id: number;
    name: string;
    logo?: string;
  }>;
  groups?: any[];
  rounds?: any[];
  matches?: any[];
  created_at?: string;
  updated_at?: string;
}

// Interface cho Field Booking
export interface FieldBooking {
  id: number;
  tournament_id: number;
  field_id: number;
  booking_date?: string; // Legacy field
  day_book?: string; // Field name from API
  start_time: string;
  end_time: string;
  total_price?: number;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  payment_method?: 'transfer' | 'cash';
  payment_status?: 'pending' | 'paid' | 'refunded';
  payment_proof_url?: string;
  customer_name?: string;
  customer_phone?: string;
  customer_email?: string;
  note?: string;
  field?: {
    id: number;
    name: string;
    field_type: string;
    field_cluster?: {
      id: number;
      name: string;
      address?: string;
      phone?: string;
      email?: string;
    };
  };
  created_at?: string;
  updated_at?: string;
}

// Interface cho Book Fields Request
export interface BookFieldsRequest {
  bookings: Array<{
    field_id: number;
    date: string; // YYYY-MM-DD
    session_type: 'morning' | 'afternoon' | 'evening' | 'full_day';
  }>;
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
  field_type?: string; // Loại sân (5v5, 7v7, 11v11) - optional để backward compatible
  payment_method?: 'cash' | 'transfer'; // Phương thức thanh toán
  payment_proof?: string; // URL bill chuyển khoản từ Supabase (field name BE dùng)
  bookings?: Array<{ // Danh sách sân cần book
    field_id: number;
    date: string; // YYYY-MM-DD
    session_type: 'morning' | 'afternoon' | 'evening' | 'full_day'; // Buổi thi đấu
  }>;
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
      const response = await api.get('/public/tournaments', { params });
      // Format 1: Laravel pagination { success: true, data: { data: [...] } }
      if (response.data?.data?.data && Array.isArray(response.data.data.data)) {
        return response.data.data.data;
      }
      // Format 2: { success: true, data: [...] }
      if (Array.isArray(response.data?.data)) {
        return response.data.data;
      }
      // Format 3: direct array
      if (Array.isArray(response.data)) {
        return response.data;
      }
      // Format 4: { tournaments: [...] }
      if (response.data?.tournaments && Array.isArray(response.data.tournaments)) {
        return response.data.tournaments;
      }
      return [];
    } catch (error) {
      console.error('Error fetching tournaments:', error);
      throw error;
    }
  },

  // Chi tiết giải đấu (có quan hệ đầy đủ)
  getById: async (id: number): Promise<Tournament> => {
    const parseResponse = (raw: any): Tournament | null => {
      if (raw?.data && typeof raw.data === 'object' && !Array.isArray(raw.data) && raw.data?.id) return raw.data;
      if (raw?.tournament?.id) return raw.tournament;
      if (raw?.id) return raw;
      return null;
    };

    try {
      // Có token → dùng authenticated endpoint (GET /api/tournaments/{id}) để xem được cả draft
      const hasToken = !!sessionStorage.getItem('access_token');
      const endpoint = hasToken ? `/tournaments/${id}` : `/public/tournaments/${id}`;

      console.log(`🌐 [API] Calling: ${endpoint}`);
      const response = await api.get(endpoint);
      console.log('📦 [API] Raw response:', response.data);
      
      const result = parseResponse(response.data);
      if (result) {
        console.log('✅ [API] Parsed tournament:', {
          id: result.id,
          payment_status: result.payment_status,
          payment_method: result.payment_method,
        });
        return result;
      }

      console.error('❌ Could not parse tournament data:', response.data);
      throw new Error('Không tìm thấy dữ liệu giải đấu hợp lệ từ API');
    } catch (error) {
      console.error(`Error fetching tournament ${id}:`, error);
      throw error;
    }
  },

  // Tạo giải đấu mới (Admin/BTC)
  create: async (data: TournamentRequest): Promise<Tournament> => {
    try {
      const response = await api.post('/tournaments', data);
      const raw = response.data;

      debugger;

      // { success: true, data: { id, name, ... } }
      if (raw?.data && typeof raw.data === 'object' && !Array.isArray(raw.data) && raw.data?.id) return raw.data;
      // { tournament: { id, ... } }
      if (raw?.tournament?.id) return raw.tournament;
      // { data: { tournament: { ... } } }
      if (raw?.data?.tournament?.id) return raw.data;
      // Direct object { id, name, ... }
      if (raw?.id) return raw;

      console.error('❌ Could not parse create tournament response:', raw);
      throw new Error('Không thể đọc dữ liệu giải đấu từ response');
    } catch (error) {
      console.error('Error creating tournament:', error);
      throw error;
    }
  },

  // Kết thúc giải đấu
  complete: async (id: number): Promise<Tournament> => {
    try {
      const response = await api.post<ApiResponse<Tournament>>(`/tournaments/${id}/complete`);
      return response.data.data;
    } catch (error) {
      console.error(`Error completing tournament ${id}:`, error);
      throw error;
    }
  },

  // Publish giải đấu (Mở đăng ký)
  publish: async (id: number): Promise<Tournament> => {
    try {
      const response = await api.post<ApiResponse<Tournament>>(`/tournaments/${id}/publish`);
      return response.data.data;
    } catch (error) {
      console.error(`Error publishing tournament ${id}:`, error);
      throw error;
    }
  },

  // Publish lịch thi đấu (Công khai cho user xem)
  publishSchedule: async (id: number): Promise<Tournament> => {
    try {
      const response = await api.post<ApiResponse<Tournament>>(`/tournaments/${id}/publish-schedule`);
      return response.data.data;
    } catch (error) {
      console.error(`Error publishing schedule for tournament ${id}:`, error);
      throw error;
    }
  },

  // Unpublish lịch thi đấu (Ẩn lịch khỏi public)
  unpublishSchedule: async (id: number): Promise<Tournament> => {
    try {
      const response = await api.post<ApiResponse<Tournament>>(`/tournaments/${id}/unpublish-schedule`);
      return response.data.data;
    } catch (error) {
      console.error(`Error unpublishing schedule for tournament ${id}:`, error);
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

  // Lấy giải đấu của tôi (organizer)
  getMyTournaments: async (): Promise<Tournament[]> => {
    try {
      const response = await api.get('/tournaments', { params: { my_tournaments: true } });
      if (response.data?.data?.data && Array.isArray(response.data.data.data)) {
        return response.data.data.data;
      }
      if (Array.isArray(response.data?.data)) {
        return response.data.data;
      }
      if (Array.isArray(response.data)) {
        return response.data;
      }
      return [];
    } catch (error) {
      console.error('Error fetching my tournaments:', error);
      throw error;
    }
  },

  // ===== SCHEDULE MANAGEMENT =====
  
  // Tự động sinh lịch thi đấu - POST /api/tournaments/{id}/generate-schedule
  generateSchedule: async (id: number, params?: { 
    start_date?: string; 
    end_date?: string; 
    field_ids?: number[];
    num_groups?: number;
    teams_per_group?: number;
    days_between_rounds?: number;
    time_slots?: string[];
  }): Promise<{ message: string }> => {
    try {
      const response = await api.post<ApiResponse<{ message: string }>>(
        `/tournaments/${id}/generate-schedule`,
        params || {}
      );
      return response.data.data;
    } catch (error) {
      console.error(`Error generating schedule for tournament ${id}:`, error);
      throw error;
    }
  },

  // Lấy sơ đồ bracket
  // - Organizer/Admin: GET /api/tournaments/{id}/bracket (Auth - xem cả lịch chưa publish)
  // - User thường: GET /api/public/tournaments/{id}/bracket (Public - chỉ xem lịch đã publish)
  getBracket: async (id: number, isOrganizer: boolean = false): Promise<TournamentBracket> => {
    try {
      // Organizer/Admin dùng auth endpoint, user thường dùng public endpoint
      const endpoint = isOrganizer 
        ? `/tournaments/${id}/bracket` 
        : `/public/tournaments/${id}/bracket`;
      
      const response = await api.get(endpoint);
      const raw = response.data;
      // Format: { success: true, data: { tournament, rounds, groups, matches, teams } }
      if (raw?.data) {
        return raw.data;
      }
      // Format: direct object
      if (raw?.tournament) {
        return raw;
      }
      throw new Error('Invalid bracket data format');
    } catch (error) {
      console.error(`Error fetching bracket for tournament ${id}:`, error);
      throw error;
    }
  },

  // Xóa lịch thi đấu - DELETE /api/tournaments/{id}/schedule
  deleteSchedule: async (id: number): Promise<void> => {
    try {
      await api.delete(`/tournaments/${id}/schedule`);
    } catch (error) {
      console.error(`Error deleting schedule for tournament ${id}:`, error);
      throw error;
    }
  },

  // ===== FIELD BOOKING MANAGEMENT =====
  
  // Book sân cho giải đấu - POST /api/tournaments/{id}/book-fields
  bookFields: async (id: number, data: BookFieldsRequest): Promise<{ message: string; bookings: FieldBooking[] }> => {
    try {
      const response = await api.post<ApiResponse<{ message: string; bookings: FieldBooking[] }>>(
        `/tournaments/${id}/book-fields`,
        data
      );
      return response.data.data;
    } catch (error) {
      console.error(`Error booking fields for tournament ${id}:`, error);
      throw error;
    }
  },

  // Lấy danh sách sân đã book - GET /api/tournaments/{id}/field-bookings
  getFieldBookings: async (id: number): Promise<FieldBooking[]> => {
    try {
      const response = await api.get(`/tournaments/${id}/field-bookings`);
      const data = response.data;
      
      // Backend trả về { data: { bookings: [], total_bookings: 0, total_price: 0 } }
      if (data?.data?.bookings && Array.isArray(data.data.bookings)) {
        return data.data.bookings;
      }
      // Fallback: { bookings: [] } trực tiếp
      if (data?.bookings && Array.isArray(data.bookings)) {
        return data.bookings;
      }
      // Fallback: Array trực tiếp
      if (Array.isArray(data?.data)) {
        return data.data;
      }
      // Fallback: response.data is array
      if (Array.isArray(data)) {
        return data;
      }
      return [];
    } catch (error) {
      console.error(`❌ Error fetching field bookings for tournament ${id}:`, error);
      throw error;
    }
  },

  // Xóa booking sân - DELETE /api/tournaments/{id}/field-bookings/{booking_id}
  deleteFieldBooking: async (id: number, bookingId: number): Promise<void> => {
    try {
      await api.delete(`/tournaments/${id}/field-bookings/${bookingId}`);
    } catch (error) {
      console.error(`Error deleting field booking ${bookingId}:`, error);
      throw error;
    }
  },

  // ==========================================
  // PAYMENT MANAGEMENT
  // ==========================================

  // Owner xác nhận thanh toán (approve/reject) - gọi theo từng booking ID
  confirmPayment: async (bookingId: number, action: 'approve' | 'reject', note?: string): Promise<any> => {
    try {
      console.log(`🏦 [API] Confirming payment for booking ${bookingId}:`, { action, note });
      const body: Record<string, string> = { action };
      if (note) body.note = note;
      const response = await api.put(`/books/${bookingId}/confirm-payment`, body);
      console.log('✅ [API] Payment confirmation response:', response.data);
      return response.data;
    } catch (error: any) {
      console.error(`❌ [API] Error confirming payment for booking ${bookingId}:`, error);
      console.error('Response data:', error?.response?.data);
      throw error;
    }
  },

  // Gọi confirmPayment cho tất cả bookings của một tournament
  confirmPaymentAllBookings: async (bookings: any[], action: 'approve' | 'reject', note?: string): Promise<any[]> => {
    const results = await Promise.all(
      bookings.map((b: any) => tournamentService.confirmPayment(b.id, action, note))
    );
    return results;
  },

  // ==========================================
  // RULES FILE MANAGEMENT
  // ==========================================

  // Gửi URL bill chuyển khoản cho BE lưu vào DB
  // POST /api/tournaments/{id}/upload-payment-proof
  // Body: { payment_proof_url: "<supabase url>" }
  uploadPaymentProof: async (id: number, paymentProofUrl: string): Promise<any> => {
    try {
      const response = await api.post(`/books/${id}/upload-payment-proof`, {
        payment_proof_url: paymentProofUrl,
      });
      return response.data;
    } catch (error) {
      console.error(`Error uploading payment proof for tournament ${id}:`, error);
      throw error;
    }
  },

  uploadPaymentProofTournaments: async (id: number, paymentProofUrl: string): Promise<any> => {
    try {
      const response = await api.post(`/tournaments/${id}/upload-payment-proof`, {
        payment_proof_url: paymentProofUrl,
      });
      return response.data;
    } catch (error) {
      console.error(`Error uploading payment proof for tournament ${id}:`, error);
      throw error;
    }
  },

  // Upload file thể lệ giải đấu (PDF/DOC/DOCX)
  uploadRulesFile: async (id: number, file: File): Promise<any> => {
    try {
      const formData = new FormData();
      formData.append('rules_file', file);

      const response = await api.post(`/tournaments/${id}/upload-rules-file`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } catch (error) {
      console.error(`Error uploading rules file for tournament ${id}:`, error);
      throw error;
    }
  },

  // Download file thể lệ (public - không cần auth)
  downloadRulesFile: async (id: number): Promise<Blob> => {
    try {
      const response = await api.get(`/tournaments/${id}/download-rules-file`, {
        responseType: 'blob',
      });
      return response.data;
    } catch (error) {
      console.error(`Error downloading rules file for tournament ${id}:`, error);
      throw error;
    }
  },

  // Xóa file thể lệ
  deleteRulesFile: async (id: number): Promise<void> => {
    try {
      await api.delete(`/tournaments/${id}/delete-rules-file`);
    } catch (error) {
      console.error(`Error deleting rules file for tournament ${id}:`, error);
      throw error;
    }
  },

  // ==========================================
  // GROUP / STANDINGS / MATCHES ENDPOINTS
  // ==========================================

  // GET /api/tournaments/{id}/groups — groups with standings, teams, matches
  // Response: { success, data: { tournament_id, groups: [...], total_groups } }
  getGroups: async (id: number): Promise<any[]> => {
    try {
      const response = await api.get(`/tournaments/${id}/groups`);
      // Unwrap nested: data.data.groups
      if (Array.isArray(response.data?.data?.groups)) return response.data.data.groups;
      if (Array.isArray(response.data?.data)) return response.data.data;
      return [];
    } catch (error) {
      console.error(`Error fetching groups for tournament ${id}:`, error);
      throw error;
    }
  },

  // GET /api/tournaments/{id}/standings — all group standings
  // Response: { success, data: { tournament_id, format, groups: [{ group_id, group_name, standings }] } }
  getStandings: async (id: number): Promise<any[]> => {
    try {
      const response = await api.get(`/tournaments/${id}/standings`);
      if (Array.isArray(response.data?.data?.groups)) return response.data.data.groups;
      if (Array.isArray(response.data?.data)) return response.data.data;
      return [];
    } catch (error) {
      console.error(`Error fetching standings for tournament ${id}:`, error);
      throw error;
    }
  },

  // GET /api/tournaments/{id}/matches — all matches grouped by round
  // Response: { success, data: { tournament_id, total_matches, rounds: [{ round_id, round_name, round_type, matches }] } }
  getMatches: async (id: number): Promise<any[]> => {
    try {
      const response = await api.get(`/tournaments/${id}/matches`);
      if (Array.isArray(response.data?.data?.rounds)) return response.data.data.rounds;
      if (Array.isArray(response.data?.data)) return response.data.data;
      return [];
    } catch (error) {
      console.error(`Error fetching matches for tournament ${id}:`, error);
      throw error;
    }
  },

  // GET /api/tournaments/{id}/teams/{teamId}/matches — matches for a team in a tournament
  getTeamMatches: async (tournamentId: number, teamId: number): Promise<any[]> => {
    try {
      const response = await api.get(`/tournaments/${tournamentId}/teams/${teamId}/matches`);
      return response.data?.data ?? response.data ?? [];
    } catch (error) {
      console.error(`Error fetching team matches for tournament ${tournamentId} team ${teamId}:`, error);
      throw error;
    }
  },

  // PUT /api/tournament-matches/{id}/result — update match result
  updateMatchResult: async (matchId: number, data: {
    home_score: number;
    away_score: number;
    home_penalty_score?: number;
    away_penalty_score?: number;
    status?: string;
  }): Promise<any> => {
    try {
      const response = await api.put(`/tournament-matches/${matchId}/result`, data);
      return response.data?.data ?? response.data;
    } catch (error) {
      console.error(`Error updating match result for match ${matchId}:`, error);
      throw error;
    }
  },
};
