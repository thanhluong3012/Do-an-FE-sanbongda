import { useState, useEffect } from 'react';
import React from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Calendar, Clock, MapPin, DollarSign, Phone, Mail,
  AlertCircle, CheckCircle2, XCircle, Loader2, Building2, Upload, Image as ImageIcon,
  ChevronDown, ChevronUp, Trophy
} from 'lucide-react';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { bookingService, Booking, PaymentInfo } from '@/services/bookingService';
import { fieldComplexService } from '@/services/fieldComplexService';
import api from '@/lib/axios';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { useBookingRealtimeSync } from '@/hooks/useRealtimeSync';

const MyBookings = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [cancellingId, setCancellingId] = useState<number | null>(null);
  
  // Upload payment proof states
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [uploadingFile, setUploadingFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [fieldComplexMap, setFieldComplexMap] = useState<Record<number, any>>({});
  const [expandedTournaments, setExpandedTournaments] = useState<Set<number>>(new Set());

  const toggleTournamentExpand = (tournamentId: number) => {
    setExpandedTournaments(prev => {
      const next = new Set(prev);
      if (next.has(tournamentId)) next.delete(tournamentId);
      else next.add(tournamentId);
      return next;
    });
  };

  // Lấy label buổi từ giờ bắt đầu
  const getSessionLabel = (startTime?: string): string => {
    if (!startTime) return '';
    const hour = parseInt(startTime.split(':')[0], 10);
    if (hour >= 6 && hour < 12) return '🌅 Buổi sáng';
    if (hour >= 12 && hour < 18) return '☀️ Buổi chiều';
    if (hour >= 18) return '🌙 Buổi tối';
    return '';
  };

  // Group bookings by tournament
  const groupBookings = (list: Booking[]) => {
    const regular: Booking[] = [];
    const tournamentMap = new Map<number, { name: string; bookings: Booking[] }>();
    list.forEach(b => {
      if (b.booking_type === 'tournament' && b.tournament_id) {
        if (!tournamentMap.has(b.tournament_id)) {
          tournamentMap.set(b.tournament_id, { name: b.tournament_name || `Giải đấu #${b.tournament_id}`, bookings: [] });
        }
        tournamentMap.get(b.tournament_id)!.bookings.push(b);
      } else {
        regular.push(b);
      }
    });
    return { regular, tournaments: tournamentMap };
  };

  // Real-time sync để broadcast updates
  const { broadcast } = useBookingRealtimeSync(() => {});

  // Helper function để format tiền VNĐ
  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(amount);
  };

  useEffect(() => {
    if (!user) {
      toast({
        title: 'Yêu cầu đăng nhập',
        description: 'Vui lòng đăng nhập để xem lịch sử đặt sân',
        variant: 'destructive',
      });
      navigate('/auth');
      return;
    }

    // Redirect owner/admin/staff về dashboard của họ
    if (user.role_id === 1) {
      // Admin
      navigate('/admin/dashboard');
      return;
    }
    if (user.role_id === 2) {
      // Owner - redirect về owner bookings management
      navigate('/owner/bookings');
      return;
    }
    if (user.role_id === 3) {
      // Staff
      navigate('/staff/bookings');
      return;
    }

    // Chỉ member mới load my bookings
    loadMyBookings();
  }, [user]);

  const loadMyBookings = async () => {
    try {
      setLoading(true);
      console.log('🔄 Loading my bookings...');
      
      const data = await bookingService.getMyBookings();
      console.log('📦 Received bookings:', data);
      
      // Filter out invalid bookings
      const validBookings = data.filter(b => {
        if (!b.booking_date) {
          console.warn('⚠️ Booking missing booking_date:', b);
          return false;
        }
        return true;
      });
      
      // Sort by date descending (newest first)
      const sorted = validBookings.sort((a, b) => {
        try {
          const dateA = new Date(a.booking_date + 'T' + (a.start_time || '00:00:00'));
          const dateB = new Date(b.booking_date + 'T' + (b.start_time || '00:00:00'));
          return dateB.getTime() - dateA.getTime();
        } catch (error) {
          console.error('Error sorting bookings:', error);
          return 0;
        }
      });
      
      console.log('✅ Sorted bookings:', sorted.length, 'items');
      setBookings(sorted);
      loadFieldComplexInfo(sorted);
    } catch (error) {
      console.error('❌ Error loading bookings:', error);
      toast({
        title: 'Lỗi',
        description: 'Không thể tải lịch sử đặt sân',
        variant: 'destructive',
      });
      setBookings([]); // Set empty array on error
    } finally {
      setLoading(false);
    }
  };

  const loadFieldComplexInfo = async (bookings: Booking[]) => {
    const uniqueFieldIds = [...new Set(bookings.map(b => b.field_id))];
    const complexMap: Record<number, any> = {};

    await Promise.all(
      uniqueFieldIds.map(async (fieldId) => {
        try {
          const res = await api.get(`/fields/${fieldId}`);
          const field = res.data?.data || res.data;
          const clusterId = field?.field_cluster_id;
          if (clusterId) {
            const cluster = await fieldComplexService.getById(clusterId);
            if (cluster) complexMap[fieldId] = cluster;
          }
        } catch (e) {
          console.error('Error loading field complex info for field:', fieldId, e);
        }
      })
    );

    setFieldComplexMap(complexMap);
  };

  const handleCancelBooking = async (bookingId: number) => {
    if (!confirm('Bạn có chắc muốn hủy đặt sân này?')) return;

    try {
      setCancellingId(bookingId);
      const result = await bookingService.cancelBooking(bookingId);
      
      if (result.success) {
        toast({
          title: 'Thành công',
          description: result.message || 'Đã hủy đặt sân',
        });
        loadMyBookings(); // Reload list
      } else {
        toast({
          title: 'Lỗi',
          description: result.message || 'Không thể hủy đặt sân',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Lỗi',
        description: 'Không thể hủy đặt sân',
        variant: 'destructive',
      });
    } finally {
      setCancellingId(null);
    }
  };

  const handleOpenUploadDialog = (booking: Booking) => {
    setSelectedBooking(booking);
    setUploadingFile(null);
    setPreviewUrl(booking.payment_proof_url || null);
    setShowUploadDialog(true);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: 'Lỗi',
        description: 'Vui lòng chọn file ảnh (jpg, png, ...)',
        variant: 'destructive',
      });
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: 'Lỗi',
        description: 'Kích thước file không được vượt quá 5MB',
        variant: 'destructive',
      });
      return;
    }

    setUploadingFile(file);
    
    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviewUrl(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleUploadPaymentProof = async () => {
    if (!selectedBooking || !uploadingFile) return;

    try {
      setUploading(true);
      const result = await bookingService.uploadPaymentProof(selectedBooking.id, uploadingFile);

      if (result.success) {
        toast({
          title: 'Thành công',
          description: 'Đã upload chứng từ thanh toán. Vui lòng đợi chủ sân xác nhận.',
        });

        // Broadcast tới Owner để thông báo có payment proof mới
        broadcast({
          type: 'payment_uploaded',
          entityId: selectedBooking.id,
          entityType: 'booking',
          relatedIds: {
            fieldId: selectedBooking.field_id,
            bookingDate: selectedBooking.booking_date,
          },
          data: {
            paymentMethod: selectedBooking.payment_method,
          },
        });

        setShowUploadDialog(false);
        loadMyBookings(); // Reload to get updated data
      } else {
        toast({
          title: 'Lỗi',
          description: result.error || 'Không thể upload chứng từ',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Lỗi',
        description: 'Có lỗi xảy ra khi upload',
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
    }
  };

  const getPaymentStatusBadge = (paymentStatus?: string) => {
    const variants: Record<string, { label: string; className: string; icon: any }> = {
      pending: {
        label: 'Chờ thanh toán',
        className: 'bg-yellow-100 text-yellow-800 border-yellow-300',
        icon: Clock,
      },
      paid: {
        label: 'Đã thanh toán',
        className: 'bg-green-100 text-green-800 border-green-300',
        icon: CheckCircle2,
      },
      failed: {
        label: 'Thất bại',
        className: 'bg-red-100 text-red-800 border-red-300',
        icon: XCircle,
      },
      refunded: {
        label: 'Hoàn tiền',
        className: 'bg-blue-100 text-blue-800 border-blue-300',
        icon: DollarSign,
      },
    };

    const variant = variants[paymentStatus || 'pending'] || variants.pending;
    const Icon = variant.icon;

    return (
      <Badge className={variant.className + ' border'}>
        <Icon className="w-3 h-3 mr-1" />
        {variant.label}
      </Badge>
    );
  };

  const getBookingStatusBadge = (booking: Booking) => {
    // Hiển thị status của booking trước
    if (booking.status === 'pending') {
      return (
        <Badge className="bg-yellow-100 text-yellow-800 border-yellow-300 border">
          <Clock className="w-3 h-3 mr-1" />
          ⏳ Chờ xác nhận
        </Badge>
      );
    }
    
    if (booking.status === 'confirmed') {
      // Nếu đã xác nhận, mới hiển thị payment_status
      return getPaymentStatusBadge(booking.payment_status);
    }
    
    if (booking.status === 'cancelled') {
      return (
        <Badge className="bg-red-100 text-red-800 border-red-300 border">
          <XCircle className="w-3 h-3 mr-1" />
          Đã hủy
        </Badge>
      );
    }
    
    if (booking.status === 'completed') {
      return (
        <Badge className="bg-green-100 text-green-800 border-green-300 border">
          <CheckCircle2 className="w-3 h-3 mr-1" />
          Hoàn thành
        </Badge>
      );
    }
    
    // Default
    return getPaymentStatusBadge(booking.payment_status);
  };

  const filterBookings = (paymentStatus?: string) => {
    if (!paymentStatus) return bookings;
    return bookings.filter(b => b.payment_status === paymentStatus);
  };

  const canCancelBooking = (booking: Booking): boolean => {
    // Chỉ có thể hủy booking pending hoặc confirmed
    if (booking.status !== 'pending' && booking.status !== 'confirmed') {
      return false;
    }

    // Không thể hủy nếu đã quá giờ
    const bookingDateTime = new Date(booking.booking_date + 'T' + booking.start_time);
    return bookingDateTime > new Date();
  };

  // ...existing code...
  const [showOnlinePayment, setShowOnlinePayment] = useState(false);
  const [onlinePaymentBooking, setOnlinePaymentBooking] = useState<Booking | null>(null);
  const [paymentInfo, setPaymentInfo] = useState<PaymentInfo | null>(null);
  const [loadingPaymentInfo, setLoadingPaymentInfo] = useState(false);
  const [showQRZoom, setShowQRZoom] = useState(false);

  const handleOpenOnlinePayment = async (booking: Booking) => {
    setOnlinePaymentBooking(booking);
    setShowOnlinePayment(true);
    setLoadingPaymentInfo(true);
    
    try {
      const result = await bookingService.getPaymentInfo(booking.id);
      if (result.success && result.data) {
        setPaymentInfo(result.data);
      } else {
        toast({
          title: 'Lỗi',
          description: result.error || 'Không thể tải thông tin thanh toán',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Lỗi',
        description: 'Có lỗi xảy ra khi tải thông tin thanh toán',
        variant: 'destructive',
      });
    } finally {
      setLoadingPaymentInfo(false);
    }
  };

  const renderBookingCard = (booking: Booking) => {
    const bookingDateTime = new Date(booking.booking_date + 'T' + booking.start_time);
    const isPast = bookingDateTime < new Date();

    return (
      <Card key={booking.id} className={`hover:shadow-lg transition-shadow flex flex-col justify-between ${isPast ? 'opacity-75' : ''}`}>
        <CardHeader>
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <CardTitle className="flex items-center gap-2 mb-2">
                <Building2 className="w-5 h-5 text-primary" />
                Booking #{booking.id}
              </CardTitle>
              <CardDescription>
                Đặt lúc: {booking.created_at ? format(new Date(booking.created_at), 'dd/MM/yyyy HH:mm', { locale: vi }) : 'N/A'}
              </CardDescription>
            </div>
            {getBookingStatusBadge(booking)}
          </div>
        </CardHeader>

        <CardContent className="space-y-4 flex-1">
          {/* Date & Time */}
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-start gap-2">
              <Calendar className="w-4 h-4 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-sm font-medium">Ngày đặt</p>
                <p className="text-sm text-muted-foreground">
                  {format(new Date(booking.booking_date), 'EEEE, dd/MM/yyyy', { locale: vi })}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-2">
              <Clock className="w-4 h-4 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-sm font-medium">Giờ chơi</p>
                <p className="text-sm text-muted-foreground">
                  {booking.start_time.substring(0, 5)} - {booking.end_time.substring(0, 5)}
                </p>
                {getSessionLabel(booking.start_time) && (
                  <p className="text-xs text-blue-600 font-medium mt-0.5">
                    {getSessionLabel(booking.start_time)}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Price */}
          <div className="flex items-center justify-between p-3 bg-primary/5 rounded-lg">
            <div className="flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-primary" />
              <span className="font-medium">Tổng tiền</span>
            </div>
            <span className="text-lg font-bold text-primary">
              {formatCurrency(booking.total_price)}
            </span>
          </div>

          {/* Payment Info - Hiển thị phương thức thanh toán đã chọn lúc đặt sân */}
          {booking.payment_method && (
            <div className="space-y-3 pt-3 border-t">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Phương thức thanh toán:</span>
                <Badge variant="outline" className="font-semibold text-primary">
                  {booking.payment_method === 'transfer' ? '🏦 Chuyển khoản' : '💵 Tiền mặt'}
                </Badge>
              </div>

              {/* Ghi chú cho cả hai phương thức */}
              <Alert className="bg-blue-50 border-blue-200">
                <AlertCircle className="h-4 w-4 text-blue-600" />
                <AlertDescription className="text-sm text-blue-800">
                  {booking.payment_method === 'transfer' 
                    ? 'Khách hàng có thể thanh toán trực tuyến tại đây hoặc đến thanh toán trực tiếp tại sân.'
                    : 'Khách hàng có thể đến thanh toán trực tiếp tại sân, dù chọn tiền mặt hay chuyển khoản.'
                  }
                </AlertDescription>
              </Alert>

              {booking.payment_method === 'transfer' && (
                <>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Trạng thái:</span>
                    <Badge 
                      variant={booking.payment_status === 'paid' ? 'default' : 'secondary'}
                      className={booking.payment_status === 'paid' ? 'bg-green-100 text-green-800' : ''}
                    >
                      {booking.payment_status === 'paid' ? '✓ Đã thanh toán' : '⏳ Chờ xác nhận'}
                    </Badge>
                  </div>

                  {booking.payment_proof_url && (
                    <Alert className={booking.payment_status === 'paid' ? 'bg-green-50 border-green-200' : 'bg-blue-50 border-blue-200'}>
                      <CheckCircle2 className={booking.payment_status === 'paid' ? 'h-4 w-4 text-green-600' : 'h-4 w-4 text-blue-600'} />
                      <AlertDescription className={booking.payment_status === 'paid' ? 'text-sm text-green-800' : 'text-sm text-blue-800'}>
                        {booking.payment_status === 'paid' 
                          ? 'Đã được chủ sân xác nhận thanh toán.'
                          : 'Đã upload chứng từ. Đang chờ chủ sân xác nhận.'
                        }
                      </AlertDescription>
                    </Alert>
                  )}

                  {/* Nút thanh toán trực tuyến - chỉ hiện khi booking đã confirmed */}
                  {booking.status === 'confirmed' && (!booking.payment_status || booking.payment_status !== 'paid') && (
                    <Button
                      variant="default"
                      size="sm"
                      className="w-full"
                      onClick={() => handleOpenOnlinePayment(booking)}
                    >
                      <DollarSign className="w-4 h-4 mr-2" />
                      Thanh toán trực tuyến
                    </Button>
                  )}
                  
                  {/* Thông báo khi chưa xác nhận */}
                  {booking.status === 'pending' && (!booking.payment_status || booking.payment_status !== 'paid') && (
                    <Alert className="bg-yellow-50 border-yellow-200">
                      <AlertCircle className="h-4 w-4 text-yellow-600" />
                      <AlertDescription className="text-sm text-yellow-800">
                        Booking đang chờ chủ sân xác nhận. Bạn có thể thanh toán sau khi được xác nhận.
                      </AlertDescription>
                    </Alert>
                  )}
                </>
              )}

              {booking.payment_method === 'cash' && booking.payment_status !== 'paid' && (
                <Alert className="bg-amber-50 border-amber-200">
                  <AlertCircle className="h-4 w-4 text-amber-600" />
                  <AlertDescription className="text-sm text-amber-800">
                    Chủ sân sẽ liên hệ với bạn để xác nhận và thanh toán bằng tiền mặt khi đến sân.
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}

          {/* Contact Info */}
          {(booking.customer_name || booking.customer_phone) && (
            <div className="space-y-2 pt-2 border-t mt-auto">
              {booking.customer_name && (
                <p className="text-sm">
                  <span className="text-muted-foreground">Người đặt:</span>{' '}
                  <span className="font-medium">{booking.customer_name}</span>
                </p>
              )}
              {booking.customer_phone && (
                <div className="flex items-center gap-2 text-sm">
                  <Phone className="w-3 h-3 text-muted-foreground" />
                  <span className="text-muted-foreground">{booking.customer_phone}</span>
                </div>
              )}
              {booking.customer_email && (
                <div className="flex items-center gap-2 text-sm">
                  <Mail className="w-3 h-3 text-muted-foreground" />
                  <span className="text-muted-foreground">{booking.customer_email}</span>
                </div>
              )}
            </div>
          )}

          {/* Owner / Field Complex Contact Info */}
          {fieldComplexMap[booking.field_id] && (
            <div className="space-y-2 pt-2 border-t">
              <p className="text-sm font-semibold text-gray-700">Thông tin liên hệ chủ sân</p>
              {fieldComplexMap[booking.field_id].name && (
                <div className="flex items-center gap-2 text-sm">
                  <Building2 className="w-3 h-3 text-muted-foreground" />
                  <span className="font-medium">{fieldComplexMap[booking.field_id].name}</span>
                </div>
              )}
              {fieldComplexMap[booking.field_id].phone && (
                <div className="flex items-center gap-2 text-sm">
                  <Phone className="w-3 h-3 text-muted-foreground" />
                  <a
                    href={`tel:${fieldComplexMap[booking.field_id].phone}`}
                    className="text-blue-600 hover:underline"
                  >
                    {fieldComplexMap[booking.field_id].phone}
                  </a>
                </div>
              )}
              {fieldComplexMap[booking.field_id].email && (
                <div className="flex items-center gap-2 text-sm">
                  <Mail className="w-3 h-3 text-muted-foreground" />
                  <a
                    href={`mailto:${fieldComplexMap[booking.field_id].email}`}
                    className="text-blue-600 hover:underline"
                  >
                    {fieldComplexMap[booking.field_id].email}
                  </a>
                </div>
              )}
              {fieldComplexMap[booking.field_id].address && (
                <div className="flex items-center gap-2 text-sm">
                  <MapPin className="w-3 h-3 text-muted-foreground" />
                  <span className="text-muted-foreground">{fieldComplexMap[booking.field_id].address}</span>
                </div>
              )}
            </div>
          )}

          {/* Note */}
          {booking.note && (
            <div className="p-3 bg-muted/50 rounded-lg">
              <p className="text-sm">
                <span className="font-medium">Ghi chú:</span> {booking.note}
              </p>
            </div>
          )}

          {/* Actions */}
          <div className="space-y-2 mt-4 pt-2 border-t">
            {/* Cancel Button */}
            {canCancelBooking(booking) && (
              <Button
                variant="destructive"
                size="sm"
                className="w-full"
                onClick={() => handleCancelBooking(booking.id)}
                disabled={cancellingId === booking.id}
              >
                {cancellingId === booking.id ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Đang hủy...
                  </>
                ) : (
                  <>
                    <XCircle className="w-4 h-4 mr-2" />
                    Hủy đặt sân
                  </>
                )}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  const renderTournamentGroupCard = (tournamentId: number, group: { name: string; bookings: Booking[] }) => {
    const isExpanded = expandedTournaments.has(tournamentId);
    const firstBooking = group.bookings[0];
    const totalPrice = group.bookings.reduce((s, b) => s + (Number(b.total_price) || 0), 0);
    const dates = [...new Set(group.bookings.map(b => b.booking_date))].sort();

    return (
      <Card key={`tournament-${tournamentId}`} className="hover:shadow-lg transition-shadow border-purple-200">
        <CardHeader>
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <CardTitle className="flex items-center gap-2 mb-1 text-purple-900">
                <Trophy className="w-5 h-5 text-purple-600" />
                {group.name}
              </CardTitle>
              <CardDescription>
                🏆 Booking giải đấu · {group.bookings.length} lượt sân
              </CardDescription>
            </div>
            {getBookingStatusBadge(firstBooking)}
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="flex items-start gap-2">
            <Calendar className="w-4 h-4 text-muted-foreground mt-0.5" />
            <div>
              <p className="text-sm font-medium">Khoảng ngày thi đấu</p>
              <p className="text-sm text-muted-foreground">
                {dates.length === 1
                  ? format(new Date(dates[0]), 'EEEE, dd/MM/yyyy', { locale: vi })
                  : `${format(new Date(dates[0]), 'dd/MM/yyyy', { locale: vi })} – ${format(new Date(dates[dates.length - 1]), 'dd/MM/yyyy', { locale: vi })}`}
              </p>
            </div>
          </div>

          <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
            <div className="flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-purple-600" />
              <span className="font-medium">Tổng tiền ({group.bookings.length} lượt)</span>
            </div>
            <span className="text-lg font-bold text-purple-700">{formatCurrency(totalPrice)}</span>
          </div>

          {/* Payment Info - Similar to regular booking cards */}
          {firstBooking.payment_method && (
            <div className="space-y-3 pt-3 border-t">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Phương thức thanh toán:</span>
                <Badge variant="outline" className="font-semibold text-primary">
                  {firstBooking.payment_method === 'transfer' ? '🏦 Chuyển khoản' : '💵 Tiền mặt'}
                </Badge>
              </div>

              {/* Ghi chú cho cả hai phương thức */}
              <Alert className="bg-blue-50 border-blue-200">
                <AlertCircle className="h-4 w-4 text-blue-600" />
                <AlertDescription className="text-sm text-blue-800">
                  {firstBooking.payment_method === 'transfer' 
                    ? 'Khách hàng có thể thanh toán trực tuyến tại đây hoặc đến thanh toán trực tiếp tại sân.'
                    : 'Khách hàng có thể đến thanh toán trực tiếp tại sân, dù chọn tiền mặt hay chuyển khoản.'
                  }
                </AlertDescription>
              </Alert>

              {firstBooking.payment_method === 'transfer' && (
                <>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Trạng thái:</span>
                    <Badge 
                      variant={firstBooking.payment_status === 'paid' ? 'default' : 'secondary'}
                      className={firstBooking.payment_status === 'paid' ? 'bg-green-100 text-green-800' : ''}
                    >
                      {firstBooking.payment_status === 'paid' ? '✓ Đã thanh toán' : '⏳ Chờ xác nhận'}
                    </Badge>
                  </div>

                  {firstBooking.payment_proof_url && (
                    <Alert className={firstBooking.payment_status === 'paid' ? 'bg-green-50 border-green-200' : 'bg-blue-50 border-blue-200'}>
                      <CheckCircle2 className={firstBooking.payment_status === 'paid' ? 'h-4 w-4 text-green-600' : 'h-4 w-4 text-blue-600'} />
                      <AlertDescription className={firstBooking.payment_status === 'paid' ? 'text-sm text-green-800' : 'text-sm text-blue-800'}>
                        {firstBooking.payment_status === 'paid' 
                          ? 'Đã được chủ sân xác nhận thanh toán.'
                          : 'Đã upload chứng từ. Đang chờ chủ sân xác nhận.'
                        }
                      </AlertDescription>
                    </Alert>
                  )}

                  {/* Nút thanh toán trực tuyến - chỉ hiện khi booking đã confirmed */}
                  {firstBooking.status === 'confirmed' && (!firstBooking.payment_status || firstBooking.payment_status !== 'paid') && (
                    <Button
                      variant="default"
                      size="sm"
                      className="w-full"
                      onClick={() => handleOpenOnlinePayment(firstBooking)}
                    >
                      <DollarSign className="w-4 h-4 mr-2" />
                      Thanh toán trực tuyến
                    </Button>
                  )}
                  
                  {/* Thông báo khi chưa xác nhận */}
                  {firstBooking.status === 'pending' && (!firstBooking.payment_status || firstBooking.payment_status !== 'paid') && (
                    <Alert className="bg-yellow-50 border-yellow-200">
                      <AlertCircle className="h-4 w-4 text-yellow-600" />
                      <AlertDescription className="text-sm text-yellow-800">
                        Booking đang chờ chủ sân xác nhận. Bạn có thể thanh toán sau khi được xác nhận.
                      </AlertDescription>
                    </Alert>
                  )}
                </>
              )}

              {firstBooking.payment_method === 'cash' && firstBooking.payment_status !== 'paid' && (
                <Alert className="bg-amber-50 border-amber-200">
                  <AlertCircle className="h-4 w-4 text-amber-600" />
                  <AlertDescription className="text-sm text-amber-800">
                    Chủ sân sẽ liên hệ với bạn để xác nhận và thanh toán bằng tiền mặt khi đến sân.
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}

          {/* Contact Info */}
          {(firstBooking.customer_name || firstBooking.customer_phone) && (
            <div className="space-y-2 pt-2 border-t">
              {firstBooking.customer_name && (
                <p className="text-sm">
                  <span className="text-muted-foreground">Người đặt:</span>{' '}
                  <span className="font-medium">{firstBooking.customer_name}</span>
                </p>
              )}
              {firstBooking.customer_phone && (
                <div className="flex items-center gap-2 text-sm">
                  <Phone className="w-3 h-3 text-muted-foreground" />
                  <span className="text-muted-foreground">{firstBooking.customer_phone}</span>
                </div>
              )}
              {firstBooking.customer_email && (
                <div className="flex items-center gap-2 text-sm">
                  <Mail className="w-3 h-3 text-muted-foreground" />
                  <span className="text-muted-foreground">{firstBooking.customer_email}</span>
                </div>
              )}
            </div>
          )}

          {/* Owner / Field Complex Contact Info */}
          {fieldComplexMap[firstBooking.field_id] && (
            <div className="space-y-2 pt-2 border-t">
              <p className="text-sm font-semibold text-gray-700">Thông tin liên hệ chủ sân</p>
              {fieldComplexMap[firstBooking.field_id].name && (
                <div className="flex items-center gap-2 text-sm">
                  <Building2 className="w-3 h-3 text-muted-foreground" />
                  <span className="font-medium">{fieldComplexMap[firstBooking.field_id].name}</span>
                </div>
              )}
              {fieldComplexMap[firstBooking.field_id].phone && (
                <div className="flex items-center gap-2 text-sm">
                  <Phone className="w-3 h-3 text-muted-foreground" />
                  <a
                    href={`tel:${fieldComplexMap[firstBooking.field_id].phone}`}
                    className="text-blue-600 hover:underline"
                  >
                    {fieldComplexMap[firstBooking.field_id].phone}
                  </a>
                </div>
              )}
              {fieldComplexMap[firstBooking.field_id].email && (
                <div className="flex items-center gap-2 text-sm">
                  <Mail className="w-3 h-3 text-muted-foreground" />
                  <a
                    href={`mailto:${fieldComplexMap[firstBooking.field_id].email}`}
                    className="text-blue-600 hover:underline"
                  >
                    {fieldComplexMap[firstBooking.field_id].email}
                  </a>
                </div>
              )}
              {fieldComplexMap[firstBooking.field_id].address && (
                <div className="flex items-center gap-2 text-sm">
                  <MapPin className="w-3 h-3 text-muted-foreground" />
                  <span className="text-muted-foreground">{fieldComplexMap[firstBooking.field_id].address}</span>
                </div>
              )}
            </div>
          )}

          {/* Note */}
          {firstBooking.note && (
            <div className="p-3 bg-muted/50 rounded-lg">
              <p className="text-sm">
                <span className="font-medium">Ghi chú:</span> {firstBooking.note}
              </p>
            </div>
          )}

          <button
            className="w-full flex items-center justify-center gap-2 text-sm text-purple-700 hover:text-purple-900 py-2 border border-purple-200 rounded-lg hover:bg-purple-50 transition-colors"
            onClick={() => toggleTournamentExpand(tournamentId)}
          >
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            {isExpanded ? 'Ẩn chi tiết' : `Xem ${group.bookings.length} lượt sân`}
          </button>

          {isExpanded && (
            <div className="border rounded-lg divide-y text-sm">
              {group.bookings.map((b, idx) => (
                <div key={b.id} className="px-3 py-2 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-3 flex-1 min-w-0 flex-wrap">
                    <span className="text-muted-foreground shrink-0">#{idx + 1}</span>
                    <div className="flex items-center gap-1 shrink-0">
                      <Calendar className="w-3 h-3 text-muted-foreground" />
                      <span>{format(new Date(b.booking_date), 'dd/MM/yyyy', { locale: vi })}</span>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <Clock className="w-3 h-3 text-muted-foreground" />
                      <span>{b.start_time?.substring(0, 5)} – {b.end_time?.substring(0, 5)}</span>
                    </div>
                    {getSessionLabel(b.start_time) && (
                      <span className="text-blue-600 font-medium shrink-0">{getSessionLabel(b.start_time)}</span>
                    )}
                  </div>
                  <span className="font-medium shrink-0">{formatCurrency(b.total_price)}</span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  const renderBookingList = (list: Booking[]): React.ReactNode[] => {
    const { regular, tournaments } = groupBookings(list);
    const items: React.ReactNode[] = [];
    tournaments.forEach((group, tournamentId) => items.push(renderTournamentGroupCard(tournamentId, group)));
    regular.forEach(b => items.push(renderBookingCard(b)));
    return items;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-8 mt-20">
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto mb-4" />
              <p className="text-muted-foreground">Đang tải lịch sử đặt sân...</p>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8 mt-20">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Lịch sử đặt sân</h1>
          <p className="text-muted-foreground">
            Quản lý và xem lại các lần đặt sân của bạn
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-2xl font-bold text-primary">{bookings.length}</p>
                <p className="text-sm text-muted-foreground">Tổng đặt sân</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-2xl font-bold text-yellow-600">
                  {filterBookings('pending').length}
                </p>
                <p className="text-sm text-muted-foreground">Chờ thanh toán</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-2xl font-bold text-green-600">
                  {filterBookings('paid').length}
                </p>
                <p className="text-sm text-muted-foreground">Đã thanh toán</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-2xl font-bold text-red-600">
                  {filterBookings('failed').length}
                </p>
                <p className="text-sm text-muted-foreground">Thất bại</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs for filtering */}
        <Tabs defaultValue="all" className="space-y-6">
          <TabsList className="grid w-full max-w-2xl grid-cols-4">
            <TabsTrigger value="all">
              Tất cả ({bookings.length})
            </TabsTrigger>
            <TabsTrigger value="pending">
              Chờ thanh toán ({filterBookings('pending').length})
            </TabsTrigger>
            <TabsTrigger value="paid">
              Đã thanh toán ({filterBookings('paid').length})
            </TabsTrigger>
            <TabsTrigger value="failed">
              Thất bại ({filterBookings('failed').length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="space-y-4">
            {bookings.length === 0 ? (
              <Card className="p-12">
                <div className="text-center">
                  <Calendar className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Chưa có lịch sử đặt sân</h3>
                  <p className="text-muted-foreground mb-4">
                    Bạn chưa đặt sân nào. Hãy tìm và đặt sân yêu thích!
                  </p>
                  <Button onClick={() => navigate('/fields')}>
                    Tìm sân ngay
                  </Button>
                </div>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {renderBookingList(bookings)}
              </div>
            )}
          </TabsContent>

          <TabsContent value="pending" className="space-y-4">
            {filterBookings('pending').length === 0 ? (
              <Card className="p-12">
                <div className="text-center">
                  <AlertCircle className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">Không có đặt sân chờ thanh toán</p>
                </div>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {renderBookingList(filterBookings('pending'))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="paid" className="space-y-4">
            {filterBookings('paid').length === 0 ? (
              <Card className="p-12">
                <div className="text-center">
                  <CheckCircle2 className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">Không có đặt sân đã thanh toán</p>
                </div>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {renderBookingList(filterBookings('paid'))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="failed" className="space-y-4">
            {filterBookings('failed').length === 0 ? (
              <Card className="p-12">
                <div className="text-center">
                  <XCircle className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">Không có đặt sân thanh toán thất bại</p>
                </div>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {renderBookingList(filterBookings('failed'))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>
      <Footer />

      {/* Upload Payment Proof Dialog */}
      <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Upload className="w-5 h-5 text-primary" />
              Upload chứng từ thanh toán
            </DialogTitle>
            <DialogDescription>
              Upload ảnh chụp bill/ảnh chuyển khoản để chủ sân xác nhận thanh toán
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {selectedBooking && (
              <Alert>
                <AlertDescription className="text-sm">
                  <strong>Booking #{selectedBooking.id}</strong>
                  <br />
                  Số tiền: <strong className="text-primary">{formatCurrency(selectedBooking.total_price)}</strong>
                </AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="payment-proof">Chọn ảnh chứng từ</Label>
              <Input
                id="payment-proof"
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                disabled={uploading}
              />
              <p className="text-xs text-muted-foreground">
                Chấp nhận file: JPG, PNG, JPEG. Tối đa 5MB
              </p>
            </div>

            {/* Preview */}
            {previewUrl && (
              <div className="space-y-2">
                <Label>Xem trước:</Label>
                <div className="border rounded-lg p-2 bg-muted/30">
                  <img 
                    src={previewUrl} 
                    alt="Preview" 
                    className="max-h-64 w-full object-contain rounded"
                  />
                </div>
              </div>
            )}

            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setShowUploadDialog(false)}
                disabled={uploading}
                className="flex-1"
              >
                Hủy
              </Button>
              <Button
                onClick={handleUploadPaymentProof}
                disabled={!uploadingFile || uploading}
                className="flex-1"
              >
                {uploading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Đang upload...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4 mr-2" />
                    Upload
                  </>
                )}
              </Button>
            </div>

            <Alert className="bg-yellow-50 border-yellow-200">
              <AlertCircle className="h-4 w-4 text-yellow-600" />
              <AlertDescription className="text-xs text-yellow-800">
                <strong>Lưu ý:</strong> Sau khi upload, chủ sân sẽ kiểm tra và xác nhận thanh toán. 
                Bạn sẽ nhận được thông báo khi booking được xác nhận.
              </AlertDescription>
            </Alert>
          </div>
        </DialogContent>
      </Dialog>

      {/* Online Payment Modal */}
      <Dialog open={showOnlinePayment} onOpenChange={setShowOnlinePayment}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-primary" />
              Thanh toán trực tuyến
            </DialogTitle>
            <DialogDescription>
              Chuyển khoản qua QR code bên dưới và upload chứng từ thanh toán.
            </DialogDescription>
          </DialogHeader>
          
          {loadingPaymentInfo ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : (
            <div className="space-y-4">
              {onlinePaymentBooking && (
                <Alert>
                  <AlertDescription className="text-sm">
                    <strong>Booking #{onlinePaymentBooking.id}</strong>
                    <br />
                    Số tiền: <strong className="text-primary">{formatCurrency(onlinePaymentBooking.total_price)}</strong>
                  </AlertDescription>
                </Alert>
              )}
              
              {/* QR code */}
              {paymentInfo?.qr_code_url ? (
                <div className="flex flex-col items-center gap-2">
                  <Label>Quét mã QR để chuyển khoản</Label>
                  <div 
                    className="border rounded-lg p-2 bg-muted/30 cursor-pointer hover:bg-muted/50 transition-colors"
                    onClick={() => setShowQRZoom(true)}
                    title="Click để phóng to"
                  >
                    <img 
                      src={paymentInfo.qr_code_url} 
                      alt="QR Code" 
                      className="w-64 h-64 object-contain"
                    />
                  </div>
                  <p className="text-xs text-blue-600 font-medium">Click vào QR để phóng to</p>
                  {paymentInfo.transfer_note && (
                    <p className="text-xs text-muted-foreground">
                      Nội dung chuyển khoản: <span className="font-semibold">{paymentInfo.transfer_note}</span>
                    </p>
                  )}
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2">
                  <Label>Quét mã QR để chuyển khoản</Label>
                  <div className="border rounded-lg p-2 bg-muted/30 flex items-center justify-center">
                    <ImageIcon className="w-32 h-32 text-muted-foreground" />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Nội dung chuyển khoản: <span className="font-semibold">BOOKING{onlinePaymentBooking?.id}</span>
                  </p>
                </div>
              )}
              
              {/* Instruction */}
              {paymentInfo?.instruction && (
                <Alert className="bg-blue-50 border-blue-200">
                  <AlertCircle className="h-4 w-4 text-blue-600" />
                  <AlertDescription className="text-xs text-blue-800">
                    {paymentInfo.instruction}
                  </AlertDescription>
                </Alert>
              )}
              
              {/* Owner contact info */}
              {paymentInfo?.owner_contact && (
                <div className="space-y-2 pt-2 border-t">
                  <p className="text-sm font-semibold text-gray-700">Thông tin chủ sân</p>
                  {paymentInfo.owner_contact.name && (
                    <div className="flex items-center gap-2 text-sm">
                      <Building2 className="w-3 h-3 text-muted-foreground" />
                      <span className="font-medium">{paymentInfo.owner_contact.name}</span>
                    </div>
                  )}
                  {paymentInfo.owner_contact.phone && (
                    <div className="flex items-center gap-2 text-sm">
                      <Phone className="w-3 h-3 text-muted-foreground" />
                      <a
                        href={`tel:${paymentInfo.owner_contact.phone}`}
                        className="text-blue-600 hover:underline"
                      >
                        {paymentInfo.owner_contact.phone}
                      </a>
                    </div>
                  )}
                  {paymentInfo.owner_contact.address && (
                    <div className="flex items-center gap-2 text-sm">
                      <MapPin className="w-3 h-3 text-muted-foreground" />
                      <span className="text-muted-foreground">{paymentInfo.owner_contact.address}</span>
                    </div>
                  )}
                </div>
              )}
              
              {/* Upload button */}
              <Alert className="bg-yellow-50 border-yellow-200">
                <AlertCircle className="h-4 w-4 text-yellow-600" />
                <AlertDescription className="text-xs text-yellow-800">
                  Sau khi chuyển khoản, vui lòng upload ảnh chứng từ để chủ sân xác nhận thanh toán.
                </AlertDescription>
              </Alert>
              <Button
                className="w-full"
                onClick={() => {
                  setShowOnlinePayment(false);
                  if (onlinePaymentBooking) handleOpenUploadDialog(onlinePaymentBooking);
                }}
              >
                <Upload className="w-4 h-4 mr-2" />
                Upload chứng từ thanh toán
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* QR Code Zoom Modal */}
      <Dialog open={showQRZoom} onOpenChange={setShowQRZoom}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Mã QR thanh toán</DialogTitle>
            <DialogDescription>
              Quét mã QR này để chuyển khoản
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col items-center gap-4 p-4">
            {paymentInfo?.qr_code_url && (
              <img 
                src={paymentInfo.qr_code_url} 
                alt="QR Code" 
                className="w-full max-w-lg h-auto object-contain"
              />
            )}
            {paymentInfo?.transfer_note && (
              <Alert>
                <AlertDescription className="text-center">
                  <strong>Nội dung chuyển khoản:</strong>
                  <br />
                  <span className="text-lg font-bold text-primary">{paymentInfo.transfer_note}</span>
                </AlertDescription>
              </Alert>
            )}
            {onlinePaymentBooking && (
              <Alert>
                <AlertDescription className="text-center">
                  <strong>Số tiền:</strong>
                  <br />
                  <span className="text-xl font-bold text-primary">{formatCurrency(onlinePaymentBooking.total_price)}</span>
                </AlertDescription>
              </Alert>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MyBookings;