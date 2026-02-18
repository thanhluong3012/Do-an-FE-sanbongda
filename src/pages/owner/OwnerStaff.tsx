import RoleBasedLayout from '@/components/layout/RoleBasedLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useEffect, useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { getStaffs, createStaff, updateStaff, deleteStaff } from '@/services/staffService';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { UserPlus, Mail, Search, Edit, Trash2, UserCog, Loader2, AlertCircle } from 'lucide-react';

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
  const [selectedPosition, setSelectedPosition] = useState<string>('all');
  
  const [formData, setFormData] = useState({
    user_id: 0,
    position: '',
    salary: '',
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
        user_id: staffMember.user_id,
        position: staffMember.position || '',
        salary: staffMember.salary?.toString() || '',
      });
    } else {
      setEditingStaff(null);
      setFormData({
        user_id: 0,
        position: '',
        salary: '',
      });
    }
    setDialogOpen(true);
  };

  const handleSubmit = async () => {
    try {
      const submitData = {
        user_id: formData.user_id,
        position: formData.position || undefined,
        salary: formData.salary ? parseFloat(formData.salary) : undefined,
      };

      if (editingStaff) {
        await updateStaff(editingStaff.id, submitData);
        toast({
          title: 'Thành công',
          description: 'Đã cập nhật thông tin nhân viên',
        });
      } else {
        await createStaff(submitData as any);
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

  // Lọc staff theo search và position
  const filteredStaff = staff.filter((staffMember) => {
    const matchesSearch = 
      staffMember.user?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      staffMember.user?.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      staffMember.position?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesPosition = selectedPosition === 'all' || staffMember.position === selectedPosition;
    
    return matchesSearch && matchesPosition;
  });

  // Lấy danh sách unique positions
  const uniquePositions = Array.from(new Set(staff.map(s => s.position).filter(Boolean)));

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

        {/* Search and Filter */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Tìm kiếm theo tên, email hoặc chức vụ..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                  disabled={loading}
                />
              </div>
              <Select value={selectedPosition} onValueChange={setSelectedPosition} disabled={loading}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Lọc theo chức vụ" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả chức vụ</SelectItem>
                  {uniquePositions.map((position) => (
                    <SelectItem key={position} value={position || ''}>
                      {position || 'Chưa có chức vụ'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
                          <Badge className="bg-blue-100 text-blue-800">
                            {staffMember.position || 'Nhân viên'}
                          </Badge>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-gray-600">
                          <div className="flex items-center gap-2">
                            <Mail className="w-4 h-4" />
                            <span>{staffMember.user?.email || 'N/A'}</span>
                          </div>
                          {staffMember.salary && (
                            <div className="flex items-center gap-2">
                              <UserCog className="w-4 h-4" />
                              <span>Lương: {staffMember.salary.toLocaleString('vi-VN')} VNĐ</span>
                            </div>
                          )}
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
                  ? 'Cập nhật thông tin nhân viên (chức vụ, lương)' 
                  : 'Nhập ID user để thêm làm nhân viên. User phải tồn tại trong hệ thống.'
                }
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              {!editingStaff && (
                <div>
                  <Label htmlFor="user_id">User ID</Label>
                  <Input
                    id="user_id"
                    type="number"
                    value={formData.user_id || ''}
                    onChange={(e) => setFormData({ ...formData, user_id: parseInt(e.target.value) || 0 })}
                    placeholder="Nhập ID của user"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    ID của user muốn thêm làm nhân viên
                  </p>
                </div>
              )}
              {editingStaff && (
                <div>
                  <Label>Nhân viên</Label>
                  <Input
                    value={editingStaff.user?.name || 'N/A'}
                    disabled
                    className="bg-gray-50"
                  />
                </div>
              )}
              <div>
                <Label htmlFor="position">Chức vụ</Label>
                <Input
                  id="position"
                  value={formData.position}
                  onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                  placeholder="VD: Quản lý sân, Thu ngân..."
                />
              </div>
              <div>
                <Label htmlFor="salary">Lương (VNĐ)</Label>
                <Input
                  id="salary"
                  type="number"
                  value={formData.salary}
                  onChange={(e) => setFormData({ ...formData, salary: e.target.value })}
                  placeholder="Nhập mức lương"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                Hủy
              </Button>
              <Button onClick={handleSubmit} disabled={!editingStaff && !formData.user_id}>
                {editingStaff ? 'Cập nhật' : 'Thêm mới'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </RoleBasedLayout>
  );
};

export default OwnerStaff;
