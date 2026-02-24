import api from '@/lib/axios';

export interface OwnerRegistration {
  id: number;
  full_name?: string;
  name?: string;
  email: string;
  phone: string;
  address?: string;
  image_code?: string;
  code_id?: string;
  business_name?: string;
  business_license?: string;
  business_license_url?: string;
  id_card_number?: string;
  status: 'pending' | 'approved' | 'rejected';
  rejected_reason?: string;
  rejection_reason?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateOwnerRegistrationData {
  full_name: string;
  email: string;
  phone: string;
  address?: string;
  business_name?: string;
  business_license?: string;
}

// Tạo yêu cầu đăng ký chủ sân (Public - không cần auth)
export const createOwnerRegistration = async (data: CreateOwnerRegistrationData) => {
  const response = await api.post('/owner-registrations', data);
  return response.data;
};

// Lấy danh sách yêu cầu đăng ký (Admin only)
export const getOwnerRegistrations = async (status?: 'pending' | 'approved' | 'rejected') => {
  const params = status ? { status } : {};
  const response = await api.get('/admin/owner-registrations', { params });
  return response.data;
};

// Lấy chi tiết một yêu cầu (Admin only)
export const getOwnerRegistration = async (id: number) => {
  const response = await api.get(`/admin/owner-registrations/${id}`);
  return response.data;
};

// Phê duyệt yêu cầu (Admin only)
export const approveOwnerRegistration = async (id: number) => {
  const response = await api.put(`/admin/owner-registrations/${id}/approve`);
  return response.data;
};

// Từ chối yêu cầu (Admin only)
export const rejectOwnerRegistration = async (id: number, rejected_reason: string) => {
  const response = await api.put(`/admin/owner-registrations/${id}/reject`, { rejected_reason });
  return response.data;
};

// Xóa yêu cầu (Admin only)
export const deleteOwnerRegistration = async (id: number) => {
  const response = await api.delete(`/admin/owner-registrations/${id}`);
  return response.data;
};
