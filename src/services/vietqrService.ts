import api from '@/lib/axios';

// Interface cho VietQR payment response
export interface VietQRPaymentResponse {
  success: boolean;
  message: string;
  data: {
    booking_id: number;
    qr_code_url: string;
    amount: number;
    amount_formatted: string;
    transfer_content: string;
    account_info: {
      bank_id: string;
      account_no: string;
      account_name: string;
      is_owner_account?: boolean;
    };
    instruction: string;
    next_step: string;
  };
}

// Interface cho VietQR status response
export interface VietQRStatusResponse {
  success: boolean;
  message?: string;
  data: {
    booking_id: number;
    payment_status: 'pending' | 'paid' | 'failed';
    payment_method: string;
    payment_proof?: string | null;
    payment_confirmed_at?: string | null;
    payment_note?: string | null;
    amount: number;
    status_message: string;
  };
}

// Interface cho Bank info
export interface BankInfo {
  id: string;
  name: string;
  code: string;
  bin: string;
  shortName: string;
  logo: string;
  transferSupported: number;
  lookupSupported: number;
}

export interface BanksResponse {
  success: boolean;
  data: BankInfo[];
}

export const vietqrService = {
  /**
   * Tạo VietQR Code cho booking
   */
  createQR: async (bookingId: number): Promise<VietQRPaymentResponse> => {
    try {
      const response = await api.post(`/vietqr/create-payment/${bookingId}`);
      return response.data;
    } catch (error: any) {
      throw error;
    }
  },

  /**
   * Tạo VietQR Code cho tournament
   */
  createQRForTournament: async (tournamentId: number): Promise<VietQRPaymentResponse> => {
    try {
      const response = await api.post(`/vietqr/create-payment/tournament/${tournamentId}`);
      return response.data;
    } catch (error: any) {
      throw error;
    }
  },

  /**
   * Kiểm tra trạng thái thanh toán
   */
  checkStatus: async (bookingId: number): Promise<VietQRStatusResponse> => {
    try {
      const response = await api.get(`/vietqr/check-status/${bookingId}`);
      return response.data;
    } catch (error: any) {
      throw error;
    }
  },

  /**
   * Kiểm tra trạng thái thanh toán tournament
   */
  checkStatusForTournament: async (tournamentId: number): Promise<VietQRStatusResponse> => {
    try {
      const response = await api.get(`/vietqr/check-status/tournament/${tournamentId}`);
      return response.data;
    } catch (error: any) {
      throw error;
    }
  },

  /**
   * Lấy danh sách ngân hàng hỗ trợ VietQR (public API)
   */
  getBanks: async (): Promise<BanksResponse> => {
    try {
      const response = await api.get('/vietqr/banks');
      return response.data;
    } catch (error: any) {
      throw error;
    }
  },
};
