import api from '@/lib/axios';

// Interface cho booking
export interface Booking {
  id: number;
  field_id: number;
  user_id?: number;
  booking_date: string;
  day_book?: string; // Backend field name
  start_time: string;
  end_time: string;
  total_price: number;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  payment_method?: 'transfer' | 'cash';
  payment_status?: 'pending' | 'paid' | 'refunded';
  payment_proof_url?: string;
  booking_type?: 'regular' | 'tournament';
  customer_name?: string;
  customer_phone?: string;
  customer_email?: string;
  note?: string;
  created_at?: string;
  updated_at?: string;
}

// Interface cho booking request
export interface BookingRequest {
  field_id: number;
  booking_date: string;
  start_time: string;
  end_time: string;
  total_price: number;
  payment_method?: 'transfer' | 'cash';
  status?: string;
  customer_name?: string;
  customer_phone?: string;
  customer_email?: string;
  note?: string;
}

export const bookingService = {
  getBookingsByFieldAndDate: async (fieldId: number, bookingDate: string): Promise<Booking[]> => {
    try {
      console.log('🔍 API Request: GET /books?field_id=' + fieldId + '&day_book=' + bookingDate);
      
      const response = await api.get('/books', {
        params: {
          field_id: fieldId,
          day_book: bookingDate, // Backend uses 'day_book'
        }
      });
      
      const rawData = response.data?.data || response.data || [];
      console.log('📦 API Response - Total bookings:', Array.isArray(rawData) ? rawData.length : 0);
      console.log('📦 Raw bookings data:', rawData);
      
      const bookings = Array.isArray(rawData) ? rawData.map((booking: any) => ({
        ...booking,
        booking_date: booking.day_book || booking.booking_date, // Map day_book to booking_date for frontend
        // Map customer info from various possible fields
        customer_name: booking.customer_name || booking.name || booking.user?.name || booking.user?.full_name,
        customer_phone: booking.customer_phone || booking.phone || booking.user?.phone,
        customer_email: booking.customer_email || booking.email || booking.user?.email,
      })) : [];
      
      // ⚠️ CRITICAL FIX: Backend không filter theo day_book, phải filter ở frontend
      console.log('⚠️ Filtering bookings - Expected date:', bookingDate);
      const filteredBookings = bookings.filter((booking: Booking) => {
        const bookingDate_str = booking.booking_date || booking.day_book;
        const matches = bookingDate_str === bookingDate;
        
        if (!matches) {
          console.log('❌ Rejected booking:', {
            id: booking.id,
            expected_date: bookingDate,
            actual_date: bookingDate_str,
            diff: 'WRONG DATE'
          });
        } else {
          console.log('✅ Accepted booking:', {
            id: booking.id,
            date: bookingDate_str,
            time: `${booking.start_time} - ${booking.end_time}`
          });
        }
        
        return matches;
      });
      
      console.log(`✅ Final result: ${filteredBookings.length}/${bookings.length} bookings for ${bookingDate}`);
      
      return filteredBookings;
    } catch (error) {
      console.error('❌ Error fetching bookings:', error);
      return [];
    }
  },

  createBooking: async (data: BookingRequest) => {
    try {
      // Backend requires H:i:s format (HH:mm:ss WITH seconds)
      const formatTime = (time: string) => {
        if (!time) return time;
        const parts = time.split(':');
        if (parts.length === 2) return time + ':00'; // HH:mm -> HH:mm:00
        if (parts.length === 3) return time; // Already HH:mm:ss
        return time + ':00'; // Default add seconds
      };

      // Backend expects 'day_book' instead of 'booking_date'
      const bookingPayload = {
        field_id: data.field_id,
        day_book: data.booking_date, // Backend uses 'day_book'
        start_time: formatTime(data.start_time),
        end_time: formatTime(data.end_time),
        total_price: data.total_price,
        payment_method: data.payment_method || 'transfer',
        status: data.status || 'pending',
        customer_name: data.customer_name,
        customer_phone: data.customer_phone,
        customer_email: data.customer_email,
        note: data.note,
      };

      console.log('🚀 Creating booking with payload:', bookingPayload);
      console.log('📝 Raw data received:', data);
      const response = await api.post('/books', bookingPayload);
      console.log('✅ Booking response:', response.data);
      
      const responseData = response.data?.data || response.data;
      
      return {
        success: true,
        data: responseData,
        booking: responseData.booking || responseData,
        payment_info: responseData.payment_info,
        message: response.data?.message || 'Đặt sân thành công'
      };
    } catch (error: any) {
      console.error('❌ Booking error FULL:', error);
      console.error('❌ Booking error response:', error.response);
      console.error('❌ Booking error data:', error.response?.data);
      console.error('❌ Validation errors:', error.response?.data?.errors);
      
      // Log chi tiết từng validation error
      if (error.response?.data?.errors) {
        console.error('📋 DETAILED VALIDATION ERRORS:');
        Object.entries(error.response.data.errors).forEach(([field, messages]) => {
          console.error(`  - ${field}:`, messages);
        });
      }
      
      // Extract detailed error message
      let errorMessage = 'Không thể đặt sân';
      if (error.response?.data?.errors) {
        // Laravel validation errors
        const validationErrors = error.response.data.errors;
        errorMessage = Object.values(validationErrors).flat().join(', ');
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      }
      
      return {
        success: false,
        error: errorMessage,
        data: null
      };
    }
  },

  getMyBookings: async (): Promise<Booking[]> => {
    try {
      console.log('📡 Calling GET /books for my bookings...');
      const response = await api.get('/books');
      console.log('📦 Raw response from backend:', response.data);
      
      const rawData = response.data?.data || response.data || [];
      console.log('📦 Extracted rawData:', rawData);
      
      if (!Array.isArray(rawData)) {
        console.warn('⚠️ Backend did not return an array:', rawData);
        return [];
      }
      
      // Debug: log first booking raw data
      if (rawData.length > 0) {
        console.log('🔍 First booking RAW from backend:', rawData[0]);
        console.log('🔍 First booking status field:', rawData[0].status);
      }
      
      // Map backend data structure to frontend Booking interface
      const bookings = rawData.map((booking: any) => {
        const mapped = {
          ...booking,
          // Map day_book to booking_date for frontend consistency
          booking_date: booking.day_book || booking.booking_date,
          // Map customer info from various possible fields
          customer_name: booking.customer_name || booking.name || booking.user?.name || booking.user?.full_name,
          customer_phone: booking.customer_phone || booking.phone || booking.user?.phone,
          customer_email: booking.customer_email || booking.email || booking.user?.email,
        };
        
        console.log(`📋 Booking #${mapped.id} mapped:`, {
          id: mapped.id,
          payment_method: mapped.payment_method,
          payment_status: mapped.payment_status,
          status: mapped.status,
          payment_proof_url: mapped.payment_proof_url
        });
        
        return mapped;
      });
      
      console.log('✅ Mapped bookings:', bookings.length, 'items');
      return bookings;
    } catch (error: any) {
      console.error('❌ Error fetching my bookings:', error);
      console.error('❌ Error response:', error.response?.data);
      return [];
    }
  },

  // Get all bookings for owner (all fields owner manages)
  getOwnerBookings: async (bookingDate?: string, bookingType?: string): Promise<Booking[]> => {
    try {
      const params: any = {};
      if (bookingDate) {
        params.from_date = bookingDate;
        params.to_date = bookingDate;
      }
      if (bookingType && bookingType !== 'all') {
        params.booking_type = bookingType;
      }
      
      const response = await api.get('/books', { params });
      const rawData = response.data?.data || response.data || [];
      const bookings = Array.isArray(rawData) ? rawData.map((booking: any) => ({
        ...booking,
        booking_date: booking.day_book || booking.booking_date,
        // Map customer info from various possible fields
        customer_name: booking.customer_name || booking.name || booking.user?.name || booking.user?.full_name,
        customer_phone: booking.customer_phone || booking.phone || booking.user?.phone,
        customer_email: booking.customer_email || booking.email || booking.user?.email,
      })) : [];
      
      return bookings;
    } catch (error) {
      console.error('Error fetching owner bookings:', error);
      return [];
    }
  },

  cancelBooking: async (id: number) => {
    const response = await api.delete(`/books/${id}`);
    return response.data?.data || response.data;
  },

  // Upload payment proof/bill for transfer payment
  uploadPaymentProof: async (bookingId: number, file: File) => {
    try {
      const formData = new FormData();
      formData.append('payment_proof', file);
      
      console.log('📤 Uploading payment proof for booking:', bookingId);
      console.log('📎 File:', file.name, file.size, 'bytes');
      
      const response = await api.post(`/books/${bookingId}/upload-payment-proof`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      console.log('✅ Upload response:', response.data);
      
      return {
        success: true,
        data: response.data?.data || response.data,
        message: response.data?.message || 'Đã upload chứng từ thanh toán thành công',
      };
    } catch (error: any) {
      console.error('❌ Upload payment proof error:', error);
      console.error('❌ Error response:', error.response?.data);
      
      return {
        success: false,
        error: error.response?.data?.message || 'Không thể upload chứng từ thanh toán',
      };
    }
  },
};
