import api from '@/lib/axios';

// Interface cho booking
export interface Booking {
  id: number;
  field_id: number;
  user_id?: number;
  booking_date: string;
  start_time: string;
  end_time: string;
  total_price: number;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
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
  status?: string;
  customer_name?: string;
  customer_phone?: string;
  customer_email?: string;
  note?: string;
}

export const bookingService = {
  getBookingsByFieldAndDate: async (fieldId: number, bookingDate: string): Promise<Booking[]> => {
    try {
      const response = await api.get('/books', {
        params: {
          field_id: fieldId,
          day_book: bookingDate, // Backend uses 'day_book'
        }
      });
      
      const rawData = response.data?.data || response.data || [];
      const bookings = Array.isArray(rawData) ? rawData.map((booking: any) => ({
        ...booking,
        booking_date: booking.day_book || booking.booking_date, // Map day_book to booking_date for frontend
        // Map customer info from various possible fields
        customer_name: booking.customer_name || booking.name || booking.user?.name || booking.user?.full_name,
        customer_phone: booking.customer_phone || booking.phone || booking.user?.phone,
        customer_email: booking.customer_email || booking.email || booking.user?.email,
      })) : [];
      
      return bookings;
    } catch (error) {
      console.error('Error fetching bookings:', error);
      return [];
    }
  },

  createBooking: async (data: BookingRequest) => {
    try {
      // Backend requires H:i format (HH:mm WITHOUT seconds)
      const formatTime = (time: string) => {
        if (!time) return time;
        const parts = time.split(':');
        if (parts.length === 3) return parts.slice(0, 2).join(':'); // HH:mm:ss -> HH:mm
        return time; // Already HH:mm
      };

      // Backend expects 'day_book' instead of 'booking_date'
      const bookingPayload = {
        field_id: data.field_id,
        day_book: data.booking_date, // Backend uses 'day_book'
        start_time: formatTime(data.start_time),
        end_time: formatTime(data.end_time),
        total_price: data.total_price,
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
      
      return {
        success: true,
        data: response.data?.data || response.data,
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

  getMyBookings: async () => {
    const response = await api.get('/books');
    return response.data?.data || response.data;
  },

  // Get all bookings for owner (all fields owner manages)
  getOwnerBookings: async (bookingDate?: string): Promise<Booking[]> => {
    try {
      const params: any = {};
      if (bookingDate) {
        params.day_book = bookingDate;
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
};
