import RoleBasedLayout from '@/components/layout/RoleBasedLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { MapPin, Calendar, DollarSign, TrendingUp } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useToast } from '@/hooks/use-toast';

const StaffDashboard = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalFields: 0,
    todayBookings: 0,
    monthRevenue: 0,
  });

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // TODO: Implement API calls khi backend có endpoint statistics
      // const response = await api.get('/staff/statistics');
      
      // Demo data - replace with real API
      setStats({
        totalFields: 8,
        todayBookings: 12,
        monthRevenue: 45500000,
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
      title: 'Sân Quản Lý',
      value: stats.totalFields,
      icon: MapPin,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
      description: 'Số sân đang quản lý',
      link: '/staff/fields',
    },
    {
      title: 'Booking Hôm Nay',
      value: stats.todayBookings,
      icon: Calendar,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
      description: 'Lượt đặt sân hôm nay',
      link: '/staff/bookings',
    },
    {
      title: 'Doanh Thu Tháng',
      value: `${(stats.monthRevenue / 1000000).toFixed(1)}M ₫`,
      icon: DollarSign,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100',
      description: 'Tổng doanh thu tháng này',
      link: '/staff/revenue',
    },
  ];

  const quickActions = [
    {
      title: 'Quản Lý Sân',
      description: 'Xem và quản lý sân bóng',
      icon: MapPin,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
      link: '/staff/fields',
    },
    {
      title: 'Quản Lý Booking',
      description: 'Xem và xử lý đặt sân',
      icon: Calendar,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
      link: '/staff/bookings',
    },
    {
      title: 'Thống Kê Doanh Thu',
      description: 'Xem báo cáo và thống kê',
      icon: TrendingUp,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100',
      link: '/staff/revenue',
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
          <h1 className="text-3xl font-bold text-gray-900">Dashboard Nhân Viên</h1>
          <p className="text-gray-500 mt-1">Quản lý công việc hàng ngày</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
            <CardTitle>Công Việc Hôm Nay</CardTitle>
            <CardDescription>
              Truy cập nhanh các chức năng chính
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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

        {/* Work Instructions */}
        <Card>
          <CardHeader>
            <CardTitle>Hướng Dẫn Công Việc</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 text-sm text-gray-600">
              <div className="flex items-start space-x-2">
                <span className="font-semibold text-gray-900 min-w-[30px]">1.</span>
                <p>Kiểm tra và xác nhận các booking mới trong ngày</p>
              </div>
              <div className="flex items-start space-x-2">
                <span className="font-semibold text-gray-900 min-w-[30px]">2.</span>
                <p>Cập nhật tình trạng sân bóng (bảo trì, sẵn sàng)</p>
              </div>
              <div className="flex items-start space-x-2">
                <span className="font-semibold text-gray-900 min-w-[30px]">3.</span>
                <p>Xử lý thanh toán và xác nhận giao dịch</p>
              </div>
              <div className="flex items-start space-x-2">
                <span className="font-semibold text-gray-900 min-w-[30px]">4.</span>
                <p>Báo cáo doanh thu cuối ngày cho chủ sân</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </RoleBasedLayout>
  );
};

export default StaffDashboard;

