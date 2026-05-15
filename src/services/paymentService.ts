import api from '@/lib/axios';
import { Booking } from './bookingService';

export interface FieldStatistics {
  field_id: number;
  field_name: string | null;
  total_bookings: number;
  paid_count: number;
  pending_count: number;
  revenue: number;
  pending_revenue: number;
}

export interface BookingTypeStatistics {
  regular: {
    total_bookings: number;
    revenue: number;
  };
  tournament: {
    total_bookings: number;
    revenue: number;
  };
}

export interface PaymentStatistics {
  total_bookings: number;
  pending_payment: number;
  pending_with_bill: number;
  paid: number;
  failed: number;
  total_revenue: string | number;
  pending_revenue: number;
  by_payment_method: {
    cash: number;
    transfer: number;
  };
  by_field: FieldStatistics[];
  by_booking_type: BookingTypeStatistics;
}

export interface PendingPayment extends Booking {
  field_name?: string;
  field_cluster_name?: string;
  customer_name?: string;
  customer_phone?: string;
}

export const paymentService = {
  // Danh sách booking chờ xác nhận (BE đã filter sẵn cho owner)
  getPendingPayments: async (): Promise<PendingPayment[]> => {
    try {
      console.log('📡 GET /api/bookings/pending-payments');
      const response = await api.get('/books');
      console.log('📦 GET /api/bookings/pending-payments response:', response.data);
      const rawData = response.data?.data?.bookings || response.data?.data || response.data || [];
      if (!Array.isArray(rawData)) return [];
      return rawData.map((booking: any) => ({
        ...booking,
        booking_date: booking.day_book || booking.booking_date,
        customer_name: booking.customer_name || booking.user?.name || booking.user?.full_name,
        customer_phone: booking.customer_phone || booking.user?.phone,
        customer_email: booking.customer_email || booking.user?.email,
      }));
    } catch (error: any) {
      console.error('❌ Error fetching pending payments:', error);
      return [];
    }
  },

  // Thống kê thanh toán từ BE
  getPaymentStatistics: async (): Promise<PaymentStatistics | null> => {
    try {
      console.log('📡 GET /api/bookings/payment-statistics');
      const response = await api.get('/bookings/payment-statistics');
      console.log('📦 GET /api/bookings/payment-statistics response:', response.data);
      return response.data?.data || response.data;
    } catch (error: any) {
      console.error('❌ Error fetching payment statistics:', error);
      return null;
    }
  },

  // LEGACY — giữ lại để không break code khác nếu có
  getAllBookings: async (filters?: {
    payment_status?: string;
    payment_method?: string;
    status?: string;
    date?: string;    booking_type?: string;  }): Promise<PendingPayment[]> => {
    try {
      console.log('📡 Calling GET /api/books with filters:', filters);
      
      const params: any = {};
      if (filters?.payment_status) params.payment_status = filters.payment_status;
      if (filters?.payment_method) params.payment_method = filters.payment_method;
      if (filters?.status) params.status = filters.status;
      if (filters?.date) params.day_book = filters.date;
      
      const response = await api.get('/books', { params });
      console.log('📦 All bookings response:', response.data);
      
      const rawData = response.data?.data || response.data || [];
      
      if (!Array.isArray(rawData)) {
        console.warn('⚠️ Backend did not return an array:', rawData);
        return [];
      }
      
      // Đọc tất cả từ nested booking.tournament trả về sẵn trong /books
      // Không gọi thêm GET /tournaments/{id} vì owner không có quyền
      const bookings = rawData.map((booking: any) => ({
        ...booking,
        booking_date: booking.day_book || booking.booking_date,
        customer_name: booking.customer_name || booking.user?.name || booking.user?.full_name,
        customer_phone: booking.customer_phone || booking.user?.phone,
        customer_email: booking.customer_email || booking.user?.email,
        payment_method: booking.payment_method || booking.tournament?.payment_method,
        payment_proof_url: booking.payment_proof_url || booking.payment_proof
          || booking.tournament?.payment_proof || booking.tournament?.payment_proof_url,
        tournament_name: booking.tournament_name || booking.tournament?.name,
        payment_status: booking.payment_status || booking.tournament?.payment_status,
      }));

      console.log('✅ Mapped bookings:', bookings.length, 'items');
      return bookings;
    } catch (error: any) {
      console.error('❌ Error fetching bookings:', error);
      console.error('❌ Error response:', error.response?.data);
      return [];
    }
  },



  // Xác nhận thanh toán booking thường: PUT /books/{id}/confirm-payment
  confirmPayment: async (bookingId: number, action: 'approve' | 'reject', note?: string) => {
    try {
      console.log(`📡 PUT /api/books/${bookingId}/confirm-payment`, { action, note });
      const response = await api.put(`/books/${bookingId}/confirm-payment`, { action, note });
      console.log(`📦 PUT /api/books/${bookingId}/confirm-payment response:`, response.data);
      return {
        success: true,
        data: response.data?.data || response.data,
        message: response.data?.message || 'Đã xác nhận thanh toán thành công',
      };
    } catch (error: any) {
      console.error('❌ Error confirming booking payment:', error);
      return {
        success: false,
        error: error.response?.data?.message || 'Không thể xác nhận thanh toán',
      };
    }
  },

  // Xác nhận thanh toán booking giải đấu: PUT /tournaments/{id}/confirm-payment
  confirmTournamentPayment: async (tournamentId: number, action: 'approve' | 'reject', note?: string) => {
    try {
      console.log(`📡 PUT /api/tournaments/${tournamentId}/confirm-payment`, { action, note });
      const response = await api.put(`/tournaments/${tournamentId}/confirm-payment`, { action, note });
      console.log(`📦 PUT /api/tournaments/${tournamentId}/confirm-payment response:`, response.data);
      return {
        success: true,
        data: response.data?.data || response.data,
        message: response.data?.message || (action === 'approve' ? 'Đã xác nhận thanh toán giải đấu' : 'Đã từ chối thanh toán giải đấu'),
      };
    } catch (error: any) {
      console.error('❌ Error confirming tournament payment:', error);
      return {
        success: false,
        error: error.response?.data?.message || 'Không thể xác nhận thanh toán giải đấu',
      };
    }
  },

  // Get booking detail
  getBookingDetail: async (bookingId: number): Promise<Booking | null> => {
    try {
      console.log(`📡 Calling GET /api/books/${bookingId}...`);
      const response = await api.get(`/books/${bookingId}`);
      console.log('📦 Booking detail:', response.data);
      
      const booking = response.data?.data || response.data;
      
      return {
        ...booking,
        booking_date: booking.day_book || booking.booking_date,
        customer_name: booking.customer_name || booking.user?.name || booking.user?.full_name,
        customer_phone: booking.customer_phone || booking.user?.phone,
        customer_email: booking.customer_email || booking.user?.email,
      };
    } catch (error: any) {
      console.error('❌ Error fetching booking detail:', error);
      return null;
    }
  },


  // Owner/Staff xác nhận hoặc từ chối đặt sân
  confirmBooking: async (
    id: number,
    data: {
      action: 'confirmed' | 'approve' | 'reject';
      note?: string
    }
  ): Promise<any> => {
    try {
      const response = await api.post(`/books/${id}/confirm-booking`, data)

      return response.data
    } catch (error: any) {
      console.error('Error confirming booking:', error)

      throw error?.response?.data || {
        message: 'Không thể xác nhận đặt sân'
      }
    }
  },

  // User chọn phương thức thanh toán sau khi owner xác nhận
  selectPaymentMethod: async (
    id: number,
    data: {
      payment_method: 'cash' | 'banking'
    }
  ): Promise<any> => {
    try {
      const response = await api.post(`/books/${id}/select-payment-method`, data)

      return response.data
    } catch (error: any) {
      console.error('Error selecting payment method:', error)

      throw error?.response?.data || {
        message: 'Không thể chọn phương thức thanh toán'
      }
    }
  },
};
