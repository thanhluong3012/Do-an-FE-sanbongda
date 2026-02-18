import AdminLayout from '@/components/layout/AdminLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, CheckCircle, XCircle, Clock } from 'lucide-react';
import { useEffect, useState } from 'react';
import { getUsers } from '@/services/userService';
import { getOwnerRegistrations } from '@/services/ownerRegistrationService';
import { useToast } from '@/hooks/use-toast';

const AdminDashboard = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalUsers: 0,
    pendingRegistrations: 0,
    approvedRegistrations: 0,
    rejectedRegistrations: 0,
  });

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Lấy danh sách users
      const usersResponse = await getUsers();
      const users = usersResponse.data || usersResponse;
      
      // Lấy danh sách yêu cầu đăng ký
      const registrationsResponse = await getOwnerRegistrations();
      const registrations = registrationsResponse.data || registrationsResponse;
      
      // Tính toán thống kê
      const pending = Array.isArray(registrations) 
        ? registrations.filter((r: any) => r.status === 'pending').length 
        : 0;
      const approved = Array.isArray(registrations) 
        ? registrations.filter((r: any) => r.status === 'approved').length 
        : 0;
      const rejected = Array.isArray(registrations) 
        ? registrations.filter((r: any) => r.status === 'rejected').length 
        : 0;
      
      setStats({
        totalUsers: Array.isArray(users) ? users.length : 0,
        pendingRegistrations: pending,
        approvedRegistrations: approved,
        rejectedRegistrations: rejected,
      });
    } catch (error: any) {
      console.error('Error fetching dashboard data:', error);
      toast({
        title: 'Lỗi',
        description: error.response?.data?.message || 'Không thể tải dữ liệu dashboard',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const statsCards = [
    {
      title: 'Tổng Users',
      value: stats.totalUsers,
      icon: Users,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
      description: 'Tổng số người dùng trong hệ thống',
    },
    {
      title: 'Yêu Cầu Chờ Duyệt',
      value: stats.pendingRegistrations,
      icon: Clock,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-100',
      description: 'Đăng ký chủ sân chờ phê duyệt',
    },
    {
      title: 'Đã Phê Duyệt',
      value: stats.approvedRegistrations,
      icon: CheckCircle,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
      description: 'Yêu cầu đã được chấp thuận',
    },
    {
      title: 'Đã Từ Chối',
      value: stats.rejectedRegistrations,
      icon: XCircle,
      color: 'text-red-600',
      bgColor: 'bg-red-100',
      description: 'Yêu cầu đã bị từ chối',
    },
  ];

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-500 mt-1">Quản lý người dùng và phê duyệt đăng ký chủ sân</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {statsCards.map((stat, index) => {
            const Icon = stat.icon;
            
            return (
              <Card key={index} className="hover:shadow-lg transition-shadow">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600">
                    {stat.title}
                  </CardTitle>
                  <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                    <Icon className={`w-5 h-5 ${stat.color}`} />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
                  <p className="text-xs text-gray-500 mt-1">{stat.description}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quản Lý Admin</CardTitle>
            <CardDescription>
              Các chức năng chính dành cho quản trị viên
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <a
                href="/admin/users"
                className="p-4 border border-gray-200 rounded-lg hover:border-blue-500 hover:shadow-md transition-all group"
              >
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-blue-100 rounded-lg group-hover:bg-blue-200 transition-colors">
                    <Users className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Quản Lý Users</h3>
                    <p className="text-sm text-gray-500">Xem và quản lý tất cả người dùng</p>
                  </div>
                </div>
              </a>

              <a
                href="/admin/owner-approvals"
                className="p-4 border border-gray-200 rounded-lg hover:border-yellow-500 hover:shadow-md transition-all group"
              >
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-yellow-100 rounded-lg group-hover:bg-yellow-200 transition-colors">
                    <Clock className="w-6 h-6 text-yellow-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Phê Duyệt Chủ Sân</h3>
                    <p className="text-sm text-gray-500">
                      Xử lý {stats.pendingRegistrations} yêu cầu chờ duyệt
                    </p>
                  </div>
                </div>
              </a>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default AdminDashboard;
