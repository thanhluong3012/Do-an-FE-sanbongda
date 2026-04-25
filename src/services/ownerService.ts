import api from '@/lib/axios';

export interface Owner {
  id: number;
  user_id: number;
  business_name?: string;
  code_id?: string;
  address?: string;
  user?: {
    id: number;
    name: string;
    email: string;
  };
  created_at?: string;
  updated_at?: string;
}

export interface CreateOwnerData {
  user_id: number;
  business_name?: string;
  code_id?: string;
  address?: string;
}

// Lấy danh sách owners (Admin, Owner)
export const getOwners = async () => {
  const response = await api.get('/owners');
  return response.data;
};

// Lấy thông tin một owner
export const getOwner = async (id: number) => {
  const response = await api.get(`/owners/${id}`);
  return response.data;
};

// Tạo owner mới
export const createOwner = async (data: CreateOwnerData) => {
  const response = await api.post('/owners', data);
  return response.data;
};

// Cập nhật owner
export const updateOwner = async (id: number, data: Partial<CreateOwnerData>) => {
  const response = await api.put(`/owners/${id}`, data);
  return response.data;
};

// Xóa owner
export const deleteOwner = async (id: number) => {
  const response = await api.delete(`/owners/${id}`);
  return response.data;
};

// ==========================================
// OWNER PROFILE MANAGEMENT
// ==========================================

export interface UpdateOwnerProfileData {
  business_name?: string;
  address?: string;
  code_id?: string;
  qr_code_image?: string; // QR code URL from Supabase Storage
}

// Owner tự cập nhật profile của mình
export const updateOwnerProfile = async (data: UpdateOwnerProfileData) => {
  const response = await api.put('/owner/profile', data);
  return response.data;
};

// Upload QR code cho thanh toán
export const uploadQRCode = async (file: File) => {
  const formData = new FormData();
  formData.append('qr_code', file);
  const response = await api.post('/owner/upload-qr', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};

// Lấy QR code
export const getQRCode = async () => {
  const response = await api.get('/owner/qr-code');
  return response.data;
};
