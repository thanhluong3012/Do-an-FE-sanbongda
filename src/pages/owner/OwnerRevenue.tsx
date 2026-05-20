import { useState, useEffect } from 'react';
import RoleBasedLayout from '@/components/layout/RoleBasedLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AlertCircle, RefreshCw, DollarSign, TrendingUp, Calendar, BarChart3, User } from 'lucide-react';
import { paymentService, PaymentStatistics } from '@/services/paymentService';
import { bookingService, Booking } from '@/services/bookingService';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';

const OwnerRevenue = () => {
  const [stats, setStats] = useState<PaymentStatistics | null>(null);
  const [paidBookings, setPaidBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  const normalizeStats = (data: PaymentStatistics | null): PaymentStatistics | null => {
    if (!data) return null;

    return {
      ...data,
      total_bookings: data.total_bookings ?? 0,
      pending_payment: data.pending_payment ?? 0,
      pending_with_bill: data.pending_with_bill ?? 0,
      paid: data.paid ?? 0,
      failed: data.failed ?? 0,
      total_revenue: data.total_revenue ?? 0,
      pending_revenue: data.pending_revenue ?? 0,
      by_payment_method: {
        cash: data.by_payment_method?.cash ?? 0,
        transfer: data.by_payment_method?.transfer ?? 0,
      },
      by_field: Array.isArray(data.by_field) ? data.by_field : [],
      by_booking_type: {
        tournament: {
          total_bookings: data.by_booking_type?.tournament?.total_bookings ?? 0,
          revenue: data.by_booking_type?.tournament?.revenue ?? 0,
        },
        regular: {
          total_bookings: data.by_booking_type?.regular?.total_bookings ?? 0,
          revenue: data.by_booking_type?.regular?.revenue ?? 0,
        },
      },
    };
  };

  const fetchRevenueData = async () => {
    setLoading(true);
    try {
      const [statsData, bookingsData] = await Promise.all([
        paymentService.getPaymentStatistics(),
        bookingService.getPaidBookingsWithDetails()
      ]);
      setStats(normalizeStats(statsData));
      setPaidBookings(bookingsData);
    } catch (error) {
      console.error('Failed to fetch revenue data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRevenueData();
  }, []);

  const formatCurrency = (amount: number | string) => {
    const num = typeof amount === 'string' ? parseFloat(amount) : amount;
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(num);
  };

  const toNumber = (value: number | string | undefined | null) => {
    if (value === undefined || value === null) return 0;
    if (typeof value === 'number') return value;
    const parsed = parseFloat(value);
    return Number.isNaN(parsed) ? 0 : parsed;
  };

  if (loading) {
    return (
      <RoleBasedLayout>
        <div className="text-center py-12">
          <RefreshCw className="w-8 h-8 text-gray-400 mx-auto mb-4 animate-spin" />
          <p className="text-muted-foreground">Đang tải dữ liệu...</p>
        </div>
      </RoleBasedLayout>
    );
  }

  if (!stats) {
    return (
      <RoleBasedLayout>
        <div className="text-center py-12">
          <p className="text-muted-foreground mb-4">Không thể tải dữ liệu thống kê</p>
          <Button onClick={fetchRevenueData} variant="outline" className="gap-2">
            <RefreshCw className="w-4 h-4" />
            Thử lại
          </Button>
        </div>
      </RoleBasedLayout>
    );
  }

  const totalRevenue = typeof stats.total_revenue === 'string' 
    ? parseFloat(stats.total_revenue) 
    : stats.total_revenue;

  return (
    <RoleBasedLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Báo Cáo Doanh Thu</h1>
            <p className="text-gray-500 mt-1">Theo dõi doanh thu và hiệu suất kinh doanh</p>
          </div>
          <Button onClick={fetchRevenueData} variant="outline" className="gap-2">
            <RefreshCw className="w-4 h-4" />
            Làm mới
          </Button>
        </div>

        {/* Revenue Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Total Revenue */}
          <Card className="border-green-200 bg-green-50">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-green-700 font-medium">Tổng Doanh Thu</p>
                  <p className="text-2xl font-bold text-green-900 mt-1">
                    {formatCurrency(totalRevenue)}
                  </p>
                </div>
                <DollarSign className="w-10 h-10 text-green-300" />
              </div>
              <p className="text-xs text-green-600 mt-2">
                Từ {stats.paid} booking đã thanh toán
              </p>
            </CardContent>
          </Card>

          {/* Pending Revenue */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Doanh Thu Chờ Thu</p>
                  <p className="text-2xl font-bold text-orange-600 mt-1">
                    {formatCurrency(stats.pending_revenue)}
                  </p>
                </div>
                <Calendar className="w-10 h-10 text-orange-200" />
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                {stats.pending_payment} booking chưa thanh toán
              </p>
            </CardContent>
          </Card>

          {/* Total Bookings */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Tổng Booking</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">
                    {stats.total_bookings}
                  </p>
                </div>
                <BarChart3 className="w-10 h-10 text-gray-200" />
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Tất cả đặt sân
              </p>
            </CardContent>
          </Card>

          {/* Success Rate */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Tỷ Lệ Thành Công</p>
                  <p className="text-2xl font-bold text-blue-600 mt-1">
                    {stats.total_bookings > 0 
                      ? `${((stats.paid / stats.total_bookings) * 100).toFixed(1)}%`
                      : '0%'
                    }
                  </p>
                </div>
                <TrendingUp className="w-10 h-10 text-blue-200" />
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                {stats.paid}/{stats.total_bookings} booking thành công
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Revenue Breakdown */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Booking Types Revenue */}
          <Card>
            <CardHeader>
              <CardTitle>Doanh Thu Theo Loại Booking</CardTitle>
              <CardDescription>Phân tích doanh thu từ giải đấu và đặt sân thường</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-purple-50 rounded-lg">
                <div>
                  <p className="font-semibold text-purple-900">🏆 Giải Đấu</p>
                  <p className="text-2xl font-bold text-purple-600 mt-1">
                    {formatCurrency(stats.by_booking_type?.tournament?.revenue ?? 0)}
                  </p>
                </div>
                <Badge variant="secondary" className="text-lg px-3 py-1">
                  {stats.by_booking_type?.tournament?.total_bookings ?? 0} booking
                </Badge>
              </div>

              <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
                <div>
                  <p className="font-semibold text-blue-900">⚽ Đặt Sân Thường</p>
                  <p className="text-2xl font-bold text-blue-600 mt-1">
                    {formatCurrency(stats.by_booking_type?.regular?.revenue ?? 0)}
                  </p>
                </div>
                <Badge variant="secondary" className="text-lg px-3 py-1">
                  {stats.by_booking_type?.regular?.total_bookings ?? 0} booking
                </Badge>
              </div>

              <div className="pt-4 border-t">
                <div className="flex justify-between items-center">
                  <p className="text-sm text-muted-foreground">Tổng cộng:</p>
                  <p className="text-xl font-bold">{formatCurrency(totalRevenue)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Payment Methods */}
          <Card>
            <CardHeader>
              <CardTitle>Phương Thức Thanh Toán</CardTitle>
              <CardDescription>Phân bố theo cách thức thanh toán</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
                <div>
                  <p className="font-semibold text-green-900">🏦 Chuyển Khoản</p>
                  <p className="text-sm text-green-700 mt-1">
                    {stats.by_payment_method.transfer > 0 && stats.paid > 0
                      ? `${((stats.by_payment_method.transfer / stats.paid) * 100).toFixed(1)}%`
                      : '0%'
                    } của tổng số
                  </p>
                </div>
                <Badge variant="default" className="text-lg px-3 py-1">
                  {stats.by_payment_method.transfer} booking
                </Badge>
              </div>

              <div className="flex items-center justify-between p-4 bg-yellow-50 rounded-lg">
                <div>
                  <p className="font-semibold text-yellow-900">💵 Tiền Mặt</p>
                  <p className="text-sm text-yellow-700 mt-1">
                    {stats.by_payment_method.cash > 0 && stats.paid > 0
                      ? `${((stats.by_payment_method.cash / stats.paid) * 100).toFixed(1)}%`
                      : '0%'
                    } của tổng số
                  </p>
                </div>
                <Badge variant="secondary" className="text-lg px-3 py-1">
                  {stats.by_payment_method.cash} booking
                </Badge>
              </div>

              <div className="pt-4 border-t">
                <div className="flex justify-between items-center">
                  <p className="text-sm text-muted-foreground">Tổng booking đã thanh toán:</p>
                  <p className="text-xl font-bold">{stats.paid}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Field Revenue Table */}
        <Card>
          <CardHeader>
            <CardTitle>Doanh Thu Theo Sân</CardTitle>
            <CardDescription>Chi tiết doanh thu và tình trạng booking của từng sân</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 font-semibold text-gray-900">Tên Sân</th>
                    <th className="text-center py-3 px-4 font-semibold text-gray-900">Tổng Booking</th>
                    <th className="text-center py-3 px-4 font-semibold text-gray-900">Đã Thanh Toán</th>
                    <th className="text-center py-3 px-4 font-semibold text-gray-900">Chờ Xử Lý</th>
                    <th className="text-right py-3 px-4 font-semibold text-gray-900">Doanh Thu</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.by_field.map((field, index) => (
                    <tr key={field.field_id} className={index % 2 === 0 ? 'bg-gray-50' : ''}>
                      <td className="py-3 px-4 font-medium">
                        {field.field_name || `Sân #${field.field_id}`}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <Badge variant="outline">{field.total_bookings}</Badge>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <Badge variant="default" className="bg-green-600">{field.paid_count}</Badge>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <Badge variant="secondary">{field.pending_count}</Badge>
                      </td>
                      <td className="py-3 px-4 text-right font-semibold text-green-700">
                        {formatCurrency(field.revenue)}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="border-t-2 border-gray-300 bg-gray-100">
                  <tr>
                    <td className="py-3 px-4 font-bold text-gray-900">TỔNG CỘNG</td>
                    <td className="py-3 px-4 text-center">
                      <Badge variant="outline" className="font-bold">{stats.total_bookings}</Badge>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <Badge variant="default" className="bg-green-600 font-bold">{stats.paid}</Badge>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <Badge variant="secondary" className="font-bold">{stats.pending_payment}</Badge>
                    </td>
                    <td className="py-3 px-4 text-right font-bold text-green-700 text-lg">
                      {formatCurrency(totalRevenue)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Paid Bookings Details Table */}
        <Card>
          <CardHeader>
            <CardTitle>Chi Tiết Booking Đã Thanh Toán</CardTitle>
            <CardDescription>Danh sách các booking đã xác nhận thanh toán và nhân viên xử lý</CardDescription>
          </CardHeader>
          <CardContent>
            {paidBookings.length === 0 ? (
              <div className="text-center py-8">
                <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-muted-foreground">Chưa có booking nào được thanh toán</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4 font-semibold text-gray-900">Mã Booking</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-900">Sân</th>
                      <th className="text-center py-3 px-4 font-semibold text-gray-900">Ngày Đặt</th>
                      <th className="text-center py-3 px-4 font-semibold text-gray-900">Giờ</th>
                      <th className="text-center py-3 px-4 font-semibold text-gray-900">Loại</th>
                      <th className="text-center py-3 px-4 font-semibold text-gray-900">PT Thanh Toán</th>
                      <th className="text-right py-3 px-4 font-semibold text-gray-900">Số Tiền</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-900">Xác Nhận Bởi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paidBookings.map((booking, index) => (
                      <tr key={booking.id} className={index % 2 === 0 ? 'bg-gray-50' : ''}>
                        <td className="py-3 px-4 font-mono text-sm">
                          #{booking.id}
                        </td>
                        <td className="py-3 px-4">
                          <div>
                            <p className="font-medium">{booking.field_name || `Sân #${booking.field_id}`}</p>
                            {booking.field_cluster_name && (
                              <p className="text-xs text-muted-foreground">{booking.field_cluster_name}</p>
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-4 text-center">
                          {booking.booking_date && format(new Date(booking.booking_date), 'dd/MM/yyyy', { locale: vi })}
                        </td>
                        <td className="py-3 px-4 text-center text-sm">
                          {booking.start_time} - {booking.end_time}
                        </td>
                        <td className="py-3 px-4 text-center">
                          {booking.booking_type === 'tournament' ? (
                            <Badge variant="secondary" className="bg-purple-100 text-purple-800">
                              🏆 Giải đấu
                            </Badge>
                          ) : (
                            <Badge variant="outline">⚽ Thường</Badge>
                          )}
                        </td>
                        <td className="py-3 px-4 text-center">
                          {booking.payment_method === 'transfer' ? (
                            <Badge variant="default" className="bg-blue-600">
                              🏦 CK
                            </Badge>
                          ) : (
                            <Badge variant="secondary">
                              💵 TM
                            </Badge>
                          )}
                        </td>
                        <td className="py-3 px-4 text-right font-semibold text-green-700">
                          {formatCurrency(booking.total_price)}
                        </td>
                        <td className="py-3 px-4">
                          {booking.confirmed_by ? (
                            <div className="flex items-center gap-2">
                              <User className="w-4 h-4 text-blue-600" />
                              <div>
                                <p className="font-medium text-sm">{booking.confirmed_by.name}</p>
                                <p className="text-xs text-muted-foreground capitalize">
                                  {booking.confirmed_by.role === 'owner' ? 'Chủ sân' : 
                                   booking.confirmed_by.role === 'staff' ? 'Nhân viên' : 
                                   booking.confirmed_by.role}
                                </p>
                              </div>
                            </div>
                          ) : (
                            <span className="text-sm text-muted-foreground italic">Chưa có thông tin</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="border-t-2 border-gray-300 bg-gray-100">
                    <tr>
                      <td colSpan={6} className="py-3 px-4 font-bold text-gray-900 text-right">
                        TỔNG CỘNG ({paidBookings.length} booking):
                      </td>
                      <td className="py-3 px-4 text-right font-bold text-green-700 text-lg">
                        {formatCurrency(paidBookings.reduce((sum, b) => sum + toNumber(b.total_price), 0))}
                      </td>
                      <td></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </RoleBasedLayout>
  );
};

export default OwnerRevenue;
