import { useState, useEffect } from 'react';
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
  AlertCircle, CheckCircle2, XCircle, Loader2, Building2, Upload, Image as ImageIcon
} from 'lucide-react';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { bookingService, Booking } from '@/services/bookingService';
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

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { label: string; className: string; icon: any }> = {
      pending: {
        label: 'Chờ xác nhận',
        className: 'bg-yellow-100 text-yellow-800 border-yellow-300',
        icon: Clock,
      },
      confirmed: {
        label: 'Đã xác nhận',
        className: 'bg-green-100 text-green-800 border-green-300',
        icon: CheckCircle2,
      },
      cancelled: {
        label: 'Đã hủy',
        className: 'bg-red-100 text-red-800 border-red-300',
        icon: XCircle,
      },
      completed: {
        label: 'Hoàn thành',
        className: 'bg-blue-100 text-blue-800 border-blue-300',
        icon: CheckCircle2,
      },
    };

    const variant = variants[status] || variants.pending;
    const Icon = variant.icon;

    return (
      <Badge className={variant.className + ' border'}>
        <Icon className="w-3 h-3 mr-1" />
        {variant.label}
      </Badge>
    );
  };

  const filterBookings = (status?: string) => {
    if (!status) return bookings;
    return bookings.filter(b => b.status === status);
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

  const renderBookingCard = (booking: Booking) => {
    const bookingDateTime = new Date(booking.booking_date + 'T' + booking.start_time);
    const isPast = bookingDateTime < new Date();

    // Debug payment info
    console.log('🔍 Booking #' + booking.id + ' payment info:', {
      payment_method: booking.payment_method,
      payment_status: booking.payment_status,
      status: booking.status,
      payment_proof_url: booking.payment_proof_url
    });

    // Check if should show upload button - RELAXED CONDITIONS FOR DEBUG
    const shouldShowUpload = booking.payment_method === 'transfer' && 
                            (!booking.payment_status || booking.payment_status !== 'paid');
    
    console.log('🔍 Booking #' + booking.id + ' shouldShowUpload:', shouldShowUpload);

    return (
      <Card key={booking.id} className={`hover:shadow-lg transition-shadow ${isPast ? 'opacity-75' : ''}`}>
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
            {getStatusBadge(booking.status)}
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
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

          {/* Payment Info */}
          {booking.payment_method && (
            <div className="space-y-2 pt-2 border-t">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Phương thức thanh toán:</span>
                <Badge variant="outline" className="font-medium">
                  {booking.payment_method === 'transfer' ? '🏦 Chuyển khoản' : '💵 Tiền mặt'}
                </Badge>
              </div>
              
              {booking.payment_method === 'transfer' && (
                <>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Trạng thái thanh toán:</span>
                    <Badge 
                      variant={booking.payment_status === 'paid' ? 'default' : 'secondary'}
                      className={booking.payment_status === 'paid' ? 'bg-green-100 text-green-800' : ''}
                    >
                      {booking.payment_status === 'paid' ? '✓ Đã thanh toán' : '⏳ Chờ xác nhận'}
                    </Badge>
                  </div>
                  
                  {/* Message cho thanh toán đã upload bill hoặc đã xác nhận */}
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
                </>
              )}

              {/* Message cho thanh toán tiền mặt chưa xác nhận */}
              {booking.payment_method === 'cash' && 
               booking.payment_status !== 'paid' && 
               !booking.payment_proof_url && (
                <Alert className="bg-amber-50 border-amber-200">
                  <AlertCircle className="h-4 w-4 text-amber-600" />
                  <AlertDescription className="text-sm text-amber-800">
                    💵 Vui lòng liên hệ chủ sân để thanh toán tiền mặt tại địa điểm. Sau khi thanh toán, chủ sân sẽ xác nhận đơn đặt của bạn.
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}

          {/* Contact Info */}
          {(booking.customer_name || booking.customer_phone) && (
            <div className="space-y-2 pt-2 border-t">
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

          {/* Note */}
          {booking.note && (
            <div className="p-3 bg-muted/50 rounded-lg">
              <p className="text-sm">
                <span className="font-medium">Ghi chú:</span> {booking.note}
              </p>
            </div>
          )}

          {/* Actions */}
          <div className="space-y-2">
            {/* Upload Bill Button - RELAXED: only check payment_method and payment_status */}
            {booking.payment_method === 'transfer' && 
             (!booking.payment_status || booking.payment_status !== 'paid') && (
              <Button
                variant={booking.payment_proof_url ? "outline" : "default"}
                size="sm"
                className="w-full"
                onClick={() => handleOpenUploadDialog(booking)}
              >
                <Upload className="w-4 h-4 mr-2" />
                {booking.payment_proof_url ? 'Đổi chứng từ thanh toán' : 'Upload chứng từ thanh toán'}
              </Button>
            )}

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
                <p className="text-sm text-muted-foreground">Chờ xác nhận</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-2xl font-bold text-green-600">
                  {filterBookings('confirmed').length}
                </p>
                <p className="text-sm text-muted-foreground">Đã xác nhận</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-2xl font-bold text-blue-600">
                  {filterBookings('completed').length}
                </p>
                <p className="text-sm text-muted-foreground">Hoàn thành</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs for filtering */}
        <Tabs defaultValue="all" className="space-y-6">
          <TabsList className="grid w-full max-w-2xl grid-cols-5">
            <TabsTrigger value="all">
              Tất cả ({bookings.length})
            </TabsTrigger>
            <TabsTrigger value="pending">
              Chờ ({filterBookings('pending').length})
            </TabsTrigger>
            <TabsTrigger value="confirmed">
              Xác nhận ({filterBookings('confirmed').length})
            </TabsTrigger>
            <TabsTrigger value="completed">
              Hoàn thành ({filterBookings('completed').length})
            </TabsTrigger>
            <TabsTrigger value="cancelled">
              Đã hủy ({filterBookings('cancelled').length})
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
                {bookings.map(renderBookingCard)}
              </div>
            )}
          </TabsContent>

          <TabsContent value="pending" className="space-y-4">
            {filterBookings('pending').length === 0 ? (
              <Card className="p-12">
                <div className="text-center">
                  <AlertCircle className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">Không có đặt sân chờ xác nhận</p>
                </div>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filterBookings('pending').map(renderBookingCard)}
              </div>
            )}
          </TabsContent>

          <TabsContent value="confirmed" className="space-y-4">
            {filterBookings('confirmed').length === 0 ? (
              <Card className="p-12">
                <div className="text-center">
                  <CheckCircle2 className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">Không có đặt sân đã xác nhận</p>
                </div>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filterBookings('confirmed').map(renderBookingCard)}
              </div>
            )}
          </TabsContent>

          <TabsContent value="completed" className="space-y-4">
            {filterBookings('completed').length === 0 ? (
              <Card className="p-12">
                <div className="text-center">
                  <CheckCircle2 className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">Không có đặt sân hoàn thành</p>
                </div>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filterBookings('completed').map(renderBookingCard)}
              </div>
            )}
          </TabsContent>

          <TabsContent value="cancelled" className="space-y-4">
            {filterBookings('cancelled').length === 0 ? (
              <Card className="p-12">
                <div className="text-center">
                  <XCircle className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">Không có đặt sân đã hủy</p>
                </div>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filterBookings('cancelled').map(renderBookingCard)}
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
    </div>
  );
};

export default MyBookings;
