import AdminLayout from '@/components/layout/AdminLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Search, Plus, Edit, Trash2, MapPin, Star } from 'lucide-react';
import { useState } from 'react';

const AdminFields = () => {
  const [searchQuery, setSearchQuery] = useState('');

  // Dữ liệu tĩnh demo - sau này sẽ thay bằng API
  const fields = [
    {
      id: 1,
      name: 'Sân A1',
      type: 'Sân 5 người',
      location: 'Quận 1, TP.HCM',
      price: '500.000đ/2h',
      status: 'available',
      rating: 4.5,
      bookings: 45,
    },
    {
      id: 2,
      name: 'Sân B2',
      type: 'Sân 7 người',
      location: 'Quận 2, TP.HCM',
      price: '700.000đ/2h',
      status: 'available',
      rating: 4.8,
      bookings: 62,
    },
    {
      id: 3,
      name: 'Sân C3',
      type: 'Sân 11 người',
      location: 'Quận 3, TP.HCM',
      price: '1.000.000đ/2h',
      status: 'maintenance',
      rating: 4.3,
      bookings: 38,
    },
    {
      id: 4,
      name: 'Sân A2',
      type: 'Sân 5 người',
      location: 'Quận 1, TP.HCM',
      price: '500.000đ/2h',
      status: 'available',
      rating: 4.6,
      bookings: 51,
    },
    {
      id: 5,
      name: 'Sân B1',
      type: 'Sân 7 người',
      location: 'Quận 4, TP.HCM',
      price: '650.000đ/2h',
      status: 'unavailable',
      rating: 4.2,
      bookings: 29,
    },
  ];

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

  const filteredFields = fields.filter(field => 
    field.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    field.type.toLowerCase().includes(searchQuery.toLowerCase()) ||
    field.location.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Quản lý Sân</h1>
            <p className="text-gray-500 mt-1">Quản lý tất cả sân bóng trong hệ thống</p>
          </div>
          <Button className="flex items-center gap-2">
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
                      <td className="py-3 px-4 text-sm font-semibold">{field.price}</td>
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
                          <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-red-600 hover:text-red-700">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default AdminFields;
