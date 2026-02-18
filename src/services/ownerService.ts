import api from '@/lib/axios';

export interface Owner {
  id: number;
  user_id: number;
  business_name?: string;
  business_license?: string;
  address?: string;
  phone?: string;
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
  business_license?: string;
  address?: string;
  phone?: string;
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
