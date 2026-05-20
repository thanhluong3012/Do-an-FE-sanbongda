import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { 
  Phone, MapPin, User, Building2, Banknote, 
  CheckCircle, Clock, AlertCircle, Copy, RefreshCw, QrCode, Upload, X, Loader2
} from 'lucide-react';
import { Tournament } from '@/services/tournamentService';
import { tournamentService } from '@/services/tournamentService';
import { vietqrService, VietQRPaymentResponse } from '@/services/vietqrService';
import { uploadImage } from '@/lib/storage';
import { useToast } from '@/hooks/use-toast';
import { useState, useEffect, useRef } from 'react';

interface PaymentInfoCardProps {
  tournament: Tournament;
  onPublish?: () => void;
  isPublishing?: boolean;
  onRefresh?: () => Promise<void>;
}

export const PaymentInfoCard = ({ tournament, onPublish, isPublishing, onRefresh }: PaymentInfoCardProps) => {
  const { toast } = useToast();
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // VietQR states
  const [qrData, setQrData] = useState<VietQRPaymentResponse['data'] | null>(null);
  const [loadingQR, setLoadingQR] = useState(false);
  const [showQR, setShowQR] = useState(false);
  
  // Upload bill states
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  
  // Polling for payment confirmation
  const pollingIntervalRef = useRef<number | null>(null);

  // DEBUG: Log tournament data nhận được
  console.log('🎫 [PaymentInfoCard] Tournament:', {
    id: tournament.id,
    name: tournament.name,
    payment_method: tournament.payment_method,
    payment_status: tournament.payment_status,
    status: tournament.status,
  });

  const handleRefresh = async () => {
    if (!onRefresh) return;
    setIsRefreshing(true);
    try {
      await onRefresh();
      toast({
        title: 'Đã cập nhật',
        description: 'Trạng thái thanh toán đã được cập nhật',
      });
    } catch (error) {
      toast({
        title: 'Lỗi',
        description: 'Không thể cập nhật trạng thái',
        variant: 'destructive',
      });
    } finally {
      setIsRefreshing(false);
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: 'Đã sao chép',
      description: `${label} đã được sao chép vào clipboard`,
    });
  };

  // Format currency
  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(value);
  };

  // Create QR Code for tournament
  const handleCreateQR = async () => {
    setLoadingQR(true);
    setUploadError('');
    
    console.log('🔵 [PaymentInfoCard] Creating QR for tournament:', {
      tournament_id: tournament.id,
      tournament_name: tournament.name,
      total_price: tournament.total_price,
      bookings_count: tournament.bookings?.length || 0,
    });
    
    try {
      const response = await vietqrService.createQRForTournament(tournament.id);
      
      console.log('✅ [PaymentInfoCard] QR Response:', {
        success: response.success,
        amount: response.data?.amount,
        amount_formatted: response.data?.amount_formatted,
        expected_total: tournament.total_price,
        match: response.data?.amount === tournament.total_price,
      });
      
      if (response.success) {
        // Verify amount matches tournament total_price
        if (tournament.total_price && response.data.amount !== tournament.total_price) {
          console.warn('⚠️ [PaymentInfoCard] Amount mismatch!', {
            qr_amount: response.data.amount,
            tournament_total: tournament.total_price,
          });
        }
        
        setQrData(response.data);
        setShowQR(true);
        startPolling();
      }
    } catch (err: any) {
      console.error('❌ [PaymentInfoCard] Create QR error:', err);
      const errorMessage = err.response?.data?.message || 'Không thể tạo mã QR thanh toán';
      setUploadError(errorMessage);
      toast({
        title: 'Lỗi',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setLoadingQR(false);
    }
  };

  // Handle file change
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setUploadError('Vui lòng chọn file ảnh (jpg, png, ...)');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setUploadError('Kích thước file không được vượt quá 5MB');
      return;
    }

    setSelectedFile(file);
    setUploadError('');

    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviewUrl(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  // Upload bill
  const handleUploadBill = async () => {
    if (!selectedFile) {
      setUploadError('Vui lòng chọn ảnh bill');
      return;
    }

    try {
      setUploading(true);
      setUploadError('');

      // Upload to storage
      const billUrl = await uploadImage(selectedFile, 'image', 'tournament-payment-bills');
      
      // Send to backend
      await tournamentService.uploadPaymentProofTournaments(tournament.id, billUrl);
      
      toast({
        title: 'Thành công',
        description: 'Đã upload bill thanh toán. Chờ chủ sân xác nhận.',
      });
      
      setShowQR(false);
      setSelectedFile(null);
      setPreviewUrl(null);
      
      // Refresh tournament data
      if (onRefresh) await onRefresh();
      
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Không thể upload bill';
      setUploadError(errorMessage);
      toast({
        title: 'Lỗi',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
    }
  };

  // Check payment status
  const checkPaymentStatus = async () => {
    try {
      const response = await vietqrService.checkStatusForTournament(tournament.id);
      if (response.success) {
        const { payment_status } = response.data;
        
        if (payment_status === 'paid') {
          stopPolling();
          toast({
            title: '✅ Thanh toán thành công',
            description: 'Chủ sân đã xác nhận thanh toán của bạn',
          });
          if (onRefresh) await onRefresh();
        }
      }
    } catch (err) {
      console.error('Check status error:', err);
    }
  };

  // Start polling
  const startPolling = () => {
    checkPaymentStatus();
    pollingIntervalRef.current = window.setInterval(() => {
      checkPaymentStatus();
    }, 10000);
  };

  // Stop polling
  const stopPolling = () => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }
  };

  // Cleanup
  useEffect(() => {
    return () => {
      stopPolling();
    };
  }, []);

  // Nếu không có payment info, không hiển thị gì
  if (!tournament.payment_method) return null;

  const isCash = tournament.payment_method === 'cash';
  const isPending = tournament.payment_status === 'pending';
  const isPaid = tournament.payment_status === 'paid';
  const isRejected = tournament.payment_status === 'rejected';

  return (
    <Card className="border-2 border-primary">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              {isCash ? '💵 Thanh toán tiền mặt' : '🏦 Thanh toán chuyển khoản'}
            </CardTitle>
            <CardDescription className="mt-2">
              {tournament.total_price && (
                <div className="text-2xl font-bold text-primary mt-2">
                  {tournament.total_price.toLocaleString('vi-VN')} ₫
                </div>
              )}
            </CardDescription>
          </div>
          <div>
            {isPending && (
              <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-300">
                <Clock className="w-3 h-3 mr-1" />
                Chờ thanh toán
              </Badge>
            )}
            {isPaid && (
              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-300">
                <CheckCircle className="w-3 h-3 mr-1" />
                Đã thanh toán
              </Badge>
            )}
            {isRejected && (
              <Badge variant="outline" className="bg-red-50 text-red-700 border-red-300">
                <AlertCircle className="w-3 h-3 mr-1" />
                Bị từ chối
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Thông tin liên hệ chủ sân - CHỈ hiển thị nếu là tiền mặt */}
        {isCash && tournament.field_cluster && (
          <>
            <Alert className="bg-blue-50 border-blue-200">
              <AlertDescription className="text-sm text-blue-800">
                <strong>📋 Hướng dẫn thanh toán:</strong>
                <ol className="list-decimal list-inside mt-2 space-y-1 text-xs">
                  <li>Liên hệ chủ sân qua số điện thoại bên dưới</li>
                  <li>Hẹn lịch đến sân để thanh toán tiền mặt</li>
                  <li>Chờ chủ sân xác nhận trên hệ thống</li>
                  <li>Sau khi được xác nhận, bạn có thể mở đăng ký giải</li>
                </ol>
              </AlertDescription>
            </Alert>

            <div className="border rounded-lg p-4 space-y-3 bg-gray-50">
              <h4 className="font-semibold text-sm flex items-center gap-2">
                <Building2 className="w-4 h-4" />
                Thông tin liên hệ chủ sân
              </h4>
              
              <div className="space-y-2 text-sm">
                {tournament.field_cluster.name && (
                  <div className="flex items-start gap-2">
                    <Building2 className="w-4 h-4 mt-0.5 text-muted-foreground" />
                    <div className="flex-1">
                      <div className="text-xs text-muted-foreground">Cụm sân</div>
                      <div className="font-medium">{tournament.field_cluster.name}</div>
                    </div>
                  </div>
                )}

                {tournament.field_cluster.address && (
                  <div className="flex items-start gap-2">
                    <MapPin className="w-4 h-4 mt-0.5 text-muted-foreground" />
                    <div className="flex-1">
                      <div className="text-xs text-muted-foreground">Địa chỉ</div>
                      <div>{tournament.field_cluster.address}</div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard(tournament.field_cluster!.address!, 'Địa chỉ')}
                    >
                      <Copy className="w-3 h-3" />
                    </Button>
                  </div>
                )}

                {/* Note: Số điện thoại owner cần thêm vào field_cluster */}
                <div className="flex items-start gap-2">
                  <Phone className="w-4 h-4 mt-0.5 text-muted-foreground" />
                  <div className="flex-1">
                    <div className="text-xs text-muted-foreground">Số điện thoại</div>
                    <div className="font-medium">
                      {/* TODO: Thêm phone vào field_cluster API response */}
                      <span className="text-muted-foreground text-xs">
                        (Xem trong chi tiết cụm sân)
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

        {/* Trạng thái thanh toán */}
        {isPending && !isCash && (
          <>
            {!showQR && !tournament.payment_proof ? (
              /* Chưa tạo QR và chưa upload bill */
              <>
                <Alert className="bg-blue-50 border-blue-200">
                  <AlertDescription className="text-sm text-blue-800">
                    <strong>📋 Hướng dẫn thanh toán VietQR:</strong>
                    <ol className="list-decimal list-inside mt-2 space-y-1 text-xs">
                      <li>Nhấn nút "Tạo mã QR" bên dưới</li>
                      <li>Quét mã QR bằng ứng dụng Banking</li>
                      <li>Chuyển khoản theo đúng nội dung</li>
                      <li>Upload ảnh bill để xác nhận</li>
                      <li>Chờ chủ sân xác nhận thanh toán</li>
                    </ol>
                  </AlertDescription>
                </Alert>

                {uploadError && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{uploadError}</AlertDescription>
                  </Alert>
                )}

                <Button 
                  onClick={handleCreateQR}
                  disabled={loadingQR}
                  className="w-full"
                  size="lg"
                >
                  {loadingQR ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Đang tạo mã QR...
                    </>
                  ) : (
                    <>
                      <QrCode className="w-5 h-5 mr-2" />
                      Tạo mã QR thanh toán
                    </>
                  )}
                </Button>
              </>
            ) : showQR && qrData ? (
              /* Hiển thị QR code */
              <div className="space-y-4">
                <Alert className="bg-blue-50 border-blue-200">
                  <AlertDescription className="text-center">
                    <strong>Quét mã QR để thanh toán</strong>
                    <p className="text-xs mt-1">Sau khi chuyển khoản, upload bill bên dưới</p>
                  </AlertDescription>
                </Alert>

                {/* QR Code Image */}
                <div className="flex justify-center p-4 bg-white rounded-lg border-2 border-dashed">
                  <img 
                    src={qrData.qr_code_url} 
                    alt="VietQR Code" 
                    className="w-64 h-64 object-contain"
                  />
                </div>

                {/* Thông tin chuyển khoản */}
                <div className="bg-gray-50 rounded-lg p-4 space-y-3 text-sm">
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Số tiền:</span>
                    <span className="font-bold text-lg text-primary">{qrData.amount_formatted}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Ngân hàng:</span>
                    <span className="font-medium">{qrData.account_info.bank_id}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Số tài khoản:</span>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{qrData.account_info.account_no}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(qrData.account_info.account_no, 'Số tài khoản')}
                      >
                        <Copy className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Chủ tài khoản:</span>
                    <span className="font-medium">{qrData.account_info.account_name}</span>
                  </div>
                  <div className="flex justify-between items-start">
                    <span className="text-muted-foreground">Nội dung CK:</span>
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-right">{qrData.transfer_content}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(qrData.transfer_content, 'Nội dung chuyển khoản')}
                      >
                        <Copy className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Upload bill section */}
                <div className="border-t pt-4 space-y-3">
                  <Label className="font-semibold">Upload bill chuyển khoản</Label>
                  
                  {previewUrl && (
                    <div className="relative inline-block">
                      <img src={previewUrl} alt="Bill preview" className="w-full max-w-xs rounded-lg border" />
                      <Button
                        variant="destructive"
                        size="sm"
                        className="absolute top-2 right-2"
                        onClick={() => {
                          setSelectedFile(null);
                          setPreviewUrl(null);
                        }}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  )}

                  {!previewUrl && (
                    <Input
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      disabled={uploading}
                    />
                  )}

                  {uploadError && (
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>{uploadError}</AlertDescription>
                    </Alert>
                  )}

                  <div className="flex gap-2">
                    <Button
                      onClick={handleUploadBill}
                      disabled={!selectedFile || uploading}
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
                          Upload bill
                        </>
                      )}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setShowQR(false);
                        setSelectedFile(null);
                        setPreviewUrl(null);
                      }}
                      disabled={uploading}
                    >
                      Hủy
                    </Button>
                  </div>
                </div>
              </div>
            ) : tournament.payment_proof ? (
              /* Đã upload bill, chờ xác nhận */
              <Alert className="bg-amber-50 border-amber-200">
                <Clock className="h-4 w-4 text-amber-600" />
                <AlertDescription className="text-sm text-amber-800">
                  <strong>Chờ chủ sân xác nhận</strong>
                  <p className="text-xs mt-1">
                    Bạn đã upload bill thanh toán. Vui lòng chờ chủ sân xác nhận.
                  </p>
                  {onRefresh && (
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={handleRefresh}
                      disabled={isRefreshing}
                      className="mt-3 bg-white"
                    >
                      {isRefreshing ? (
                        <>
                          <RefreshCw className="w-3 h-3 mr-2 animate-spin" />
                          Đang cập nhật...
                        </>
                      ) : (
                        <>
                          <RefreshCw className="w-3 h-3 mr-2" />
                          Kiểm tra trạng thái
                        </>
                      )}
                    </Button>
                  )}
                </AlertDescription>
              </Alert>
            ) : null}
          </>
        )}

        {isPending && isCash && (
          <Alert className="bg-amber-50 border-amber-200">
            <Clock className="h-4 w-4 text-amber-600" />
            <AlertDescription className="text-sm text-amber-800">
              <strong>Chờ xác nhận từ chủ sân</strong>
              <p className="text-xs mt-1">
                Vui lòng liên hệ chủ sân để thanh toán tiền mặt. Sau khi chủ sân xác nhận, 
                bạn có thể mở đăng ký giải đấu.
              </p>
              {onRefresh && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleRefresh}
                  disabled={isRefreshing}
                  className="mt-3 bg-white"
                >
                  {isRefreshing ? (
                    <>
                      <RefreshCw className="w-3 h-3 mr-2 animate-spin" />
                      Đang cập nhật...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="w-3 h-3 mr-2" />
                      Kiểm tra trạng thái thanh toán
                    </>
                  )}
                </Button>
              )}
            </AlertDescription>
          </Alert>
        )}

        {isPaid && (
          <Alert className="bg-green-50 border-green-300 border-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
            <AlertDescription className="text-sm text-green-900">
              <strong className="text-base">✅ Đã hoàn thành thanh toán!</strong>
              <p className="text-xs mt-2">
                Chủ sân đã xác nhận thanh toán của bạn. <strong>Bạn có thể mở đăng ký giải đấu ngay bây giờ!</strong>
              </p>
            </AlertDescription>
          </Alert>
        )}

        {isRejected && (
          <Alert className="bg-red-50 border-red-200">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-sm text-red-800">
              <strong>Thanh toán bị từ chối</strong>
              <p className="text-xs mt-1">
                Vui lòng liên hệ lại chủ sân để làm rõ lý do. Có thể bạn cần thanh toán lại.
              </p>
            </AlertDescription>
          </Alert>
        )}

        {/* Nút publish - chỉ hiển thị khi đã thanh toán và giải còn ở trạng thái draft */}
        {isPaid && tournament.status === 'draft' && onPublish && (
          <Button 
            onClick={onPublish} 
            disabled={isPublishing}
            className="w-full bg-green-600 hover:bg-green-700 text-white"
            size="lg"
          >
            {isPublishing ? (
              <>
                <Clock className="w-5 h-5 mr-2 animate-spin" />
                Đang mở đăng ký...
              </>
            ) : (
              <>
                <CheckCircle className="w-5 h-5 mr-2" />
                🎉 Mở đăng ký giải đấu ngay
              </>
            )}
          </Button>
        )}

        {/* Thông báo nếu chưa thanh toán và cố publish */}
        {!isPaid && tournament.status === 'draft' && (
          <Alert className="bg-red-50 border-red-200">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-sm text-red-800">
              <strong>Không thể mở đăng ký</strong>
              <p className="text-xs mt-1">
                Bạn cần hoàn thành thanh toán trước khi mở đăng ký giải đấu.
              </p>
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
};
