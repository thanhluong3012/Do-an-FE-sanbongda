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
import { paymentService } from '@/services/paymentService';

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
          tournamentMap.set(key, { name: b.tournament_name || `Giải đấu #${key}`, bookings: [] });
        }
        tournamentMap.get(key)!.bookings.push(b);
      } else {
        regular.push(b);
      }
    });

    return { regular, tournaments: tournamentMap };
  };

  const handleConfirmBooking = async (bookingId: number, data: { action: 'approve' | 'reject' }) => {
    console.log(`Attempting to ${data.action} booking ID ${bookingId}...`);
    const result = await paymentService.confirmBooking(bookingId, data);
    if (result.success) { 
      toast({
        title: 'Thành công',
        description: result.message,
      });
      loadBookings(); // Reload bookings after confirming
    } else {
      toast({
        title: 'Lỗi', 
        description: result.error,
        variant: 'destructive',
      });
    }
  };

  // Handle confirm/reject all bookings in a tournament
  const handleConfirmAllTournamentBookings = async (bookings: Booking[], action: 'approve' | 'reject') => {
    const pendingBookings = bookings.filter(b => b.status === 'pending');
    if (pendingBookings.length === 0) {
      toast({
        title: 'Thông báo',
        description: 'Không có booking nào cần xử lý',
        variant: 'default',
      });
      return;
    }

    try {
      // Call API for each pending booking
      const promises = pendingBookings.map(b => 
        paymentService.confirmBooking(b.id, { action })
      );
      const results = await Promise.all(promises);
      
      const successCount = results.filter(r => r.success).length;
      const failCount = results.length - successCount;

      if (successCount > 0) {
        toast({
          title: 'Thành công',
          description: `Đã ${action === 'approve' ? 'duyệt' : 'từ chối'} ${successCount}/${results.length} booking${failCount > 0 ? ` (${failCount} thất bại)` : ''}`,
        });
        loadBookings();
      } else {
        toast({
          title: 'Lỗi',
          description: 'Không thể xử lý bookings',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Lỗi',
        description: 'Có lỗi xảy ra khi xử lý',
        variant: 'destructive',
      });
    }
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

      // Sort newest first: created_at desc, fallback booking_date+start_time, then id desc
      const sortedBookings = [...filteredBookings].sort((a, b) => {
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

        return (Number(b.id) || 0) - (Number(a.id) || 0);
      });
      
      console.log('✅ Filtered bookings:', sortedBookings);
      setBookings(sortedBookings);
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

  const getPaymentMethodBadge = (paymentMethod?: string) => {
    if (paymentMethod === 'cash') {
      return (
        <Badge variant="outline" className="gap-1 border-green-300 text-green-700 bg-green-50">
          <DollarSign className="w-3 h-3" />
          Tiền mặt
        </Badge>
      );
    }

    if (paymentMethod === 'transfer' || paymentMethod === 'banking') {
      return (
        <Badge variant="outline" className="gap-1 border-blue-300 text-blue-700 bg-blue-50">
          <Clock className="w-3 h-3" />
          Chuyển khoản
        </Badge>
      );
    }

    return <span className="text-xs text-gray-500">Chưa chọn</span>;
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
                      <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase">Trạng thái</th>
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
                        
                        // Calculate overall status
                        const confirmedCount = group.bookings.filter(b => b.status === 'confirmed').length;
                        const completedCount = group.bookings.filter(b => b.status === 'completed').length;
                        const cancelledCount = group.bookings.filter(b => b.status === 'cancelled').length;
                        const pendingCount = group.bookings.filter(b => b.status === 'pending').length;
                        const totalCount = group.bookings.length;
                        const allConfirmed = confirmedCount === totalCount;
                        const allCompleted = completedCount === totalCount;
                        const allCancelled = cancelledCount === totalCount;
                        const allPending = pendingCount === totalCount;

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
                                {getPaymentMethodBadge(firstBooking.payment_method)}
                                {isExpanded ? <ChevronUp className="w-3 h-3 text-gray-400" /> : <ChevronDown className="w-3 h-3 text-gray-400" />}
                              </div>
                            </td>
                            <td className="px-2 py-2" onClick={(e) => e.stopPropagation()}>
                              {/* Trạng thái tổng hợp của booking giải đấu */}
                              {allCompleted ? (
                                <Badge className="gap-1 bg-blue-500 hover:bg-blue-600 text-white font-medium text-[10px]">
                                  <CheckCircle className="w-3 h-3" />
                                  Hoàn thành
                                </Badge>
                              ) : allConfirmed ? (
                                <Badge className="gap-1 bg-green-500 hover:bg-green-600 text-white font-medium text-[10px]">
                                  <CheckCircle className="w-3 h-3" />
                                  Đã duyệt tất cả
                                </Badge>
                              ) : allCancelled ? (
                                <Badge variant="destructive" className="gap-1 font-medium text-[10px]">
                                  <XCircle className="w-3 h-3" />
                                  Đã từ chối
                                </Badge>
                              ) : allPending ? (
                                <div className="flex gap-1">
                                  <Button 
                                    size="sm" 
                                    variant="default" 
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleConfirmAllTournamentBookings(group.bookings, 'approve');
                                    }}
                                    className="h-7 px-2 text-[10px] bg-green-600 hover:bg-green-700 text-white"
                                  >
                                    <CheckCircle className="w-3 h-3 mr-0.5" />
                                    Duyệt tất cả
                                  </Button>
                                  <Button 
                                    size="sm" 
                                    variant="destructive" 
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleConfirmAllTournamentBookings(group.bookings, 'reject');
                                    }}
                                    className="h-7 px-2 text-[10px]"
                                  >
                                    <XCircle className="w-3 h-3 mr-0.5" />
                                    Từ chối
                                  </Button>
                                </div>
                              ) : (
                                <div className="text-[10px] space-y-0.5">
                                  <div className="flex items-center gap-1 flex-wrap">
                                    {completedCount > 0 && (
                                      <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-300 text-[9px] px-1">
                                        {completedCount} hoàn thành
                                      </Badge>
                                    )}
                                    {confirmedCount > 0 && (
                                      <Badge variant="outline" className="bg-green-50 text-green-700 border-green-300 text-[9px] px-1">
                                        {confirmedCount} duyệt
                                      </Badge>
                                    )}
                                    {cancelledCount > 0 && (
                                      <Badge variant="outline" className="bg-red-50 text-red-700 border-red-300 text-[9px] px-1">
                                        {cancelledCount} từ chối
                                      </Badge>
                                    )}
                                  </div>
                                  {pendingCount > 0 && (
                                    <Button 
                                      size="sm" 
                                      variant="outline"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleConfirmAllTournamentBookings(group.bookings, 'approve');
                                      }}
                                      className="h-6 px-1.5 text-[9px] border-green-200 text-green-600 hover:bg-green-50 w-full"
                                    >
                                      Duyệt {pendingCount} còn lại
                                    </Button>
                                  )}
                                </div>
                              )}
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
                                  {getPaymentMethodBadge(b.payment_method)}
                                </td>
                                <td className="px-2 py-1.5">
                                  <div className="flex flex-col gap-1.5">
                                    {b.status === 'pending' ? (
                                      <div className="flex gap-1 mt-1">
                                        <Button 
                                          size="sm" 
                                          variant="default" 
                                          onClick={() => handleConfirmBooking(b.id, { action: 'approve' })}
                                          className="h-7 px-2 text-[10px] bg-green-600 hover:bg-green-700 text-white"
                                        >
                                          <CheckCircle className="w-3 h-3 mr-0.5" />
                                          xác nhận
                                        </Button>
                                        <Button 
                                          size="sm" 
                                          variant="destructive" 
                                          onClick={() => handleConfirmBooking(b.id, { action: 'reject' })}
                                          className="h-7 px-2 text-[10px]"
                                        >
                                          <XCircle className="w-3 h-3 mr-0.5" />
                                          Từ chối
                                        </Button>
                                      </div>
                                    ) : b.status === 'completed' ? (
                                      <Badge className="gap-1 bg-blue-500 hover:bg-blue-600 text-white font-medium text-[10px]">
                                        <CheckCircle className="w-3 h-3" />
                                        Hoàn thành
                                      </Badge>
                                    ) : b.status === 'confirmed' ? (
                                      <Badge className="gap-1 bg-green-500 hover:bg-green-600 text-white font-medium text-[10px]">
                                        <CheckCircle className="w-3 h-3" />
                                        Đã xác nhận
                                      </Badge>
                                    ) : b.status === 'cancelled' ? (
                                      <Badge variant="destructive" className="gap-1 font-medium text-[10px]">
                                        <XCircle className="w-3 h-3" />
                                        Đã từ chối
                                      </Badge>
                                    ) : null}
                                  </div>
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
                              {getPaymentMethodBadge(booking.payment_method)}
                            </td>
                            <td className="px-2 py-2">
                              <div className="flex flex-col gap-2">
                                {/* Hiện nút nếu đang pending, ngược lại thì hiện Badge text */}
                                {booking.payment_status === 'pending' && booking.status !== 'confirmed' ? (
                                  <div className="flex gap-1 mt-1">
                                    <Button 
                                      size="sm" 
                                      variant="default" 
                                      onClick={() => handleConfirmBooking(booking.id, { action: 'approve' })}
                                      className="h-8 px-2.5 text-xs bg-green-600 hover:bg-green-700"
                                    >
                                      <CheckCircle className="w-3 h-3 mr-1" />
                                      Xác nhận 
                                    </Button>
                                    <Button 
                                      size="sm" 
                                      variant="destructive" 
                                      onClick={() => handleConfirmBooking(booking.id, { action: 'reject' })}
                                      className="h-8 px-2.5 text-xs"
                                    >
                                      <XCircle className="w-3 h-3 mr-1" />
                                      Từ chối
                                    </Button>
                                  </div>
                                ) : (
                                  /* Hiển thị Text/Badge khi booking đã được xử lý */
                                  <div className="mt-1">
                                    {booking.status === 'completed' ? (
                                      <Badge className="gap-1 bg-blue-500 hover:bg-blue-600 text-white font-medium text-[10px]">
                                        <CheckCircle className="w-3 h-3" />
                                        Hoàn thành
                                      </Badge>
                                    ) : booking.status === 'confirmed' ? (
                                      <Badge className="gap-1 bg-green-500 hover:bg-green-600 text-white font-medium text-[10px]">
                                        <CheckCircle className="w-3 h-3" />
                                        Đã xác nhận 
                                      </Badge>
                                    ) : booking.status === 'cancelled' ? (
                                      <Badge variant="destructive" className="gap-1 font-medium text-[10px]">
                                        <XCircle className="w-3 h-3" />
                                        Đã từ chối 
                                      </Badge>
                                    ) : null}
                                  </div>
                                )}
                              </div>
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