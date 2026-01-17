import AdminLayout from '@/components/layout/AdminLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Calendar, MapPin, DollarSign, TrendingUp, TrendingDown } from 'lucide-react';

const AdminDashboard = () => {
  // Dữ liệu tĩnh demo - sau này sẽ thay bằng API
  const stats = [
    {
      title: 'Tổng Users',
      value: '1,234',
      change: '+12%',
      trend: 'up',
      icon: Users,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
    },
    {
      title: 'Bookings Hôm Nay',
      value: '45',
      change: '+5%',
      trend: 'up',
      icon: Calendar,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
    },
    {
      title: 'Tổng Sân',
      value: '28',
      change: '+2',
      trend: 'up',
      icon: MapPin,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
    },
    {
      title: 'Doanh Thu Tháng',
      value: '125.5M',
      change: '-3%',
      trend: 'down',
      icon: DollarSign,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100',
    },
  ];

  const recentBookings = [
    { id: 1, user: 'Nguyễn Văn A', field: 'Sân A1', time: '14:00 - 16:00', date: '17/01/2026', status: 'confirmed' },
    { id: 2, user: 'Trần Thị B', field: 'Sân B2', time: '16:00 - 18:00', date: '17/01/2026', status: 'pending' },
    { id: 3, user: 'Lê Văn C', field: 'Sân C3', time: '18:00 - 20:00', date: '17/01/2026', status: 'confirmed' },
    { id: 4, user: 'Phạm Thị D', field: 'Sân A2', time: '20:00 - 22:00', date: '17/01/2026', status: 'cancelled' },
    { id: 5, user: 'Hoàng Văn E', field: 'Sân B1', time: '08:00 - 10:00', date: '18/01/2026', status: 'confirmed' },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'Đã xác nhận';
      case 'pending':
        return 'Chờ xác nhận';
      case 'cancelled':
        return 'Đã hủy';
      default:
        return status;
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-500 mt-1">Tổng quan hệ thống quản lý sân bóng</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            const TrendIcon = stat.trend === 'up' ? TrendingUp : TrendingDown;
            
            return (
              <Card key={index}>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600">
                    {stat.title}
                  </CardTitle>
                  <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                    <Icon className={`h-5 w-5 ${stat.color}`} />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stat.value}</div>
                  <div className="flex items-center mt-1">
                    <TrendIcon 
                      className={`h-4 w-4 mr-1 ${
                        stat.trend === 'up' ? 'text-green-600' : 'text-red-600'
                      }`} 
                    />
                    <span 
                      className={`text-sm ${
                        stat.trend === 'up' ? 'text-green-600' : 'text-red-600'
                      }`}
                    >
                      {stat.change}
                    </span>
                    <span className="text-sm text-gray-500 ml-1">so với tháng trước</span>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Recent Bookings Table */}
        <Card>
          <CardHeader>
            <CardTitle>Đặt Sân Gần Đây</CardTitle>
            <CardDescription>Danh sách các booking mới nhất trong hệ thống</CardDescription>
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
                    <th className="text-left py-3 px-4 font-semibold text-sm text-gray-600">Trạng thái</th>
                  </tr>
                </thead>
                <tbody>
                  {recentBookings.map((booking) => (
                    <tr key={booking.id} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-4 text-sm">#{booking.id}</td>
                      <td className="py-3 px-4 text-sm font-medium">{booking.user}</td>
                      <td className="py-3 px-4 text-sm">{booking.field}</td>
                      <td className="py-3 px-4 text-sm">{booking.date}</td>
                      <td className="py-3 px-4 text-sm">{booking.time}</td>
                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(booking.status)}`}>
                          {getStatusText(booking.status)}
                        </span>
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

export default AdminDashboard;
