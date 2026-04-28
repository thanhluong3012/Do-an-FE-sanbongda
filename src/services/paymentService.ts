import api from '@/lib/axios';
import { Booking } from './bookingService';

export interface PaymentStatistics {
  total_pending: number;
  total_paid: number;
  total_revenue: number;
  pending_amount: number;
  transfer_count: number;
  cash_count: number;
}

export interface PendingPayment extends Booking {
  field_name?: string;
  field_cluster_name?: string;
  customer_name?: string;
  customer_phone?: string;
}

export const paymentService = {
  // Get ALL bookings for owner (with optional filters)
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
      
      const bookings = rawData.map((booking: any) => ({
        ...booking,
        booking_date: booking.day_book || booking.booking_date,
        customer_name: booking.customer_name || booking.user?.name || booking.user?.full_name,
        customer_phone: booking.customer_phone || booking.user?.phone,
        customer_email: booking.customer_email || booking.user?.email,
      }));
      
      console.log('✅ Mapped bookings:', bookings.length, 'items');
      return bookings;
    } catch (error: any) {
      console.error('❌ Error fetching bookings:', error);
      console.error('❌ Error response:', error.response?.data);
      return [];
    }
  },

  // Get pending payments for owner (có upload bill)
  getPendingPayments: async (): Promise<PendingPayment[]> => {
    try {
      console.log('📡 Getting bookings with uploaded payment proofs...');
      const allBookings = await paymentService.getAllBookings();
      
      // Filter bookings that have uploaded payment proof and waiting for confirmation
      const pendingPayments = allBookings.filter((booking: any) => {
        const hasTransferPayment = booking.payment_method === 'transfer';
        const isPending = booking.payment_status === 'pending' || !booking.payment_status;
        const hasProof = booking.payment_proof_url && booking.payment_proof_url !== null;
        
        return hasTransferPayment && isPending && hasProof;
      });
      
      console.log(`✅ Found ${pendingPayments.length} pending payments with proof`);
      return pendingPayments;
    } catch (error: any) {
      console.error('❌ Error fetching pending payments:', error);
      return [];
    }
  },

  // Get payment statistics
  getPaymentStatistics: async (): Promise<PaymentStatistics | null> => {
    try {
      console.log('📡 Calculating payment statistics...');
      const allBookings = await paymentService.getAllBookings();
      
      const stats = {
        total_pending: allBookings.filter(b => 
          b.payment_method === 'transfer' && 
          (b.payment_status === 'pending' || !b.payment_status) && 
          b.payment_proof_url
        ).length,
        total_paid: allBookings.filter(b => b.payment_status === 'paid').length,
        total_revenue: allBookings
          .filter(b => b.payment_status === 'paid')
          .reduce((sum, b) => sum + (b.total_price || 0), 0),
        pending_amount: allBookings
          .filter(b => 
            b.payment_method === 'transfer' && 
            (b.payment_status === 'pending' || !b.payment_status) && 
            b.payment_proof_url
          )
          .reduce((sum, b) => sum + (b.total_price || 0), 0),
        transfer_count: allBookings.filter(b => b.payment_method === 'transfer').length,
        cash_count: allBookings.filter(b => b.payment_method === 'cash').length,
      };
      
      console.log('📊 Calculated statistics:', stats);
      return stats;
    } catch (error: any) {
      console.error('❌ Error calculating payment statistics:', error);
      return null;
    }
  },

  // Confirm payment (owner/staff only)
  confirmPayment: async (bookingId: number, action: 'approve' | 'reject' = 'approve', note?: string) => {
    try {
      console.log(`📡 Calling PUT /api/books/${bookingId}/confirm-payment...`);
      const response = await api.put(`/books/${bookingId}/confirm-payment`, {
        action,
        note,
      });
      
      console.log('✅ Confirm payment response:', response.data);
      
      return {
        success: true,
        data: response.data?.data || response.data,
        message: response.data?.message || 'Đã xác nhận thanh toán thành công',
      };
    } catch (error: any) {
      console.error('❌ Error confirming payment:', error);
      console.error('❌ Error response:', error.response?.data);
      
      return {
        success: false,
        error: error.response?.data?.message || 'Không thể xác nhận thanh toán',
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
};
