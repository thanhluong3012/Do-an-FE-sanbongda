import { useEffect, useState } from 'react';
import RoleBasedLayout from '@/components/layout/RoleBasedLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  AlertCircle, Calendar as CalendarIcon, Clock, DollarSign, 
  Filter, RefreshCw, User, Phone, MapPin, CheckCircle, XCircle, Loader2
} from 'lucide-react';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { bookingService, Booking } from '@/services/bookingService';
import { fieldComplexService, FieldComplex } from '@/services/fieldComplexService';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { useBookingRealtimeSync, SyncMessage } from '@/hooks/useRealtimeSync';
import { useCallback } from 'react';

const OwnerBookings = () => {
  const { toast } = useToast();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [fieldClusters, setFieldClusters] = useState<FieldComplex[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [selectedCluster, setSelectedCluster] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedBookingType, setSelectedBookingType] = useState<string>('all');

  useEffect(() => {
    const init = async () => {
      await loadFieldClusters();
      await loadBookings(); // Load bookings after clusters loaded
    };
    init();
  }, []);

  useEffect(() => {
    // Reload when filters change
    loadBookings();
  }, [selectedDate, selectedCluster, selectedStatus, selectedBookingType]);

  // Auto-reload when window gains focus (user switches back from other page)
  useEffect(() => {
    const handleFocus = () => {
      console.log('🔄 Window focused - reloading bookings...');
      loadBookings();
    };
    
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [selectedDate, selectedCluster, selectedStatus, selectedBookingType]);

  // Real-time sync từ tab khác (User booking)
  const handleBookingUpdate = useCallback((message: SyncMessage) => {
    console.log('🔔 [Owner] Received booking update:', message);
    
    // Show notification
    const actionText = message.type === 'booking_created' ? 'Có booking mới' : 
                       message.type === 'booking_cancelled' ? 'Booking bị hủy' : 
                       message.type === 'booking_confirmed' ? 'Booking được xác nhận' : 
                       message.type === 'payment_uploaded' ? '💳 Có chứng từ thanh toán mới' : 'Booking cập nhật';
    
    toast({
      title: '🔔 Real-time Update',
      description: actionText,
      duration: 5000,
    });

    // Reload danh sách bookings
    loadBookings();
  }, [selectedDate, selectedCluster, selectedStatus, selectedBookingType]);

  useBookingRealtimeSync(handleBookingUpdate);

  const loadFieldClusters = async () => {
    try {
      const data = await fieldComplexService.getOwnerFieldClusters();
      setFieldClusters(data);
    } catch (error) {
      console.error('Error loading field clusters:', error);
      toast({
        title: 'Lỗi',
        description: 'Không thể tải danh sách cụm sân',
        variant: 'destructive',
      });
    }
  };

  const loadBookings = async () => {
    setLoading(true);
    try {
      // Get all bookings (backend will filter by owner automatically)
      const bookingDate = selectedDate ? format(selectedDate, 'yyyy-MM-dd') : undefined;
      
      console.log('📅 Loading bookings for date:', bookingDate || 'ALL', 'type:', selectedBookingType);
      const allBookings = await bookingService.getOwnerBookings(bookingDate, selectedBookingType);
      console.log('📋 Loaded bookings:', allBookings);
      
      // Filter by cluster if selected
      let filteredBookings = allBookings;
      if (selectedCluster !== 'all') {
        const clusterId = parseInt(selectedCluster);
        const clusterFieldIds = fieldClusters
          .find(c => c.id === clusterId)
          ?.fields?.map(f => f.id) || [];
        filteredBookings = allBookings.filter(b => clusterFieldIds.includes(b.field_id));
      }
      
      // Filter by status if selected
      if (selectedStatus !== 'all') {
        filteredBookings = filteredBookings.filter(b => b.status === selectedStatus);
      }
      
      console.log('✅ Filtered bookings:', filteredBookings);
      setBookings(filteredBookings);
    } catch (error) {
      console.error('Error loading bookings:', error);
      toast({
        title: 'Lỗi',
        description: 'Không thể tải danh sách đặt sân',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };



  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { label: 'Chờ xác nhận', variant: 'secondary' as const, icon: Clock },
      confirmed: { label: 'Đã xác nhận', variant: 'default' as const, icon: CheckCircle },
      cancelled: { label: 'Đã hủy', variant: 'destructive' as const, icon: XCircle },
      completed: { label: 'Hoàn thành', variant: 'outline' as const, icon: CheckCircle },
    };
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    const Icon = config.icon;
    return (
      <Badge variant={config.variant} className="gap-1">
        <Icon className="w-3 h-3" />
        {config.label}
      </Badge>
    );
  };

  const getFieldInfo = (fieldId: number) => {
    for (const cluster of fieldClusters) {
      const field = cluster.fields?.find(f => f.id === fieldId);
      if (field) {
        return {
          fieldName: field.name || `Sân ${field.field_type}`,
          clusterName: cluster.name,
          clusterId: cluster.id
        };
      }
    }
    return { fieldName: 'N/A', clusterName: 'N/A', clusterId: 0 };
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount);
  };

  return (
    <RoleBasedLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Quản Lý Booking</h1>
          <p className="text-gray-500 mt-1">Danh sách đặt sân của khách hàng</p>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="w-5 h-5" />
              Bộ lọc
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              {/* Date Filter */}
              <div>
                <label className="text-sm font-medium mb-2 block">Ngày đặt</label>
                <div className="flex gap-2">
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "flex-1 justify-start text-left font-normal",
                          !selectedDate && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {selectedDate ? format(selectedDate, 'dd/MM/yyyy', { locale: vi }) : <span>Tất cả</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={selectedDate}
                        onSelect={setSelectedDate}
                        locale={vi}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  {selectedDate && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setSelectedDate(undefined)}
                      title="Xóa bộ lọc ngày"
                    >
                      <XCircle className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>

              {/* Cluster Filter */}
              <div>
                <label className="text-sm font-medium mb-2 block">Cụm sân</label>
                <Select value={selectedCluster} onValueChange={setSelectedCluster}>
                  <SelectTrigger>
                    <SelectValue placeholder="Tất cả cụm sân" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tất cả cụm sân</SelectItem>
                    {fieldClusters.map(cluster => (
                      <SelectItem key={cluster.id} value={cluster.id.toString()}>
                        {cluster.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Status Filter */}
              <div>
                <label className="text-sm font-medium mb-2 block">Trạng thái</label>
                <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                  <SelectTrigger>
                    <SelectValue placeholder="Tất cả trạng thái" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tất cả</SelectItem>
                    <SelectItem value="pending">Chờ xác nhận</SelectItem>
                    <SelectItem value="confirmed">Đã xác nhận</SelectItem>
                    <SelectItem value="cancelled">Đã hủy</SelectItem>
                    <SelectItem value="completed">Hoàn thành</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Booking Type Filter */}
              <div>
                <label className="text-sm font-medium mb-2 block">Loại booking</label>
                <Select value={selectedBookingType} onValueChange={setSelectedBookingType}>
                  <SelectTrigger>
                    <SelectValue placeholder="Tất cả loại" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tất cả</SelectItem>
                    <SelectItem value="regular">Booking thường</SelectItem>
                    <SelectItem value="tournament">Booking giải đấu</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Refresh Button */}
              <div className="flex items-end">
                <Button onClick={loadBookings} variant="outline" className="w-full gap-2">
                  <RefreshCw className="w-4 h-4" />
                  Làm mới
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Bookings List */}
        <Card>
          <CardHeader>
            <CardTitle>Danh Sách Booking</CardTitle>
            <CardDescription>
              {selectedDate ? `Ngày ${format(selectedDate, 'dd/MM/yyyy', { locale: vi })}` : 'Tất cả các ngày'}
              {' - '}
              {bookings.length} booking
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-12">
                <Loader2 className="w-8 h-8 text-primary mx-auto mb-4 animate-spin" />
                <p className="text-gray-500">Đang tải dữ liệu...</p>
              </div>
            ) : bookings.length === 0 ? (
              <div className="text-center py-12">
                <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Không có booking nào</h3>
                <p className="text-gray-500">Chưa có booking nào cho ngày này</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase">Cụm sân / Sân</th>
                      <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase whitespace-nowrap">Ngày đặt</th>
                      <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase">Loại</th>
                      <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase whitespace-nowrap">Thời gian</th>
                      <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase">Khách hàng</th>
                      <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase">Giá</th>
                      <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase">Trạng thái</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {bookings.map((booking) => {
                      const fieldInfo = getFieldInfo(booking.field_id);
                      return (
                        <tr key={booking.id} className="hover:bg-gray-50">
                          <td className="px-2 py-2">
                            <div className="text-xs">
                              <div className="font-medium text-gray-900 truncate max-w-[180px]">{fieldInfo.clusterName}</div>
                              <div className="text-gray-500 flex items-center gap-1">
                                <MapPin className="w-3 h-3 flex-shrink-0" />
                                <span className="truncate">{fieldInfo.fieldName}</span>
                              </div>
                            </div>
                          </td>
                          <td className="px-2 py-2 whitespace-nowrap">
                            <div className="text-xs text-gray-700">
                              {booking.booking_date ? format(new Date(booking.booking_date), 'dd/MM/yy', { locale: vi }) : 'N/A'}
                            </div>
                          </td>
                          <td className="px-2 py-2">
                            {booking.booking_type === 'tournament' ? (
                              <Badge variant="secondary" className="bg-purple-100 text-purple-700 border-purple-300 text-xs px-2 py-0">
                                🏆 Giải
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="text-gray-700 text-xs px-2 py-0">
                                ⚽
                              </Badge>
                            )}
                          </td>
                          <td className="px-2 py-2 whitespace-nowrap">
                            <div className="text-xs text-gray-700">
                              {booking.start_time?.substring(0, 5) || '--:--'} - {booking.end_time?.substring(0, 5) || '--:--'}
                            </div>
                          </td>
                          <td className="px-2 py-2">
                            <div className="text-xs">
                              <div className="font-medium text-gray-900 flex items-center gap-1">
                                <User className="w-3 h-3 flex-shrink-0" />
                                <span className="truncate max-w-[120px]">{booking.customer_name || 'N/A'}</span>
                              </div>
                              {booking.customer_phone && (
                                <div className="text-gray-500 flex items-center gap-1">
                                  <Phone className="w-3 h-3 flex-shrink-0" />
                                  {booking.customer_phone}
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="px-2 py-2 whitespace-nowrap">
                            <div className="font-medium text-gray-900 text-xs">
                              {formatCurrency(booking.total_price)}
                            </div>
                          </td>
                          <td className="px-2 py-2">
                            {getStatusBadge(booking.status)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </RoleBasedLayout>
  );
};

export default OwnerBookings;
