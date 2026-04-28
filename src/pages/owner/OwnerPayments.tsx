import { useEffect, useState } from 'react';
import RoleBasedLayout from '@/components/layout/RoleBasedLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { 
  AlertCircle, Loader2, CheckCircle2, XCircle, Eye, DollarSign, 
  Calendar, Clock, User, Phone, Mail, Image as ImageIcon,
  TrendingUp, CreditCard, Wallet, Ban, Filter, RefreshCw, Banknote
} from 'lucide-react';
import { paymentService, PendingPayment, PaymentStatistics } from '@/services/paymentService';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';

const OwnerPayments = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [allBookings, setAllBookings] = useState<PendingPayment[]>([]);
  const [filteredBookings, setFilteredBookings] = useState<PendingPayment[]>([]);
  const [statistics, setStatistics] = useState<PaymentStatistics | null>(null);
  const [selectedPayment, setSelectedPayment] = useState<PendingPayment | null>(null);
  const [viewDialog, setViewDialog] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [action, setAction] = useState<'approve' | 'reject'>('approve');
  const [note, setNote] = useState('');
  
  // Filters
  const [filterPaymentMethod, setFilterPaymentMethod] = useState<string>('all');
  const [filterPaymentStatus, setFilterPaymentStatus] = useState<string>('all');
  const [filterBookingType, setFilterBookingType] = useState<string>('all');
  const [activeTab, setActiveTab] = useState<string>('all');

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [allBookings, filterPaymentMethod, filterPaymentStatus, filterBookingType, activeTab]);

  const loadData = async () => {
    setLoading(true);
    await Promise.all([
      loadAllBookings(),
      loadStatistics(),
    ]);
    setLoading(false);
  };

  const loadAllBookings = async () => {
    try {
      const data = await paymentService.getAllBookings();
      setAllBookings(data);
    } catch (error) {
      console.error('Error loading bookings:', error);
      toast({
        title: 'Lỗi',
        description: 'Không thể tải danh sách booking',
        variant: 'destructive',
      });
    }
  };

  const loadStatistics = async () => {
    try {
      const data = await paymentService.getPaymentStatistics();
      setStatistics(data);
    } catch (error) {
      console.error('Error loading statistics:', error);
    }
  };

  const formatCurrency = (amount: number | undefined | null) => {
    if (!amount) return '0 ₫';
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount);
  };

  const applyFilters = () => {
    let filtered = [...allBookings];

    // Filter by tab
    if (activeTab === 'need-confirm') {
      // Chờ xác nhận thanh toán
      filtered = filtered.filter(b => {
        const isPending = b.payment_status === 'pending' || !b.payment_status;
        
        // Transfer: Đã upload bill và chưa xác nhận
        if (b.payment_method === 'transfer') {
          return isPending && b.payment_proof_url;
        }
        
        // Cash: Chưa xác nhận (không cần bill)
        if (b.payment_method === 'cash') {
          return isPending;
        }
        
        // Tournament booking: Chưa xác nhận (giải đấu không cần bill)
        if (b.booking_type === 'tournament') {
          return isPending;
        }
        
        return false;
      });
    } else if (activeTab === 'not-paid') {
      // Chưa thanh toán (chỉ transfer chưa upload bill)
      filtered = filtered.filter(b => 
        b.payment_method === 'transfer' &&
        (b.payment_status === 'pending' || !b.payment_status) &&
        !b.payment_proof_url
      );
    } else if (activeTab === 'paid') {
      // Đã thanh toán (cả transfer và cash)
      filtered = filtered.filter(b => b.payment_status === 'paid');
    }

    // Filter by payment method
    if (filterPaymentMethod !== 'all') {
      filtered = filtered.filter(b => b.payment_method === filterPaymentMethod);
    }

    // Filter by payment status
    if (filterPaymentStatus !== 'all') {
      filtered = filtered.filter(b => 
        filterPaymentStatus === 'paid' 
          ? b.payment_status === 'paid'
          : (b.payment_status === 'pending' || !b.payment_status)
      );
    }

    // Filter by booking type
    if (filterBookingType !== 'all') {
      filtered = filtered.filter(b => b.booking_type === filterBookingType);
    }

    setFilteredBookings(filtered);
  };

  const handleViewProof = (payment: PendingPayment) => {
    setSelectedPayment(payment);
    setViewDialog(true);
  };

  const handleOpenConfirm = (payment: PendingPayment, actionType: 'approve' | 'reject') => {
    setSelectedPayment(payment);
    setAction(actionType);
    
    let defaultNote = '';
    if (actionType === 'approve') {
      if (payment.booking_type === 'tournament') {
        defaultNote = 'Đã xác nhận thanh toán giải đấu';
      } else if (payment.payment_method === 'cash') {
        defaultNote = 'Đã nhận tiền mặt đầy đủ';
      } else {
        defaultNote = 'Đã nhận chuyển khoản đầy đủ';
      }
    }
    
    setNote(defaultNote);
    setConfirmDialog(true);
  };

  const handleConfirmPayment = async () => {
    if (!selectedPayment) return;

    try {
      setConfirming(true);
      const result = await paymentService.confirmPayment(selectedPayment.id, action, note);

      if (result.success) {
        toast({
          title: 'Thành công',
          description: result.message || (action === 'approve' 
            ? 'Đã xác nhận thanh toán thành công'
            : 'Đã từ chối thanh toán'),
        });

        setConfirmDialog(false);
        setViewDialog(false);
        setNote('');
        loadData();
      } else {
        toast({
          title: 'Lỗi',
          description: result.error || 'Không thể xác nhận thanh toán',
          variant: 'destructive',
        });
      }
    } catch (error: any) {
      console.error('Error confirming payment:', error);
      toast({
        title: 'Lỗi',
        description: 'Không thể xác nhận thanh toán',
        variant: 'destructive',
      });
    } finally {
      setConfirming(false);
    }
  };

  const getPaymentMethodBadge = (method?: string) => {
    if (method === 'transfer') {
      return (
        <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
          <CreditCard className="w-3 h-3 mr-1" />
          Chuyển khoản
        </Badge>
      );
    }
    return (
      <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
        <Wallet className="w-3 h-3 mr-1" />
        Tiền mặt
      </Badge>
    );
  };

  if (loading) {
    return (
      <RoleBasedLayout>
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto mb-4" />
            <p className="text-muted-foreground">Đang tải dữ liệu thanh toán...</p>
          </div>
        </div>
      </RoleBasedLayout>
    );
  }

  return (
    <RoleBasedLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Quản Lý Thanh Toán</h1>
          <p className="text-gray-500 mt-1">Xác nhận thanh toán từ khách hàng</p>
        </div>

        {/* Statistics Cards */}
        {statistics && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Chờ xác nhận</p>
                    <p className="text-2xl font-bold text-orange-600">{statistics.total_pending}</p>
                  </div>
                  <AlertCircle className="w-10 h-10 text-orange-200" />
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  {formatCurrency(statistics.pending_amount)}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Đã thanh toán</p>
                    <p className="text-2xl font-bold text-green-600">{statistics.total_paid}</p>
                  </div>
                  <CheckCircle2 className="w-10 h-10 text-green-200" />
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Tổng doanh thu: {formatCurrency(statistics.total_revenue)}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Chuyển khoản</p>
                    <p className="text-2xl font-bold text-blue-600">{statistics.transfer_count}</p>
                  </div>
                  <CreditCard className="w-10 h-10 text-blue-200" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Tiền mặt</p>
                    <p className="text-2xl font-bold text-green-600">{statistics.cash_count}</p>
                  </div>
                  <Wallet className="w-10 h-10 text-green-200" />
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Pending Payments List */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="w-5 h-5" />
                  Quản Lý Thanh Toán ({filteredBookings.length})
                </CardTitle>
                <CardDescription>
                  Tất cả booking và trạng thái thanh toán
                </CardDescription>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={loadData}
                disabled={loading}
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Làm mới
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {/* Filters */}
            <div className="flex flex-wrap gap-4 mb-6 p-4 bg-muted/30 rounded-lg">
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm font-medium">Bộ lọc:</span>
              </div>
              
              <Select value={filterPaymentMethod} onValueChange={setFilterPaymentMethod}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Phương thức" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả phương thức</SelectItem>
                  <SelectItem value="transfer">
                    <div className="flex items-center gap-2">
                      <CreditCard className="w-4 h-4" />
                      Chuyển khoản
                    </div>
                  </SelectItem>
                  <SelectItem value="cash">
                    <div className="flex items-center gap-2">
                      <Wallet className="w-4 h-4" />
                      Tiền mặt
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>

              <Select value={filterPaymentStatus} onValueChange={setFilterPaymentStatus}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Trạng thái" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả trạng thái</SelectItem>
                  <SelectItem value="pending">Chưa thanh toán</SelectItem>
                  <SelectItem value="paid">Đã thanh toán</SelectItem>
                </SelectContent>
              </Select>

              <Select value={filterBookingType} onValueChange={setFilterBookingType}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Loại booking" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả loại</SelectItem>
                  <SelectItem value="regular">Booking thường</SelectItem>
                  <SelectItem value="tournament">Booking giải đấu</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
              <TabsList className="grid w-full max-w-2xl grid-cols-4">
                <TabsTrigger value="all">
                  Tất cả ({allBookings.length})
                </TabsTrigger>
                <TabsTrigger value="need-confirm" className="text-orange-600">
                  Chờ xác nhận ({allBookings.filter(b => {
                    const isPending = b.payment_status === 'pending' || !b.payment_status;
                    return isPending && (
                      (b.payment_method === 'transfer' && b.payment_proof_url) ||
                      b.payment_method === 'cash' ||
                      b.booking_type === 'tournament'
                    );
                  }).length})
                </TabsTrigger>
                <TabsTrigger value="not-paid">
                  Chưa upload ({allBookings.filter(b => 
                    b.payment_method === 'transfer' && 
                    (b.payment_status === 'pending' || !b.payment_status) && 
                    !b.payment_proof_url
                  ).length})
                </TabsTrigger>
                <TabsTrigger value="paid" className="text-green-600">
                  Đã thanh toán ({allBookings.filter(b => b.payment_status === 'paid').length})
                </TabsTrigger>
              </TabsList>

              {/* Content for all tabs */}
              <TabsContent value={activeTab} className="space-y-4">
                {filteredBookings.length === 0 ? (
                  <div className="text-center py-12">
                    <CheckCircle2 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      Không có booking nào
                    </h3>
                    <p className="text-gray-500">
                      {activeTab === 'need-confirm' && 'Không có booking nào chờ xác nhận'}
                      {activeTab === 'not-paid' && 'Không có booking nào chưa upload bill'}
                      {activeTab === 'paid' && 'Không có booking nào đã thanh toán'}
                      {activeTab === 'all' && 'Chưa có booking nào'}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {filteredBookings.map((payment) => {
                      // Determine status color
                      const isPending = payment.payment_status === 'pending' || !payment.payment_status;
                      const needConfirm = isPending && (
                        (payment.payment_method === 'transfer' && payment.payment_proof_url) ||
                        payment.payment_method === 'cash' ||
                        payment.booking_type === 'tournament'
                      );
                      const notUploaded = payment.payment_method === 'transfer' && 
                                        isPending && 
                                        !payment.payment_proof_url;
                      const isPaid = payment.payment_status === 'paid';
                      
                      const borderColor = needConfirm ? 'border-l-orange-400' : 
                                         isPaid ? 'border-l-green-400' : 
                                         'border-l-gray-300';

                      return (
                        <Card key={payment.id} className={`border-l-4 ${borderColor}`}>
                          <CardContent className="pt-6">
                            <div className="flex items-start justify-between mb-4">
                              <div>
                                <h3 className="font-semibold text-lg flex items-center gap-2">
                                  Booking #{payment.id}
                                  {getPaymentMethodBadge(payment.payment_method)}
                                  {payment.booking_type === 'tournament' && (
                                    <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
                                      🏆 Giải đấu
                                    </Badge>
                                  )}
                                </h3>
                                <p className="text-sm text-muted-foreground">
                                  Đặt lúc: {payment.created_at ? format(new Date(payment.created_at), 'dd/MM/yyyy HH:mm', { locale: vi }) : 'N/A'}
                                </p>
                              </div>
                              <div className="flex gap-2">
                                {isPaid && (
                                  <Badge className="bg-green-100 text-green-700 border-green-200">
                                    <CheckCircle2 className="w-3 h-3 mr-1" />
                                    Đã thanh toán
                                  </Badge>
                                )}
                                {needConfirm && (
                                  <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">
                                    <AlertCircle className="w-3 h-3 mr-1" />
                                    Chờ xác nhận
                                  </Badge>
                                )}
                                {notUploaded && (
                                  <Badge variant="outline" className="bg-gray-100 text-gray-700 border-gray-300">
                                    <Clock className="w-3 h-3 mr-1" />
                                    Chưa upload bill
                                  </Badge>
                                )}
                              </div>
                            </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        {/* Booking Info */}
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 text-sm">
                            <Calendar className="w-4 h-4 text-muted-foreground" />
                            <span>{format(new Date(payment.booking_date), 'EEEE, dd/MM/yyyy', { locale: vi })}</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm">
                            <Clock className="w-4 h-4 text-muted-foreground" />
                            <span>{payment.start_time?.substring(0, 5)} - {payment.end_time?.substring(0, 5)}</span>
                          </div>
                          {payment.field_cluster_name && (
                            <p className="text-sm text-muted-foreground">
                              <strong>Sân:</strong> {payment.field_cluster_name}
                              {payment.field_name && ` - ${payment.field_name}`}
                            </p>
                          )}
                        </div>

                        {/* Customer Info */}
                        <div className="space-y-2">
                          {payment.customer_name && (
                            <div className="flex items-center gap-2 text-sm">
                              <User className="w-4 h-4 text-muted-foreground" />
                              <span>{payment.customer_name}</span>
                            </div>
                          )}
                          {payment.customer_phone && (
                            <div className="flex items-center gap-2 text-sm">
                              <Phone className="w-4 h-4 text-muted-foreground" />
                              <span>{payment.customer_phone}</span>
                            </div>
                          )}
                          {payment.customer_email && (
                            <div className="flex items-center gap-2 text-sm">
                              <Mail className="w-4 h-4 text-muted-foreground" />
                              <span className="text-xs">{payment.customer_email}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Price */}
                      <div className="flex items-center justify-between p-3 bg-primary/5 rounded-lg mb-4">
                        <span className="font-medium">Tổng tiền:</span>
                        <span className="text-xl font-bold text-primary">
                          {formatCurrency(payment.total_price)}
                        </span>
                      </div>

                      {/* Payment Proof Status */}
                      {payment.payment_method === 'transfer' && payment.payment_proof_url && (
                        <Alert className="bg-blue-50 border-blue-200 mb-4">
                          <ImageIcon className="h-4 w-4 text-blue-600" />
                          <AlertDescription className="text-sm text-blue-800">
                            Khách hàng đã upload chứng từ thanh toán
                          </AlertDescription>
                        </Alert>
                      )}

                      {payment.payment_method === 'cash' && (
                        <Alert className="bg-amber-50 border-amber-200 mb-4">
                          <Banknote className="h-4 w-4 text-amber-600" />
                          <AlertDescription className="text-sm text-amber-800">
                            Thanh toán bằng tiền mặt - Không yêu cầu chứng từ
                          </AlertDescription>
                        </Alert>
                      )}

                      {payment.booking_type === 'tournament' && (
                        <Alert className="bg-purple-50 border-purple-200 mb-4">
                          <TrendingUp className="h-4 w-4 text-purple-600" />
                          <AlertDescription className="text-sm text-purple-800">
                            Thanh toán giải đấu - Không yêu cầu chứng từ
                          </AlertDescription>
                        </Alert>
                      )}

                      {payment.payment_status === 'paid' && payment.payment_note && (
                        <Alert className="bg-green-50 border-green-200 mb-4">
                          <CheckCircle2 className="h-4 w-4 text-green-600" />
                          <AlertDescription className="text-sm text-green-800">
                            <strong>Ghi chú xác nhận:</strong> {payment.payment_note}
                          </AlertDescription>
                        </Alert>
                      )}

                      {/* Actions */}
                      <div className="flex gap-2">
                        {/* Chỉ hiển thị actions cho bookings chờ xác nhận */}
                        {needConfirm && (
                          <>
                            {/* Nút xem bill chỉ cho transfer payment */}
                            {payment.payment_method === 'transfer' && payment.payment_proof_url && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleViewProof(payment)}
                              >
                                <Eye className="w-4 h-4 mr-2" />
                                Xem chứng từ
                              </Button>
                            )}
                            <Button
                              variant="default"
                              size="sm"
                              onClick={() => handleOpenConfirm(payment, 'approve')}
                              className="bg-green-600 hover:bg-green-700"
                            >
                              <CheckCircle2 className="w-4 h-4 mr-2" />
                              Xác nhận
                            </Button>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => handleOpenConfirm(payment, 'reject')}
                            >
                              <XCircle className="w-4 h-4 mr-2" />
                              Từ chối
                            </Button>
                          </>
                        )}
                        
                        {/* Nếu chưa upload, chỉ hiển thị thông tin */}
                        {notUploaded && (
                          <Alert className="bg-gray-50 border-gray-200 w-full">
                            <Clock className="h-4 w-4 text-gray-600" />
                            <AlertDescription className="text-sm text-gray-700">
                              Đang chờ khách hàng upload chứng từ thanh toán
                            </AlertDescription>
                          </Alert>
                        )}
                        
                        {/* Nếu đã thanh toán, có thể xem bill đã confirm (chỉ cho transfer) */}
                        {isPaid && payment.payment_method === 'transfer' && payment.payment_proof_url && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleViewProof(payment)}
                          >
                            <Eye className="w-4 h-4 mr-2" />
                            Xem chứng từ đã xác nhận
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </CardContent>
  </Card>
</div>

      {/* View Payment Proof Dialog */}
      <Dialog open={viewDialog} onOpenChange={setViewDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ImageIcon className="w-5 h-5" />
              Chứng Từ Thanh Toán - Booking #{selectedPayment?.id}
            </DialogTitle>
            <DialogDescription>
              {selectedPayment && (
                <>
                  Khách hàng: <strong>{selectedPayment.customer_name}</strong>
                </>
              )}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 overflow-y-auto flex-1 pr-2">
            {/* Booking Info Summary */}
            {selectedPayment && (
              <Card>
                <CardContent className="pt-4">
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <p className="text-muted-foreground">Ngày đặt:</p>
                      <p className="font-medium">
                        {format(new Date(selectedPayment.booking_date), 'dd/MM/yyyy', { locale: vi })}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Giờ:</p>
                      <p className="font-medium">
                        {selectedPayment.start_time?.substring(0, 5)} - {selectedPayment.end_time?.substring(0, 5)}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Phương thức:</p>
                      {getPaymentMethodBadge(selectedPayment.payment_method)}
                    </div>
                    <div>
                      <p className="text-muted-foreground">Số điện thoại:</p>
                      <p className="font-medium">{selectedPayment.customer_phone || 'N/A'}</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-primary/5 rounded-lg mt-3">
                    Số tiền: <strong className="text-primary">{formatCurrency(selectedPayment.total_price)}</strong>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Payment Proof Image */}
            {selectedPayment?.payment_proof_url ? (
              <div className="border rounded-lg p-2 bg-muted/30">
                <div className="relative max-h-[50vh] overflow-auto bg-white rounded">
                  <img 
                    src={selectedPayment.payment_proof_url} 
                    alt="Chứng từ thanh toán" 
                    className="w-full h-auto object-contain"
                  />
                </div>
                <div className="mt-2 text-center">
                  <a 
                    href={selectedPayment.payment_proof_url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-xs text-primary hover:underline inline-flex items-center gap-1"
                  >
                    <Eye className="w-3 h-3" />
                    Xem ảnh đầy đủ trong tab mới
                  </a>
                </div>
              </div>
            ) : (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Khách hàng chưa upload chứng từ thanh toán
                </AlertDescription>
              </Alert>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setViewDialog(false)}>
              Đóng
            </Button>
            {selectedPayment && (
              <>
                <Button
                  variant="destructive"
                  onClick={() => {
                    setViewDialog(false);
                    handleOpenConfirm(selectedPayment, 'reject');
                  }}
                >
                  <XCircle className="w-4 h-4 mr-2" />
                  Từ chối
                </Button>
                <Button
                  onClick={() => {
                    setViewDialog(false);
                    handleOpenConfirm(selectedPayment, 'approve');
                  }}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  Xác nhận thanh toán
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirm Payment Dialog */}
      <Dialog open={confirmDialog} onOpenChange={setConfirmDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {action === 'approve' ? (
                <>
                  <CheckCircle2 className="w-5 h-5 text-green-600" />
                  Xác Nhận Thanh Toán
                </>
              ) : (
                <>
                  <XCircle className="w-5 h-5 text-red-600" />
                  Từ Chối Thanh Toán
                </>
              )}
            </DialogTitle>
            <DialogDescription>
              {selectedPayment && (
                <>
                  Booking #{selectedPayment.id} - {selectedPayment.customer_name} - 
                  <strong className="text-primary"> {formatCurrency(selectedPayment.total_price)}</strong>
                </>
              )}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {action === 'approve' ? (
              <Alert className="bg-green-50 border-green-200">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-800">
                  Sau khi xác nhận, booking sẽ chuyển sang trạng thái <strong>"Đã thanh toán"</strong> và 
                  khách hàng sẽ nhận được thông báo.
                </AlertDescription>
              </Alert>
            ) : (
              <Alert className="bg-red-50 border-red-200">
                <Ban className="h-4 w-4 text-red-600" />
                <AlertDescription className="text-red-800">
                  Booking sẽ bị từ chối và khách hàng cần upload lại chứng từ thanh toán hợp lệ.
                </AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="note">Ghi chú {action === 'reject' && '(bắt buộc)'}</Label>
              <Textarea
                id="note"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder={action === 'approve' 
                  ? "Ví dụ: Đã nhận tiền đầy đủ"
                  : "Ví dụ: Chứng từ không rõ ràng, vui lòng upload lại"
                }
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setConfirmDialog(false)}
              disabled={confirming}
            >
              Hủy
            </Button>
            <Button
              onClick={handleConfirmPayment}
              disabled={confirming || (action === 'reject' && !note.trim())}
              variant={action === 'approve' ? 'default' : 'destructive'}
              className={action === 'approve' ? 'bg-green-600 hover:bg-green-700' : ''}
            >
              {confirming ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Đang xử lý...
                </>
              ) : action === 'approve' ? (
                <>
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  Xác nhận
                </>
              ) : (
                <>
                  <XCircle className="w-4 h-4 mr-2" />
                  Từ chối
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </RoleBasedLayout>
  );
};

export default OwnerPayments;
