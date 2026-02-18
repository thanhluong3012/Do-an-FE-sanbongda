import api from '@/lib/axios';

export interface OwnerRegistration {
  id: number;
  full_name: string;
  email: string;
  phone: string;
  address?: string;
  business_name?: string;
  business_license?: string;
  status: 'pending' | 'approved' | 'rejected';
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
export const getOwnerRegistrations = async (status?: string) => {
  const params = status ? { status } : {};
  const response = await api.get('/owner-registrations', { params });
  return response.data;
};

// Lấy chi tiết một yêu cầu (Admin only)
export const getOwnerRegistration = async (id: number) => {
  const response = await api.get(`/owner-registrations/${id}`);
  return response.data;
};

// Phê duyệt yêu cầu (Admin only)
export const approveOwnerRegistration = async (id: number, password: string) => {
  const response = await api.post(`/owner-registrations/${id}/approve`, { password });
  return response.data;
};

// Từ chối yêu cầu (Admin only)
export const rejectOwnerRegistration = async (id: number, rejection_reason: string) => {
  const response = await api.post(`/owner-registrations/${id}/reject`, { rejection_reason });
  return response.data;
};

// Xóa yêu cầu (Admin only)
export const deleteOwnerRegistration = async (id: number) => {
  const response = await api.delete(`/owner-registrations/${id}`);
  return response.data;
};
