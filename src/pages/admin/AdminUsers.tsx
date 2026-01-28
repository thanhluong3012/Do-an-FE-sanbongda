import AdminLayout from '@/components/layout/AdminLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Search, Plus, Edit, Trash2, Shield, Mail, Calendar, Loader2, AlertCircle } from 'lucide-react';
import { useState, useEffect } from 'react';
import api from '@/lib/axios';
import { useToast } from '@/hooks/use-toast';


interface User {
  id: number;
  name: string;
  email: string;
  role?: string;
  role_id?: number;
  role_name?: string;
  status?: string;
  created_at: string;
  updated_at: string;
  bookings?: number;
}

const AdminUsers = () => {
  const [searchQuery, setSearchQuery] = useState('');

  const [users, setUsers] = useState<any[]>([]);
  const [roles, setRoles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  
  // State cho dialog xác nhận xóa
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<{ id: number; name: string } | null>(null);
  
  // State cho dialog sửa user
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [userToEdit, setUserToEdit] = useState<any>(null);
  const [editForm, setEditForm] = useState({ name: '', email: '', role: 'user', status: 'active' });

  // Call API user
  const fetchUsser = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch roles trước
      const rolesRes = await api.get('/roles');
      const rolesData = rolesRes.data.data || rolesRes.data;
      console.log('Roles data:', rolesData);
      setRoles(rolesData);
      
      // Fetch users
      const res = await api.get('/users');
      console.log('dữ liệu res: ', res);

      const usersData =  res.data.data;
      console.log('usersData:', usersData);
      console.log('User đầu tiên:', usersData[0]);
      
      // Format data
      const formattedUsers = usersData.map((user: any) => {
        
        // Tìm role name từ role_id
        const userRole = rolesData.find((r: any) => r.id === user.role_id);
        const roleName = userRole?.name || 'User';
      
        return {
          ...user,
          role: user.role || roleName.toLowerCase(),
          role_name: roleName,
          status: user.status || 'active',
          joinDate: user.created_at ? new Date(user.created_at).toLocaleDateString('vi-VN') : 'N/A',
          bookings: user.bookings || 0,
        };
      });
      
      setUsers(formattedUsers);

    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Lấy danh sách user thất bại';
      setError(errorMessage);
      console.error('Error fetching users:', err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchUsser();
  }, []);

  // Hàm mở dialog xác nhận xóa
  const handleDeleteClick = (userId: number, userName: string) => {
    setUserToDelete({ id: userId, name: userName });
    setDeleteDialogOpen(true);
  };

  // Hàm mở dialog sửa user
  const handleEditClick = (user: any) => {
    setUserToEdit(user);
    // Điền dữ liệu vào form
    setEditForm({
      name: user.name,
      email: user.email,
      role: user.role || 'user',
      status: user.status || 'active',
    });
    setEditDialogOpen(true);
  };

  // Hàm cập nhật user sau khi submit form
  const confirmUpdateUser = async () => {
    if (!userToEdit) return;

    try {
      await api.put(`/users/${userToEdit.id}`, editForm);
      
      // Cập nhật user trong state (không cần gọi lại API)
      setUsers(users.map(u => 
        u.id === userToEdit.id 
          ? { ...u, ...editForm, joinDate: u.joinDate }
          : u
      ));
      
      // Thông báo thành công
      toast({
        title: 'Thành công',
        description: `Đã cập nhật user "${editForm.name}" thành công`,
      });
      
      // Đóng dialog
      setEditDialogOpen(false);
      setUserToEdit(null);
      
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Cập nhật user thất bại';
      
      toast({
        title: 'Lỗi',
        description: errorMessage,
        variant: 'destructive',
      });
      
      console.error('Error updating user:', err);
    }
  };

  // Hàm xóa user sau khi confirm
  const confirmDeleteUser = async () => {
    if (!userToDelete) return;

    try {
      await api.delete(`/users/${userToDelete.id}`);
      
      // Thông báo thành công
      toast({
        title: 'Thành công',
        description: `Đã xóa user "${userToDelete.name}" thành công`,
      });
      
      // Đóng dialog
      setDeleteDialogOpen(false);
      setUserToDelete(null);
      
      // Refresh lại danh sách users
      fetchUsser();
      
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Xóa user thất bại';
      
      toast({
        title: 'Lỗi',
        description: errorMessage,
        variant: 'destructive',
      });
      
      console.error('Error deleting user:', err);
    }
  };

  const getRoleBadge = (roleName: string) => {
    // Lấy màu badge dựa trên tên role
    const roleConfig: { [key: string]: { className: string; label: string } } = {
      'superadmin': { className: 'bg-purple-100 text-purple-800 hover:bg-purple-100', label: 'SuperAdmin' },
      'admin': { className: 'bg-blue-100 text-blue-800 hover:bg-blue-100', label: 'Admin' },
      'user': { className: 'bg-green-100 text-green-800 hover:bg-green-100', label: 'User' },
    };

    const normalizedRole = roleName.toLowerCase();
    const config = roleConfig[normalizedRole] || { className: 'bg-gray-100 text-gray-800 hover:bg-gray-100', label: roleName };
    
    return <Badge className={config.className}>{config.label}</Badge>;
  };


  const getStatusBadge = (status: string) => {
    return status === 'active'
      ? <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Hoạt động</Badge>
      : <Badge variant="outline" className="text-gray-600">Không hoạt động</Badge>;
  };

  // Lọc users
  const filteredUsers = users.filter((user: any) => 
    user.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Quản lý Users</h1>
            <p className="text-gray-500 mt-1">Quản lý tất cả người dùng trong hệ thống</p>
          </div>
          <div className="flex gap-2">
            <Button 
              variant="outline"
              onClick={fetchUsser}
              disabled={loading}
              className="flex items-center gap-2"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Tải lại'}
            </Button>
            <Button className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Thêm User
            </Button>
          </div>
        </div>

        {/* Search*/}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Tìm kiếm theo tên hoặc email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                  disabled={loading}
                />
              </div>
              <Button variant="outline" disabled={loading}>Lọc</Button>
            </div>
          </CardContent>
        </Card>

        {/* Loading State */}
        {loading && (
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <span className="ml-2 text-gray-600">Đang tải dữ liệu...</span>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Error State */}
        {error && !loading && (
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-center py-8 text-red-600">
                <AlertCircle className="h-8 w-8" />
                <span className="ml-2">{error}</span>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Users Table */}
        {!loading && !error && (
        <Card>
          <CardHeader>
            <CardTitle>Danh sách Users ({filteredUsers.length})</CardTitle>
            <CardDescription>Tổng quan tất cả người dùng đã đăng ký</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 font-semibold text-sm text-gray-600">ID</th>
                    <th className="text-left py-3 px-4 font-semibold text-sm text-gray-600">Tên</th>
                    <th className="text-left py-3 px-4 font-semibold text-sm text-gray-600">Email</th>
                    <th className="text-left py-3 px-4 font-semibold text-sm text-gray-600">Vai trò</th>
                    <th className="text-left py-3 px-4 font-semibold text-sm text-gray-600">Trạng thái</th>
                    <th className="text-left py-3 px-4 font-semibold text-sm text-gray-600">Ngày tham gia</th>
                    <th className="text-left py-3 px-4 font-semibold text-sm text-gray-600">Bookings</th>
                    <th className="text-right py-3 px-4 font-semibold text-sm text-gray-600">Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((user) => (
                    <tr key={user.id} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-4 text-sm">#{user.id}</td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center text-white font-semibold text-sm">
                            {user.name.charAt(0)}
                          </div>
                          <span className="font-medium text-sm">{user.name}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Mail className="h-4 w-4" />
                          {user.email}
                        </div>
                      </td>
                      <td className="py-3 px-4">{getRoleBadge(user.role_name || user.role)}</td>
                      <td className="py-3 px-4">{getStatusBadge(user.status)}</td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Calendar className="h-4 w-4" />
                          {user.joinDate}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-sm font-semibold">{user.bookings}</td>
                      <td className="py-3 px-4">
                        <div className="flex items-center justify-end gap-2">
                          <Button 
                            size="sm" 
                            variant="ghost" 
                            className="h-8 w-8 p-0"
                            onClick={() => handleEditClick(user)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button 
                            size="sm" 
                            variant="ghost" 
                            className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                            onClick={() => handleDeleteClick(user.id, user.name)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              
              {/* Empty State */}
              {filteredUsers.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <p>Không tìm thấy user nào</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
        )}

        {/* Dialog sửa user */}
        <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Chỉnh sửa User</DialogTitle>
              <DialogDescription>
                Cập nhật thông tin cho user <strong>"{userToEdit?.name}"</strong>
              </DialogDescription>
            </DialogHeader>
            
            <div className="grid gap-4 py-4">
              {/* Tên */}
              <div className="grid gap-2">
                <Label htmlFor="name">Tên</Label>
                <Input
                  id="name"
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  placeholder="Nhập tên..."
                />
              </div>
              
              {/* Email */}
              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={editForm.email}
                  onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                  placeholder="Nhập email..."
                />
              </div>
              
              {/* Vai trò */}
              <div className="grid gap-2">
                <Label htmlFor="role">Vai trò</Label>
                <Select value={editForm.role} onValueChange={(value) => setEditForm({ ...editForm, role: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Chọn vai trò" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="user">User</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              {/* Trạng thái */}
              <div className="grid gap-2">
                <Label htmlFor="status">Trạng thái</Label>
                <Select value={editForm.status} onValueChange={(value) => setEditForm({ ...editForm, status: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Chọn trạng thái" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Hoạt động</SelectItem>
                    <SelectItem value="inactive">Không hoạt động</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
                Hủy
              </Button>
              <Button onClick={confirmUpdateUser}>
                Lưu thay đổi
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Dialog xác nhận xóa */}
        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Xác nhận xóa user</AlertDialogTitle>
              <AlertDialogDescription>
                Bạn có chắc chắn muốn xóa user <strong>"{userToDelete?.name}"</strong>?
                <br />
                Hành động này không thể hoàn tác.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Hủy</AlertDialogCancel>
              <AlertDialogAction 
                onClick={confirmDeleteUser}
                className="bg-red-600 hover:bg-red-700"
              >
                Xóa
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </AdminLayout>
  );
};

export default AdminUsers;
