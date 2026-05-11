import api from '@/lib/axios';

export interface Notification {
  id: number;
  type: string;
  title: string;
  message: string;
  data?: {
    tournament_id?: number;
    tournament_name?: string;
    team_id?: number;
    team_name?: string;
    registration_id?: number;
    booking_id?: number;
    status?: string;
    reason?: string;
    [key: string]: any;
  };
  read_at: string | null;
  created_at: string;
  updated_at?: string;
}

interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

const parseList = (raw: any): Notification[] => {
  if (raw?.data?.data && Array.isArray(raw.data.data)) return raw.data.data;
  if (Array.isArray(raw?.data)) return raw.data;
  if (Array.isArray(raw)) return raw;
  return [];
};

export const notificationService = {
  // GET /api/notifications
  getAll: async (): Promise<Notification[]> => {
    try {
      const response = await api.get('/notifications');
      return parseList(response.data);
    } catch (error) {
      console.error('Error fetching notifications:', error);
      throw error;
    }
  },

  // GET /api/notifications/unread-count
  getUnreadCount: async (): Promise<number> => {
    try {
      const response = await api.get('/notifications/unread-count');
      const raw = response.data;
      return raw?.data?.count ?? raw?.data?.unread_count ?? raw?.count ?? raw?.unread_count ?? 0;
    } catch (error) {
      console.error('Error fetching unread count:', error);
      return 0;
    }
  },

  // PUT /api/notifications/{id}/read
  markAsRead: async (id: number): Promise<void> => {
    try {
      await api.put(`/notifications/${id}/read`);
    } catch (error) {
      console.error(`Error marking notification ${id} as read:`, error);
      throw error;
    }
  },

  // PUT /api/notifications/mark-all-read
  markAllAsRead: async (): Promise<void> => {
    try {
      await api.put('/notifications/mark-all-read');
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      throw error;
    }
  },

  // DELETE /api/notifications/{id}
  delete: async (id: number): Promise<void> => {
    try {
      await api.delete(`/notifications/${id}`);
    } catch (error) {
      console.error(`Error deleting notification ${id}:`, error);
      throw error;
    }
  },

  // DELETE /api/notifications/read/all
  deleteAllRead: async (): Promise<void> => {
    try {
      await api.delete('/notifications/read/all');
    } catch (error) {
      console.error('Error deleting all read notifications:', error);
      throw error;
    }
  },
};
