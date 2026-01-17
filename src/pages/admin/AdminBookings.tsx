import AdminLayout from '@/components/layout/AdminLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Search, Plus, Edit, Trash2, Calendar, Clock, User } from 'lucide-react';
import { useState } from 'react';

const AdminBookings = () => {
  const [searchQuery, setSearchQuery] = useState('');

  // Dữ liệu tĩnh demo - sau này sẽ thay bằng API
  const bookings = [
    {
      id: 1,
      user: 'Nguyễn Văn A',
      field: 'Sân A1',
      date: '17/01/2026',
      time: '14:00 - 16:00',
      status: 'confirmed',
      price: '500.000đ',
    },
    {
      id: 2,
      user: 'Trần Thị B',
      field: 'Sân B2',
      date: '17/01/2026',
      time: '16:00 - 18:00',
      status: 'pending',
      price: '450.000đ',
    },
    {
      id: 3,
      user: 'Lê Văn C',
      field: 'Sân C3',
      date: '18/01/2026',
      time: '18:00 - 20:00',
      status: 'confirmed',
      price: '600.000đ',
    },
    {
      id: 4,
      user: 'Phạm Thị D',
      field: 'Sân A2',
      date: '18/01/2026',
      time: '20:00 - 22:00',
      status: 'cancelled',
      price: '500.000đ',
    },
    {
      id: 5,
      user: 'Hoàng Văn E',
      field: 'Sân B1',
      date: '19/01/2026',
      time: '08:00 - 10:00',
      status: 'confirmed',
      price: '400.000đ',
    },
    {
      id: 6,
      user: 'Vũ Thị F',
      field: 'Sân C2',
      date: '19/01/2026',
      time: '10:00 - 12:00',
      status: 'pending',
      price: '550.000đ',
    },
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'confirmed':
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Đã xác nhận</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">Chờ xác nhận</Badge>;
      case 'cancelled':
        return <Badge className="bg-red-100 text-red-800 hover:bg-red-100">Đã hủy</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const filteredBookings = bookings.filter(booking => 
    booking.user.toLowerCase().includes(searchQuery.toLowerCase()) ||
    booking.field.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Quản lý Bookings</h1>
            <p className="text-gray-500 mt-1">Quản lý tất cả đặt sân trong hệ thống</p>
          </div>
          <Button className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Tạo Booking
          </Button>
        </div>

        {/* Search & Filter */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Tìm kiếm theo tên khách hàng hoặc sân..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Button variant="outline">Lọc theo ngày</Button>
              <Button variant="outline">Lọc theo trạng thái</Button>
            </div>
          </CardContent>
        </Card>

        {/* Bookings Table */}
        <Card>
          <CardHeader>
            <CardTitle>Danh sách Bookings ({filteredBookings.length})</CardTitle>
            <CardDescription>Tổng quan tất cả đặt sân</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 font-semibold text-sm text-gray-600">ID</th>
                    <th className="text-left py-3 px-4 font-semibold text-sm text-gray-600">Khách hàng</th>
                    <th className="text-left py-3 px-4 font-semibold text-sm text-gray-600">Sân</th>
                    <th className="text-left py-3 px-4 font-semibold text-sm text-gray-600">Ngày</th>
                    <th className="text-left py-3 px-4 font-semibold text-sm text-gray-600">Giờ</th>
                    <th className="text-left py-3 px-4 font-semibold text-sm text-gray-600">Giá</th>
                    <th className="text-left py-3 px-4 font-semibold text-sm text-gray-600">Trạng thái</th>
                    <th className="text-right py-3 px-4 font-semibold text-sm text-gray-600">Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredBookings.map((booking) => (
                    <tr key={booking.id} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-4 text-sm font-medium">#{booking.id}</td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2 text-sm">
                          <User className="h-4 w-4 text-gray-400" />
                          <span className="font-medium">{booking.user}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-sm font-semibold text-blue-600">
                        {booking.field}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Calendar className="h-4 w-4" />
                          {booking.date}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Clock className="h-4 w-4" />
                          {booking.time}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-sm font-semibold">{booking.price}</td>
                      <td className="py-3 px-4">{getStatusBadge(booking.status)}</td>
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

export default AdminBookings;
