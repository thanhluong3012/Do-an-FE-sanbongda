import RoleBasedLayout from '@/components/layout/RoleBasedLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { MapPin, Calendar, DollarSign, Users, TrendingUp } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useToast } from '@/hooks/use-toast';

const OwnerDashboard = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalFields: 0,
    todayBookings: 0,
    monthRevenue: 0,
    totalStaff: 0,
  });

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // TODO: Implement API calls khi backend có endpoint statistics
      // const response = await api.get('/owner/statistics');
      
      // Demo data - replace with real API
      setStats({
        totalFields: 8,
        todayBookings: 12,
        monthRevenue: 45500000,
        totalStaff: 5,
      });
    } catch (error: any) {
      console.error('Error fetching dashboard data:', error);
      toast({
        title: 'Lỗi',
        description: 'Không thể tải dữ liệu dashboard',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const statsCards = [
    {
      title: 'Sân Của Tôi',
      value: stats.totalFields,
      icon: MapPin,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
      description: 'Tổng số sân đang quản lý',
      link: '/owner/fields',
    },
    {
      title: 'Booking Hôm Nay',
      value: stats.todayBookings,
      icon: Calendar,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
      description: 'Lượt đặt sân hôm nay',
      link: '/owner/bookings',
    },
    {
      title: 'Doanh Thu Tháng',
      value: `${(stats.monthRevenue / 1000000).toFixed(1)}M VNĐ`,
      icon: DollarSign,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100',
      description: 'Tổng doanh thu tháng này',
      link: '/owner/revenue',
    },
    {
      title: 'Nhân Viên',
      value: stats.totalStaff,
      icon: Users,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
      description: 'Tổng số nhân viên',
      link: '/owner/staff',
    },
  ];

  const quickActions = [
    {
      title: 'Quản Lý Sân',
      description: 'Thêm, sửa, xóa sân bóng',
      icon: MapPin,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
      link: '/owner/fields',
    },
    {
      title: 'Quản Lý Booking',
      description: 'Xem và quản lý đặt sân',
      icon: Calendar,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
      link: '/owner/bookings',
    },
    {
      title: 'Quản Lý Nhân Viên',
      description: 'Quản lý danh sách nhân viên',
      icon: Users,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
      link: '/owner/staff',
    },
    {
      title: 'Thống Kê Doanh Thu',
      description: 'Xem báo cáo và thống kê',
      icon: TrendingUp,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100',
      link: '/owner/revenue',
    },
  ];

  if (loading) {
    return (
      <RoleBasedLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </RoleBasedLayout>
    );
  }

  return (
    <RoleBasedLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard Chủ Sân</h1>
          <p className="text-gray-500 mt-1">Quản lý sân bóng và nhân viên của bạn</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {statsCards.map((stat, index) => {
            const Icon = stat.icon;
            
            return (
              <a
                key={index}
                href={stat.link}
                className="block"
              >
                <Card className="hover:shadow-lg transition-shadow cursor-pointer">
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
              </a>
            );
          })}
        </div>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quản Lý Nhanh</CardTitle>
            <CardDescription>
              Truy cập nhanh các chức năng chính
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {quickActions.map((action, index) => {
                const Icon = action.icon;
                
                return (
                  <a
                    key={index}
                    href={action.link}
                    className="p-4 border border-gray-200 rounded-lg hover:border-blue-500 hover:shadow-md transition-all group"
                  >
                    <div className={`p-2 ${action.bgColor} rounded-lg w-fit mb-3 group-hover:scale-110 transition-transform`}>
                      <Icon className={`w-6 h-6 ${action.color}`} />
                    </div>
                    <h3 className="font-semibold text-gray-900 mb-1">{action.title}</h3>
                    <p className="text-sm text-gray-500">{action.description}</p>
                  </a>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </RoleBasedLayout>
  );
};

export default OwnerDashboard;

