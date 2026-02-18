import api from '@/lib/axios';

export interface User {
  id: number;
  name: string;
  email: string;
  role_id: number;
  role?: {
    id: number;
    name_role: string;
    description?: string;
  };
  created_at?: string;
  updated_at?: string;
}

export interface CreateUserData {
  name: string;
  email: string;
  password: string;
  role_id: number;
}

export interface UpdateUserData {
  name?: string;
  email?: string;
  password?: string;
  role_id?: number;
}

// Lấy danh sách users (Admin only)
export const getUsers = async () => {
  const response = await api.get('/users');
  return response.data;
};

// Lấy thông tin một user
export const getUser = async (id: number) => {
  const response = await api.get(`/users/${id}`);
  return response.data;
};

// Tạo user mới (Admin only)
export const createUser = async (data: CreateUserData) => {
  const response = await api.post('/users', data);
  return response.data;
};

// Cập nhật user (Admin only)
export const updateUser = async (id: number, data: UpdateUserData) => {
  const response = await api.put(`/users/${id}`, data);
  return response.data;
};

// Xóa user (Admin only)
export const deleteUser = async (id: number) => {
  const response = await api.delete(`/users/${id}`);
  return response.data;
};
