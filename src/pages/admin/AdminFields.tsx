import AdminLayout from '@/components/layout/AdminLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Search, Plus, Edit, Trash2, MapPin, Star, Loader2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import { FieldFormDialog, type FieldFormData } from '@/components/FieldFormDialog';
import { useToast } from '@/hooks/use-toast';
import api from '@/lib/axios';

interface Field {
  id: number;
  name: string;
  type: string;
  location: string;
  price: string;
  image?: string;
  description?: string;
  status: 'available' | 'maintenance' | 'unavailable';
  rating?: number;
  bookings?: number;
}

const AdminFields = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingField, setEditingField] = useState<any>(null);
  const [fields, setFields] = useState<Field[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  // Fetch danh sách sân từ API
  useEffect(() => {
    fetchFields();
  }, []);

  const fetchFields = async () => {
    try {
      setIsLoading(true);
      const response = await api.get('/fields');
      setFields(response.data.data || response.data);
    } catch (error: any) {
      console.error('Fetch fields error:', error);
      toast({
        title: 'Lỗi!',
        description: error.response?.data?.message || 'Không thể tải danh sách sân',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'available':
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Sẵn sàng</Badge>;
      case 'maintenance':
        return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">Bảo trì</Badge>;
      case 'unavailable':
        return <Badge className="bg-red-100 text-red-800 hover:bg-red-100">Không khả dụng</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const formatPrice = (price: string | number) => {
    const priceNum = typeof price === 'string' ? parseFloat(price) : price;
    return new Intl.NumberFormat('vi-VN', { 
      style: 'currency', 
      currency: 'VND' 
    }).format(priceNum);
  };

  const filteredFields = fields.filter(field => 
    field.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    field.type.toLowerCase().includes(searchQuery.toLowerCase()) ||
    field.location.toLowerCase().includes(searchQuery.toLowerCase())
  );


  //Thêm
  const handleCreateField = async (data: FieldFormData) => {
    try {
      await api.post('/fields', data);
      toast({
        title: 'Thành công!',
        description: 'Đã thêm sân mới',
      });
      fetchFields();
    } catch (error: any) {
      console.error('Create field error:', error);
      toast({
        title: 'Lỗi!',
        description: error.response?.data?.message || 'Không thể thêm sân',
        variant: 'destructive',
      });
    }
  };

  //Update
  const handleEditField = async (data: FieldFormData) => {
    try {
      await api.put(`/fields/${editingField.id}`, data);
      toast({
        title: 'Thành công!',
        description: 'Đã cập nhật sân',
      });
      fetchFields();
    } catch (error: any) {
      console.error('Update field error:', error);
      toast({
        title: 'Lỗi!',
        description: error.response?.data?.message || 'Không thể cập nhật sân',
        variant: 'destructive',
      });
    }
  };

  //Delete
  const handleDeleteField = async (id: number) => {
    if (!confirm('Bạn có chắc muốn xóa sân này?')) return;
    
    try {
      await api.delete(`/fields/${id}`);
      toast({
        title: 'Thành công!',
        description: 'Đã xóa sân',
      });
      fetchFields();
    } catch (error: any) {
      console.error('Delete field error:', error);
      toast({
        title: 'Lỗi!',
        description: error.response?.data?.message || 'Không thể xóa sân',
        variant: 'destructive',
      });
    }
  };

  const openCreateDialog = () => {
    setEditingField(null);
    setIsDialogOpen(true);
  };

  const openEditDialog = (field: any) => {
    setEditingField(field);
    setIsDialogOpen(true);
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Quản lý Sân</h1>
            <p className="text-gray-500 mt-1">Quản lý tất cả sân bóng trong hệ thống</p>
          </div>
          <Button className="flex items-center gap-2" onClick={openCreateDialog}>
            <Plus className="h-4 w-4" />
            Thêm Sân Mới
          </Button>
        </div>

        {/* Search & Filter */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Tìm kiếm theo tên sân, loại hoặc địa điểm..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Button variant="outline">Lọc theo loại</Button>
              <Button variant="outline">Lọc theo trạng thái</Button>
            </div>
          </CardContent>
        </Card>

        {/* Fields Table */}
        <Card>
          <CardHeader>
            <CardTitle>Danh sách Sân ({filteredFields.length})</CardTitle>
            <CardDescription>Tổng quan tất cả sân bóng</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
                <span className="ml-3 text-gray-500">Đang tải...</span>
              </div>
            ) : filteredFields.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                Không có sân nào
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4 font-semibold text-sm text-gray-600">ID</th>
                      <th className="text-left py-3 px-4 font-semibold text-sm text-gray-600">Tên Sân</th>
                      <th className="text-left py-3 px-4 font-semibold text-sm text-gray-600">Loại</th>
                      <th className="text-left py-3 px-4 font-semibold text-sm text-gray-600">Địa điểm</th>
                      <th className="text-left py-3 px-4 font-semibold text-sm text-gray-600">Giá</th>
                      <th className="text-left py-3 px-4 font-semibold text-sm text-gray-600">Đánh giá</th>
                      <th className="text-left py-3 px-4 font-semibold text-sm text-gray-600">Bookings</th>
                      <th className="text-left py-3 px-4 font-semibold text-sm text-gray-600">Trạng thái</th>
                      <th className="text-right py-3 px-4 font-semibold text-sm text-gray-600">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredFields.map((field) => (
                      <tr key={field.id} className="border-b hover:bg-gray-50">
                        <td className="py-3 px-4 text-sm font-medium">#{field.id}</td>
                        <td className="py-3 px-4">
                          <span className="font-semibold text-sm text-blue-600">{field.name}</span>
                        </td>
                        <td className="py-3 px-4 text-sm">{field.type}</td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <MapPin className="h-4 w-4" />
                            {field.location}
                          </div>
                        </td>
                        <td className="py-3 px-4 text-sm font-semibold">{formatPrice(field.price)}</td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-1">
                            <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                            <span className="text-sm font-semibold">{field.rating}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-sm">{field.bookings}</td>
                        <td className="py-3 px-4">{getStatusBadge(field.status)}</td>
                        <td className="py-3 px-4">
                          <div className="flex items-center justify-end gap-2">
                            <Button 
                              size="sm" 
                              variant="ghost" 
                              className="h-8 w-8 p-0"
                              onClick={() => openEditDialog(field)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button 
                              size="sm" 
                              variant="ghost" 
                              className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                              onClick={() => handleDeleteField(field.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Dialog Form */}
        <FieldFormDialog
          open={isDialogOpen}
          onOpenChange={setIsDialogOpen}
          onSubmit={editingField ? handleEditField : handleCreateField}
          initialData={editingField}
          mode={editingField ? 'edit' : 'create'}
        />
      </div>
    </AdminLayout>
  );
};

export default AdminFields;
