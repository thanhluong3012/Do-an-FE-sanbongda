import api from '@/lib/axios';

export interface Staff {
  id: number;
  user_id: number;
  owner_id: number;
  position?: string;
  salary?: number;
  user?: {
    id: number;
    name: string;
    email: string;
  };
  owner?: {
    id: number;
    business_name: string;
  };
  created_at?: string;
  updated_at?: string;
}

export interface CreateStaffData {
  user_id: number;
  owner_id: number;
  position?: string;
  salary?: number;
}

// Lấy danh sách staffs (Admin, Owner)
export const getStaffs = async () => {
  const response = await api.get('/staffs');
  return response.data;
};

// Lấy thông tin một staff
export const getStaff = async (id: number) => {
  const response = await api.get(`/staffs/${id}`);
  return response.data;
};

// Tạo staff mới
export const createStaff = async (data: CreateStaffData) => {
  const response = await api.post('/staffs', data);
  return response.data;
};

// Cập nhật staff
export const updateStaff = async (id: number, data: Partial<CreateStaffData>) => {
  const response = await api.put(`/staffs/${id}`, data);
  return response.data;
};

// Xóa staff
export const deleteStaff = async (id: number) => {
  const response = await api.delete(`/staffs/${id}`);
  return response.data;
};
