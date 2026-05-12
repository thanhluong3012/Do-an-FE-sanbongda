import RoleBasedLayout from '@/components/layout/RoleBasedLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  DollarSign, TrendingUp, Clock, CheckCircle2, XCircle, 
  CreditCard, Wallet, Trophy, Calendar, Loader2, RefreshCw,
  BarChart3, MapPin
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { paymentService, PaymentStatistics } from '@/services/paymentService';
import { Button } from '@/components/ui/button';

const OwnerDashboard = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any | null>(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const data = await paymentService.getPaymentStatistics();
      
      // Normalize response data to ensure consistent structure
      const normalizedData = {
        ...data,
        // Ensure by_payment_method has defaults
        by_payment_method: {
          cash: data.by_payment_method?.cash ?? 0,
          transfer: data.by_payment_method?.transfer ?? 0
        },
        // Normalize by_booking_type: convert array to object with defaults
        by_booking_type: Array.isArray(data.by_booking_type) 
          ? { tournament: { total_bookings: 0, revenue: 0 }, regular: { total_bookings: 0, revenue: 0 } }
          : {
              tournament: data.by_booking_type?.tournament || { total_bookings: 0, revenue: 0 },
              regular: data.by_booking_type?.regular || { total_bookings: 0, revenue: 0 }
            },
        // Ensure by_field is an array
        by_field: Array.isArray(data.by_field) ? data.by_field : []
      };
      
      setStats(normalizedData);
    } catch (error: any) {
      console.error('Error fetching dashboard data:', error);
      toast({
        title: 'Lỗi',
        description: 'Không thể tải dữ liệu thống kê',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number | string) => {
    const num = typeof amount === 'string' ? parseFloat(amount) : amount;
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(num);
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('vi-VN').format(num);
  };

  if (loading) {
    return (
      <RoleBasedLayout>
        <div className="flex items-center justify-center h-96">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </RoleBasedLayout>
    );
  }

  if (!stats) {
    return (
      <RoleBasedLayout>
        <div className="text-center py-12">
          <p className="text-muted-foreground mb-4">Không thể tải dữ liệu thống kê</p>
          <Button onClick={fetchDashboardData} variant="outline" className="gap-2">
            <RefreshCw className="w-4 h-4" />
            Thử lại
          </Button>
        </div>
      </RoleBasedLayout>
    );
  }

  const totalRevenue = stats.total_revenue || 0;

  return (
    <RoleBasedLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Dashboard Doanh Thu</h1>
            <p className="text-gray-500 mt-1">Thống kê và quản lý thanh toán</p>
          </div>
          <Button onClick={fetchDashboardData} variant="outline" className="gap-2">
            <RefreshCw className="w-4 h-4" />
            Làm mới
          </Button>
        </div>

        {/* Overview Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Total Revenue */}
          <Card className="border-l-4 border-l-green-500">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                <DollarSign className="w-4 h-4" />
                Tổng Doanh Thu
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {formatCurrency(totalRevenue)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Từ {stats.paid} booking đã thanh toán
              </p>
            </CardContent>
          </Card>

          {/* Total Bookings */}
          <Card className="border-l-4 border-l-blue-500">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Tổng Booking
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {formatNumber(stats.total_bookings)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Tất cả các lượt đặt sân
              </p>
            </CardContent>
          </Card>

          {/* Pending Payment */}
          <Card className="border-l-4 border-l-yellow-500">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Chờ Thanh Toán
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">
                {formatNumber(stats.pending_payment)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {stats.pending_with_bill} đã có chứng từ
              </p>
            </CardContent>
          </Card>

          {/* Failed Payment */}
          <Card className="border-l-4 border-l-red-500">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                <XCircle className="w-4 h-4" />
                Thanh Toán Thất Bại
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {formatNumber(stats.failed)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Booking bị từ chối/lỗi
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Payment Method & Booking Type */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Payment Methods */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="w-5 h-5" />
                Phương Thức Thanh Toán
              </CardTitle>
              <CardDescription>Phân loại theo hình thức thanh toán</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <CreditCard className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-medium">Chuyển khoản</p>
                    <p className="text-sm text-muted-foreground">Transfer</p>
                  </div>
                </div>
                <Badge variant="secondary" className="text-lg px-4 py-1">
                  {formatNumber(stats.by_payment_method.transfer)}
                </Badge>
              </div>
              
              <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <Wallet className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <p className="font-medium">Tiền mặt</p>
                    <p className="text-sm text-muted-foreground">Cash</p>
                  </div>
                </div>
                <Badge variant="secondary" className="text-lg px-4 py-1">
                  {formatNumber(stats.by_payment_method.cash)}
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Booking Types */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5" />
                Loại Booking
              </CardTitle>
              <CardDescription>Phân loại theo loại đặt sân</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-purple-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <Trophy className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="font-medium">Giải đấu</p>
                    <p className="text-sm text-green-600 font-semibold">
                      {formatCurrency(stats.by_booking_type.tournament?.revenue ?? 0)}
                    </p>
                  </div>
                </div>
                <Badge variant="secondary" className="text-lg px-4 py-1">
                  {formatNumber(stats.by_booking_type.tournament?.total_bookings ?? 0)}
                </Badge>
              </div>
              
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gray-100 rounded-lg">
                    <Calendar className="w-5 h-5 text-gray-600" />
                  </div>
                  <div>
                    <p className="font-medium">Đặt sân thường</p>
                    <p className="text-sm text-green-600 font-semibold">
                      {formatCurrency(stats.by_booking_type.regular?.revenue ?? 0)}
                    </p>
                  </div>
                </div>
                <Badge variant="secondary" className="text-lg px-4 py-1">
                  {formatNumber(stats.by_booking_type.regular?.total_bookings ?? 0)}
                </Badge>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Field Statistics */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="w-5 h-5" />
              Thống Kê Theo Sân
            </CardTitle>
            <CardDescription>Doanh thu và booking từng sân bóng</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-muted/50 border-b">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Sân</th>
                    <th className="px-4 py-3 text-center text-sm font-medium text-gray-600">Tổng Booking</th>
                    <th className="px-4 py-3 text-center text-sm font-medium text-gray-600">Đã Thanh Toán</th>
                    <th className="px-4 py-3 text-center text-sm font-medium text-gray-600">Chờ Xử Lý</th>
                    <th className="px-4 py-3 text-right text-sm font-medium text-gray-600">Doanh Thu</th>
                    <th className="px-4 py-3 text-right text-sm font-medium text-gray-600">Chờ Thu</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {stats.by_field && stats.by_field.length > 0 ? (
                    stats.by_field.map((field) => (
                      <tr key={field.field_id} className="hover:bg-muted/30">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <MapPin className="w-4 h-4 text-primary" />
                            <span className="font-medium">
                              {field.field_name || `Sân #${field.field_id}`}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <Badge variant="outline">{formatNumber(field.total_bookings)}</Badge>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <Badge className="bg-green-100 text-green-800">
                            <CheckCircle2 className="w-3 h-3 mr-1" />
                            {formatNumber(field.paid_count)}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <Badge className="bg-yellow-100 text-yellow-800">
                            <Clock className="w-3 h-3 mr-1" />
                            {formatNumber(field.pending_count)}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-right font-semibold text-green-600">
                          {formatCurrency(field.revenue ?? 0)}
                        </td>
                        <td className="px-4 py-3 text-right text-muted-foreground">
                          {formatCurrency(field.pending_revenue ?? 0)}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                        Chưa có dữ liệu booking theo sân
                      </td>
                    </tr>
                  )}
                </tbody>
                <tfoot className="bg-muted/50 border-t-2 font-bold">
                  <tr>
                    <td className="px-4 py-3">TỔNG CỘNG</td>
                    <td className="px-4 py-3 text-center">
                      {formatNumber(stats.total_bookings)}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {formatNumber(stats.paid)}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {formatNumber(stats.pending_payment)}
                    </td>
                    <td className="px-4 py-3 text-right text-green-600">
                      {formatCurrency(totalRevenue)}
                    </td>
                    <td className="px-4 py-3 text-right text-yellow-600">
                      {formatCurrency(stats.pending_revenue ?? 0)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </RoleBasedLayout>
  );
};

export default OwnerDashboard;
