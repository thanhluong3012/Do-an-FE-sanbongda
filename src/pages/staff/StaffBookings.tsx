import RoleBasedLayout from '@/components/layout/RoleBasedLayout';
import { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { bookingService, Booking } from '@/services/bookingService';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { AlertCircle, Calendar, Clock3, RefreshCw, Search, UserRound } from 'lucide-react';

const StaffBookings = () => {
  const { toast } = useToast();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedDate, setSelectedDate] = useState('');

  const loadBookings = async () => {
    setLoading(true);
    try {
      const data = await bookingService.getStaffBookings(selectedDate || undefined);

      const sorted = [...data].sort((a, b) => {
        const aCreated = a.created_at ? new Date(a.created_at).getTime() : 0;
        const bCreated = b.created_at ? new Date(b.created_at).getTime() : 0;
        if (aCreated !== bCreated) return bCreated - aCreated;

        const aSchedule = a.booking_date
          ? new Date(`${a.booking_date}T${a.start_time || '00:00:00'}`).getTime()
          : 0;
        const bSchedule = b.booking_date
          ? new Date(`${b.booking_date}T${b.start_time || '00:00:00'}`).getTime()
          : 0;

        if (aSchedule !== bSchedule) return bSchedule - aSchedule;
        return b.id - a.id;
      });

      setBookings(sorted);
    } catch (error) {
      console.error('Error loading staff bookings:', error);
      toast({
        title: 'Lỗi',
        description: 'Không thể tải danh sách booking của cụm sân',
        variant: 'destructive',
      });
      setBookings([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBookings();
  }, [selectedDate]);

  const filteredBookings = useMemo(() => {
    if (!search.trim()) return bookings;

    const keyword = search.toLowerCase();
    return bookings.filter((booking) => {
      return (
        booking.id.toString().includes(keyword) ||
        booking.customer_name?.toLowerCase().includes(keyword) ||
        booking.customer_phone?.includes(keyword) ||
        booking.field_name?.toLowerCase().includes(keyword) ||
        booking.field_cluster_name?.toLowerCase().includes(keyword)
      );
    });
  }, [bookings, search]);

  const stats = useMemo(() => {
    const pending = bookings.filter((item) => item.status === 'pending').length;
    const confirmed = bookings.filter((item) => item.status === 'confirmed').length;
    const cancelled = bookings.filter((item) => item.status === 'cancelled').length;

    return {
      total: bookings.length,
      pending,
      confirmed,
      cancelled,
    };
  }, [bookings]);

  const getStatusBadge = (status: Booking['status']) => {
    if (status === 'confirmed') {
      return <Badge className="bg-green-100 text-green-700 hover:bg-green-100">Đã xác nhận</Badge>;
    }
    if (status === 'pending') {
      return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">Chờ xử lý</Badge>;
    }
    if (status === 'cancelled') {
      return <Badge className="bg-red-100 text-red-700 hover:bg-red-100">Đã hủy</Badge>;
    }
    return <Badge variant="outline">{status || 'Không rõ'}</Badge>;
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    if (Number.isNaN(date.getTime())) return dateString;
    return format(date, 'dd/MM/yyyy', { locale: vi });
  };

  const formatCurrency = (amount?: number) => {
    if (!amount) return '0 đ';
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(amount);
  };

  return (
    <RoleBasedLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Quản Lý Booking</h1>
          <p className="text-gray-500 mt-1">Tất cả booking thuộc cụm sân bạn đang phụ trách</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-gray-500">Tổng booking</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-gray-500">Chờ xử lý</p>
              <p className="text-2xl font-bold text-yellow-700">{stats.pending}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-gray-500">Đã xác nhận</p>
              <p className="text-2xl font-bold text-green-700">{stats.confirmed}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-gray-500">Đã hủy</p>
              <p className="text-2xl font-bold text-red-700">{stats.cancelled}</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Danh Sách Booking</CardTitle>
            <CardDescription>
              API: GET /api/staff/bookings (Authorization: Bearer token)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
              <div className="md:col-span-2 relative">
                <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <Input
                  className="pl-9"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Tìm theo mã booking, tên khách, SĐT, sân..."
                />
              </div>
              <div className="flex gap-2">
                <Input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                />
                <Button variant="outline" onClick={loadBookings} disabled={loading}>
                  <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                </Button>
              </div>
            </div>

            {loading ? (
              <div className="text-center py-12 text-gray-500">Đang tải dữ liệu booking...</div>
            ) : filteredBookings.length === 0 ? (
              <div className="text-center py-12">
                <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Không có booking</h3>
                <p className="text-gray-500">Không tìm thấy booking phù hợp với bộ lọc hiện tại</p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredBookings.map((booking) => (
                  <div key={booking.id} className="rounded-lg border border-gray-200 p-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-semibold text-gray-900">Booking #{booking.id}</p>
                          {getStatusBadge(booking.status)}
                        </div>
                        <p className="text-sm text-gray-500 mt-1">
                          {booking.field_name || 'Không rõ sân'}
                          {booking.field_cluster_name ? ` • ${booking.field_cluster_name}` : ''}
                        </p>
                      </div>
                      <p className="font-semibold text-blue-700">{formatCurrency(booking.total_price)}</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-4 text-sm text-gray-700">
                      <div className="flex items-center gap-2">
                        <UserRound className="w-4 h-4 text-gray-400" />
                        <span>{booking.customer_name || 'Khách vãng lai'}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        <span>{formatDate(booking.booking_date || booking.day_book)}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock3 className="w-4 h-4 text-gray-400" />
                        <span>{booking.start_time} - {booking.end_time}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </RoleBasedLayout>
  );
};

export default StaffBookings;
