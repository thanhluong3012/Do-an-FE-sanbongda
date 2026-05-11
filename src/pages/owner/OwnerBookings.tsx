import { useEffect, useState, useCallback } from 'react';
import React from 'react';
import RoleBasedLayout from '@/components/layout/RoleBasedLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  AlertCircle, Calendar as CalendarIcon, Clock, DollarSign, 
  Filter, RefreshCw, User, Phone, MapPin, CheckCircle, XCircle, Loader2,
  ChevronDown, ChevronUp, Trophy
} from 'lucide-react';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { bookingService, Booking } from '@/services/bookingService';
import { fieldComplexService, FieldComplex } from '@/services/fieldComplexService';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { useBookingRealtimeSync, SyncMessage } from '@/hooks/useRealtimeSync';

const OwnerBookings = () => {
  const { toast } = useToast();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [fieldClusters, setFieldClusters] = useState<FieldComplex[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [selectedCluster, setSelectedCluster] = useState<string>('all');
  const [selectedPaymentStatus, setSelectedPaymentStatus] = useState<string>('all');
  const [selectedBookingType, setSelectedBookingType] = useState<string>('all');
  const [expandedTournaments, setExpandedTournaments] = useState<Set<number>>(new Set());

  const toggleTournamentExpand = (tournamentId: number) => {
    setExpandedTournaments(prev => {
      const next = new Set(prev);
      if (next.has(tournamentId)) next.delete(tournamentId);
      else next.add(tournamentId);
      return next;
    });
  };

  // Group tournament bookings by tournament_id
  const groupBookings = (list: Booking[]) => {
    const regular: Booking[] = [];
    const tournamentMap = new Map<number, { name: string; bookings: Booking[] }>();

    list.forEach(b => {
      if (b.booking_type === 'tournament' && b.tournament_id) {
        const key = b.tournament_id;
        if (!tournamentMap.has(key)) {
          tournamentMap.set(key, { name: b.tournament_name || `Gi\u1ea3i \u0111\u1ea5u #${key}`, bookings: [] });
        }
        tournamentMap.get(key)!.bookings.push(b);
      } else {
        regular.push(b);
      }
    });

    return { regular, tournaments: tournamentMap };
  };

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
  }, [selectedDate, selectedCluster, selectedPaymentStatus, selectedBookingType]);

  // Auto-reload when window gains focus (user switches back from other page)
  useEffect(() => {
    const handleFocus = () => {
      console.log('🔄 Window focused - reloading bookings...');
      loadBookings();
    };
    
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [selectedDate, selectedCluster, selectedPaymentStatus, selectedBookingType]);

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
  }, [selectedDate, selectedCluster, selectedPaymentStatus, selectedBookingType]);

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
      
      // Filter by payment status if selected
      if (selectedPaymentStatus !== 'all') {
        filteredBookings = filteredBookings.filter(b => b.payment_status === selectedPaymentStatus);
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



  const getPaymentStatusBadge = (paymentStatus?: string) => {
    const statusConfig = {
      pending: { label: 'Chờ thanh toán', variant: 'secondary' as const, icon: Clock },
      paid: { label: 'Đã thanh toán', variant: 'default' as const, icon: CheckCircle },
      failed: { label: 'Thất bại', variant: 'destructive' as const, icon: XCircle },
      refunded: { label: 'Hoàn tiền', variant: 'outline' as const, icon: DollarSign },
    };
    const config = statusConfig[paymentStatus as keyof typeof statusConfig] || statusConfig.pending;
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

  const getSessionLabel = (startTime?: string): string => {
    if (!startTime) return '';
    const hour = parseInt(startTime.split(':')[0], 10);
    if (hour >= 6 && hour < 12) return '🌅 Sáng';
    if (hour >= 12 && hour < 18) return '☀️ Chiều';
    if (hour >= 18) return '🌙 Tối';
    return '';
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

              {/* Payment Status Filter */}
              <div>
                <label className="text-sm font-medium mb-2 block">Thanh toán</label>
                <Select value={selectedPaymentStatus} onValueChange={setSelectedPaymentStatus}>
                  <SelectTrigger>
                    <SelectValue placeholder="Tất cả trạng thái" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tất cả</SelectItem>
                    <SelectItem value="pending">Chờ thanh toán</SelectItem>
                    <SelectItem value="paid">Đã thanh toán</SelectItem>
                    <SelectItem value="failed">Thất bại</SelectItem>
                    <SelectItem value="refunded">Hoàn tiền</SelectItem>
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
                      <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase whitespace-nowrap">Buổi</th>
                      <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase">Khách hàng</th>
                      <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase">Giá</th>
                      <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase">Thanh toán</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {(() => {
                      const { regular, tournaments } = groupBookings(bookings);
                      const rows: React.ReactNode[] = [];

                      // Render tournament groups
                      tournaments.forEach((group, tournamentId) => {
                        const totalPrice = group.bookings.reduce((s, b) => s + (Number(b.total_price) || 0), 0);
                        const firstBooking = group.bookings[0];
                        const isExpanded = expandedTournaments.has(tournamentId);
                        const dates = [...new Set(group.bookings.map(b => b.booking_date))].sort();

                        rows.push(
                          <tr
                            key={`tournament-${tournamentId}`}
                            className="bg-purple-50 hover:bg-purple-100 cursor-pointer"
                            onClick={() => toggleTournamentExpand(tournamentId)}
                          >
                            <td className="px-2 py-2">
                              <div className="flex items-center gap-1 text-xs">
                                <Trophy className="w-3 h-3 text-purple-600 flex-shrink-0" />
                                <span className="font-semibold text-purple-900 truncate max-w-[180px]">{group.name}</span>
                              </div>
                              <div className="text-xs text-purple-600 mt-0.5 ml-4">{group.bookings.length} lượt sân</div>
                            </td>
                            <td className="px-2 py-2 whitespace-nowrap">
                              <div className="text-xs text-gray-700">
                                {dates.length === 1
                                  ? format(new Date(dates[0]), 'dd/MM/yy', { locale: vi })
                                  : `${format(new Date(dates[0]), 'dd/MM', { locale: vi })} – ${format(new Date(dates[dates.length - 1]), 'dd/MM/yy', { locale: vi })}`}
                              </div>
                            </td>
                            <td className="px-2 py-2">
                              <Badge variant="secondary" className="bg-purple-100 text-purple-700 border-purple-300 text-xs px-2 py-0">
                                🏆 Giải
                              </Badge>
                            </td>
                            <td className="px-2 py-2 whitespace-nowrap">
                              <div className="text-xs text-gray-500 italic">Nhiều buổi</div>
                            </td>
                            <td className="px-2 py-2">
                              {/* Buổi – nhiều buổi khác nhau, không hiển thị */}
                            </td>
                            <td className="px-2 py-2">
                              <div className="text-xs">
                                <div className="font-medium text-gray-900 flex items-center gap-1">
                                  <User className="w-3 h-3 flex-shrink-0" />
                                  <span className="truncate max-w-[120px]">{firstBooking.customer_name || 'N/A'}</span>
                                </div>
                                {firstBooking.customer_phone && (
                                  <div className="text-gray-500 flex items-center gap-1">
                                    <Phone className="w-3 h-3 flex-shrink-0" />
                                    {firstBooking.customer_phone}
                                  </div>
                                )}
                              </div>
                            </td>
                            <td className="px-2 py-2 whitespace-nowrap">
                              <div className="font-semibold text-purple-700 text-xs">{formatCurrency(totalPrice)}</div>
                            </td>
                            <td className="px-2 py-2">
                              <div className="flex items-center gap-1">
                                {getPaymentStatusBadge(firstBooking.payment_status)}
                                {isExpanded ? <ChevronUp className="w-3 h-3 text-gray-400" /> : <ChevronDown className="w-3 h-3 text-gray-400" />}
                              </div>
                            </td>
                          </tr>
                        );

                        // Render sub-rows when expanded
                        if (isExpanded) {
                          group.bookings.forEach(b => {
                            const fieldInfo = getFieldInfo(b.field_id);
                            rows.push(
                              <tr key={`booking-${b.id}`} className="bg-purple-50/40 border-l-4 border-l-purple-300">
                                <td className="px-2 py-1.5 pl-6">
                                  <div className="text-xs text-gray-600">
                                    <div className="truncate max-w-[160px]">{fieldInfo.clusterName}</div>
                                    <div className="flex items-center gap-1 text-gray-400">
                                      <MapPin className="w-3 h-3" />
                                      {fieldInfo.fieldName}
                                    </div>
                                  </div>
                                </td>
                                <td className="px-2 py-1.5 whitespace-nowrap">
                                  <div className="text-xs text-gray-600">
                                    {b.booking_date ? format(new Date(b.booking_date), 'dd/MM/yy', { locale: vi }) : 'N/A'}
                                  </div>
                                </td>
                                <td className="px-2 py-1.5" />
                                <td className="px-2 py-1.5 whitespace-nowrap">
                                  <div className="text-xs text-gray-600">
                                    {b.start_time?.substring(0, 5) || '--:--'} - {b.end_time?.substring(0, 5) || '--:--'}
                                  </div>
                                </td>
                                <td className="px-2 py-1.5 whitespace-nowrap">
                                  <div className="text-xs text-blue-600 font-medium">{getSessionLabel(b.start_time)}</div>
                                </td>
                                <td className="px-2 py-1.5" />
                                <td className="px-2 py-1.5 whitespace-nowrap">
                                  <div className="text-xs text-gray-500">{formatCurrency(b.total_price)}</div>
                                </td>
                                <td className="px-2 py-1.5">
                                  {getPaymentStatusBadge(b.payment_status)}
                                </td>
                              </tr>
                            );
                          });
                        }
                      });

                      // Render regular bookings
                      regular.forEach(booking => {
                        const fieldInfo = getFieldInfo(booking.field_id);
                        rows.push(
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
                              <Badge variant="outline" className="text-gray-700 text-xs px-2 py-0">⚽</Badge>
                            </td>
                            <td className="px-2 py-2 whitespace-nowrap">
                              <div className="text-xs text-gray-700">
                                {booking.start_time?.substring(0, 5) || '--:--'} - {booking.end_time?.substring(0, 5) || '--:--'}
                              </div>
                            </td>
                            <td className="px-2 py-2 whitespace-nowrap">
                              <div className="text-xs text-blue-600 font-medium">{getSessionLabel(booking.start_time)}</div>
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
                              <div className="font-medium text-gray-900 text-xs">{formatCurrency(booking.total_price)}</div>
                            </td>
                            <td className="px-2 py-2">
                              {getPaymentStatusBadge(booking.payment_status)}
                            </td>
                          </tr>
                        );
                      });

                      return rows;
                    })()}
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
