import api from '@/lib/axios';

export interface Role {
  id: number;
  name_role: string;
  description?: string;
  created_at?: string;
  updated_at?: string;
}

// Lấy danh sách roles (Admin only)
export const getRoles = async () => {
  const response = await api.get('/roles');
  return response.data;
};

// Lấy thông tin một role
export const getRole = async (id: number) => {
  const response = await api.get(`/roles/${id}`);
  return response.data;
};

// Tạo role mới (Admin only)
export const createRole = async (data: Partial<Role>) => {
  const response = await api.post('/roles', data);
  return response.data;
};

// Cập nhật role (Admin only)
export const updateRole = async (id: number, data: Partial<Role>) => {
  const response = await api.put(`/roles/${id}`, data);
  return response.data;
};

// Xóa role (Admin only)
export const deleteRole = async (id: number) => {
  const response = await api.delete(`/roles/${id}`);
  return response.data;
};
