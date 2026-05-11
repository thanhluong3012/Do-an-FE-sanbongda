import RoleBasedLayout from '@/components/layout/RoleBasedLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useEffect, useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { getStaffs, createStaffWithUser, updateStaff, deleteStaff } from '@/services/staffService';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { UserPlus, Mail, Phone, Search, Edit, Trash2, UserCog, Loader2, AlertCircle, Lock, CreditCard } from 'lucide-react';

interface Staff {
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
  created_at: string;
}

const OwnerStaff = () => {
  const { toast } = useToast();
  const [staff, setStaff] = useState<Staff[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState<Staff | null>(null);
  
  // Filter states
  const [searchQuery, setSearchQuery] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    code_id: '',
  });

  useEffect(() => {
    fetchStaff();
  }, []);

  const fetchStaff = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await getStaffs();
      const staffData = response.data || response;
      
      console.log('Staff data:', staffData);
      setStaff(staffData);
      
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Không thể tải danh sách nhân viên';
      setError(errorMessage);
      console.error('Error fetching staff:', error);
      
      toast({
        title: 'Lỗi',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (staffMember?: Staff) => {
    if (staffMember) {
      setEditingStaff(staffMember);
      setFormData({
        name: staffMember.user?.name || '',
        email: staffMember.user?.email || '',
        phone: '',
        password: '',
        code_id: '',
      });
    } else {
      setEditingStaff(null);
      setFormData({
        name: '',
        email: '',
        phone: '',
        password: '',
        code_id: '',
      });
    }
    setDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (!editingStaff) {
      if (!formData.name.trim() || !formData.email.trim() || !formData.phone.trim() || !formData.password.trim() || !formData.code_id.trim()) {
        toast({
          title: 'Thiếu thông tin',
          description: 'Vui lòng điền đầy đủ tên, email, số điện thoại, mật khẩu và CCCD.',
          variant: 'destructive',
        });
        return;
      }
    }

    try {
      if (editingStaff) {
        const updateData: any = {
          name: formData.name.trim() || undefined,
          email: formData.email.trim() || undefined,
          phone: formData.phone.trim() || undefined,
        };
        if (formData.password.trim()) {
          updateData.password = formData.password;
        }
        await updateStaff(editingStaff.id, updateData);
        toast({
          title: 'Thành công',
          description: 'Đã cập nhật thông tin nhân viên',
        });
      } else {
        await createStaffWithUser({
          name: formData.name.trim(),
          email: formData.email.trim(),
          phone: formData.phone.trim(),
          password: formData.password,
          code_id: formData.code_id.trim(),
        });
        toast({
          title: 'Thành công',
          description: 'Đã thêm nhân viên mới',
        });
      }
      
      fetchStaff();
      setDialogOpen(false);
      
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 
        (editingStaff ? 'Không thể cập nhật nhân viên' : 'Không thể thêm nhân viên');
      
      toast({
        title: 'Lỗi',
        description: errorMessage,
        variant: 'destructive',
      });
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Bạn có chắc chắn muốn xóa nhân viên này?')) return;
    
    try {
      await deleteStaff(id);
      toast({
        title: 'Thành công',
        description: 'Đã xóa nhân viên',
      });
      fetchStaff();
      
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Không thể xóa nhân viên';
      
      toast({
        title: 'Lỗi',
        description: errorMessage,
        variant: 'destructive',
      });
    }
  };

  // Lọc staff theo search
  const filteredStaff = staff.filter((staffMember) => {
    return (
      staffMember.user?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      staffMember.user?.email?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  return (
    <RoleBasedLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Quản Lý Nhân Viên</h1>
            <p className="text-gray-500 mt-1">
              Quản lý nhân viên làm việc tại các sân bóng của bạn
            </p>
          </div>
          <Button onClick={() => handleOpenDialog()}>
            <UserPlus className="w-4 h-4 mr-2" />
            Thêm nhân viên
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Tổng nhân viên
              </CardTitle>
              <UserCog className="w-5 h-5 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{staff.length}</div>
              <p className="text-xs text-gray-500 mt-1">Nhân viên trong hệ thống</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Đang hiển thị
              </CardTitle>
              <UserCog className="w-5 h-5 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{filteredStaff.length}</div>
              <p className="text-xs text-gray-500 mt-1">Sau khi lọc</p>
            </CardContent>
          </Card>
        </div>

        {/* Search */}
        <Card>
          <CardContent className="pt-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Tìm kiếm theo tên hoặc email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
                disabled={loading}
              />
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
              <div className="text-center mt-4">
                <Button onClick={fetchStaff} variant="outline">
                  Thử lại
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Staff List */}
        {!loading && !error && (
        <Card>
          <CardHeader>
            <CardTitle>Danh sách nhân viên ({filteredStaff.length}/{staff.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {filteredStaff.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <AlertCircle className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                <p className="font-medium">
                  {staff.length === 0 ? 'Chưa có nhân viên nào' : 'Không tìm thấy nhân viên nào'}
                </p>
                <p className="text-sm mt-1">
                  {staff.length === 0 ? 'Nhấn "Thêm nhân viên" để bắt đầu' : 'Thử thay đổi bộ lọc'}
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredStaff.map((staffMember) => (
                  <div
                    key={staffMember.id}
                    className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-semibold">
                            {staffMember.user?.name || 'N/A'}
                          </h3>
                        </div>
                        
                        <div className="text-sm text-gray-600">
                          <div className="flex items-center gap-2">
                            <Mail className="w-4 h-4" />
                            <span>{staffMember.user?.email || 'N/A'}</span>
                          </div>
                        </div>
                        
                        <p className="text-xs text-gray-400 mt-2">
                          Thêm vào: {new Date(staffMember.created_at).toLocaleDateString('vi-VN')}
                        </p>
                      </div>

                      <div className="flex gap-2 ml-4">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleOpenDialog(staffMember)}
                        >
                          <Edit className="w-4 h-4 mr-1" />
                          Sửa
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDelete(staffMember.id)}
                        >
                          <Trash2 className="w-4 h-4 mr-1" />
                          Xóa
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
        )}

        {/* Add/Edit Dialog */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingStaff ? 'Cập nhật nhân viên' : 'Thêm nhân viên mới'}
              </DialogTitle>
              <DialogDescription>
                {editingStaff 
                  ? 'Cập nhật thông tin nhân viên' 
                  : 'Nhập thông tin để tạo tài khoản và thêm nhân viên mới vào hệ thống'
                }
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              {!editingStaff ? (
                <>
                  <div>
                    <Label htmlFor="name">Họ và tên <span className="text-red-500">*</span></Label>
                    <div className="relative mt-1">
                      <UserCog className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="Nguyễn Văn A"
                        className="pl-9"
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="email">Email <span className="text-red-500">*</span></Label>
                    <div className="relative mt-1">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        placeholder="nhanvien@example.com"
                        className="pl-9"
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="phone">Số điện thoại <span className="text-red-500">*</span></Label>
                    <div className="relative mt-1">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <Input
                        id="phone"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        placeholder="0901234567"
                        className="pl-9"
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="password">Mật khẩu <span className="text-red-500">*</span></Label>
                    <div className="relative mt-1">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <Input
                        id="password"
                        type="password"
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        placeholder="Nhập mật khẩu"
                        className="pl-9"
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="code_id">Căn cước công dân <span className="text-red-500">*</span></Label>
                    <div className="relative mt-1">
                      <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <Input
                        id="code_id"
                        value={formData.code_id}
                        onChange={(e) => setFormData({ ...formData, code_id: e.target.value })}
                        placeholder="012345678901"
                        className="pl-9"
                      />
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <Label htmlFor="edit-name">Họ và tên</Label>
                    <div className="relative mt-1">
                      <UserCog className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <Input
                        id="edit-name"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="Nguyễn Văn A"
                        className="pl-9"
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="edit-email">Email</Label>
                    <div className="relative mt-1">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <Input
                        id="edit-email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        placeholder="nhanvien@example.com"
                        className="pl-9"
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="edit-phone">Số điện thoại</Label>
                    <div className="relative mt-1">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <Input
                        id="edit-phone"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        placeholder="0901234567"
                        className="pl-9"
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="edit-password">Mật khẩu mới <span className="text-xs text-gray-400 font-normal">(để trống nếu không đổi)</span></Label>
                    <div className="relative mt-1">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <Input
                        id="edit-password"
                        type="password"
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        placeholder="Để trống nếu không đổi"
                        className="pl-9"
                      />
                    </div>
                  </div>
                </>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                Hủy
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={!editingStaff && (!formData.name || !formData.email || !formData.phone || !formData.password || !formData.code_id)}
              >
                {editingStaff ? 'Cập nhật' : 'Thêm nhân viên'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </RoleBasedLayout>
  );
};

export default OwnerStaff;
