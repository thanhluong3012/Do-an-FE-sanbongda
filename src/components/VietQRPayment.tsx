import React, { useState, useEffect, useRef } from 'react';
import { vietqrService, VietQRPaymentResponse, VietQRStatusResponse } from '@/services/vietqrService';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, QrCode, CheckCircle2, XCircle, AlertCircle, Upload, Copy, CheckCheck } from 'lucide-react';
import { uploadImage } from '@/lib/storage';
import './VietQRPayment.css';

interface VietQRPaymentProps {
  bookingId: number;
  tournamentId?: number; // Nếu có tournamentId → thanh toán tournament
  amount: number;
  bookingInfo?: {
    fieldName?: string;
    date?: string;
    time?: string;
  };
  onSuccess?: (data: VietQRStatusResponse['data']) => void;
  onError?: (error: string) => void;
  onCancel?: () => void;
}

type PaymentStatus = 'idle' | 'showing_qr' | 'uploading_bill' | 'waiting_confirm' | 'paid' | 'failed';

const VietQRPayment: React.FC<VietQRPaymentProps> = ({ 
  bookingId, 
  tournamentId,
  amount, 
  bookingInfo = {},
  onSuccess, 
  onError,
  onCancel 
}) => {
  // States
  const [qrData, setQrData] = useState<VietQRPaymentResponse['data'] | null>(null);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<PaymentStatus>('idle');
  const [error, setError] = useState('');
  
  // Upload bill states
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);

  // Polling ref
  const pollingIntervalRef = useRef<number | null>(null);

  // Format số tiền
  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(value);
  };

  // Copy to clipboard
  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopied(label);
    setTimeout(() => setCopied(null), 2000);
  };

  // Tạo QR code
  const createQRCode = async () => {
    setLoading(true);
    setError('');
    
    try {
      // Nếu có tournamentId → gọi API thanh toán tournament
      const response = tournamentId 
        ? await vietqrService.createQRForTournament(tournamentId)
        : await vietqrService.createQR(bookingId);

      console.log('🎫 [VietQRPayment] QR Response:', {
        type: tournamentId ? 'tournament' : 'booking',
        id: tournamentId || bookingId,
        amount: response.data?.amount,
        qr_url: response.data?.qr_code_url,
      });

      if (response.success) {
        setQrData(response.data);
        setStatus('showing_qr');
      }
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Không thể tạo mã QR thanh toán. Vui lòng thử lại.';
      setError(errorMessage);
      if (onError) onError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Check payment status
  const checkPaymentStatus = async () => {
    try {
      // Nếu có tournamentId → check status tournament
      const response = tournamentId
        ? await vietqrService.checkStatusForTournament(tournamentId)
        : await vietqrService.checkStatus(bookingId);

      if (response.success) {
        const { payment_status, payment_proof } = response.data;
        
        if (payment_status === 'paid') {
          setStatus('paid');
          stopPolling();
          if (onSuccess) {
            setTimeout(() => onSuccess(response.data), 1500);
          }
        } else if (payment_status === 'pending' && payment_proof) {
          // Đã upload bill, đang chờ confirm
          if (status !== 'waiting_confirm') {
            setStatus('waiting_confirm');
          }
        } else if (payment_status === 'failed') {
          setStatus('failed');
          stopPolling();
          if (onError) onError('Thanh toán bị từ chối bởi chủ sân');
        }
      }
    } catch (err) {
      console.error('Check status error:', err);
    }
  };

  // Start polling
  const startPolling = () => {
    // Check ngay lần đầu
    checkPaymentStatus();
    
    // Sau đó check mỗi 10 giây
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

  // Handle file change
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Vui lòng chọn file ảnh (jpg, png, ...)');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('Kích thước file không được vượt quá 5MB');
      return;
    }

    setSelectedFile(file);
    setError('');

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviewUrl(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  // Upload bill
  const handleUploadBill = async () => {
    if (!selectedFile) {
      setError('Vui lòng chọn ảnh bill');
      return;
    }

    try {
      setUploading(true);
      setError('');

      console.log('🔵 [VietQR] Uploading file to Supabase Storage...');
      
      // Upload to storage
      const billUrl = await uploadImage(selectedFile, 'image', tournamentId ? 'tournament-payment-bills' : 'payment-bills');
      console.log('✅ [VietQR] File uploaded:', billUrl);
      
      // Send to backend - khác endpoint cho tournament vs booking
      const endpoint = tournamentId 
        ? `http://localhost:8000/api/tournaments/${tournamentId}/upload-payment-proof`
        : `http://localhost:8000/api/books/${bookingId}/upload-payment-proof`;
      
      console.log('📤 [VietQR] Posting to backend:', {
        endpoint,
        bookingId,
        tournamentId,
        billUrl,
      });
      
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${sessionStorage.getItem('access_token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          payment_proof_url: billUrl
        })
      });

      console.log('📥 [VietQR] Backend response status:', response.status, response.statusText);
      const data = await response.json();
      console.log('📥 [VietQR] Backend response data:', data);

      if (response.ok && (data.success !== false)) {
        console.log('✅ [VietQR] Upload successful');
        
        // Show success message and close dialog
        if (onSuccess) {
          onSuccess({
            booking_id: bookingId,
            tournament_id: tournamentId,
            payment_status: 'pending', // Đang chờ owner xác nhận
            payment_proof: billUrl,
          } as any);
        }
        
        // Close dialog
        handleCancel();
      } else {
        const errorMsg = data.message || data.error || 'Không thể upload bill';
        console.error('❌ [VietQR] Upload failed:', errorMsg);
        setError(errorMsg);
        
        if (onError) {
          onError(errorMsg);
        }
      }
    } catch (err: any) {
      console.error('❌ [VietQR] Exception:', err);
      const errorMsg = err.message || 'Có lỗi xảy ra khi upload bill';
      setError(errorMsg);
      
      if (onError) {
        onError(errorMsg);
      }
    } finally {
      setUploading(false);
    }
  };

  // Cancel
  const handleCancel = () => {
    stopPolling();
    setStatus('idle');
    setQrData(null);
    setSelectedFile(null);
    setPreviewUrl(null);
    if (onCancel) onCancel();
  };

  // Cleanup
  useEffect(() => {
    return () => {
      stopPolling();
    };
  }, []);

  // Render loading
  if (loading) {
    return (
      <Card className="vietqr-payment">
        <CardContent className="vietqr-loading">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-center text-muted-foreground">Đang tạo mã QR thanh toán...</p>
        </CardContent>
      </Card>
    );
  }

  // Render idle (chưa tạo QR)
  if (status === 'idle' && !qrData) {
    return (
      <Card className="vietqr-payment">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <QrCode className="h-6 w-6" />
            Thanh toán VietQR
          </CardTitle>
          <CardDescription>Quét mã QR để thanh toán nhanh chóng và miễn phí</CardDescription>
        </CardHeader>
        <CardContent className="vietqr-start space-y-4">
          <div className="payment-info space-y-4">
            <div className="amount-display">
              <span className="label">Số tiền thanh toán:</span>
              <span className="amount">{formatCurrency(amount)}</span>
            </div>
            {bookingInfo.fieldName && (
              <div className="booking-info space-y-2">
                <p><strong>Sân:</strong> {bookingInfo.fieldName}</p>
                <p><strong>Ngày:</strong> {bookingInfo.date}</p>
                <p><strong>Giờ:</strong> {bookingInfo.time}</p>
              </div>
            )}
          </div>
          
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <Button 
            className="w-full btn-create-payment" 
            onClick={createQRCode}
            disabled={loading}
            size="lg"
          >
            <QrCode className="mr-2 h-5 w-5" />
            Tạo mã QR thanh toán
          </Button>

          <div className="payment-note space-y-2 text-sm text-muted-foreground">
            <p>✓ Quét mã QR bằng ứng dụng Banking App</p>
            <p>✓ Hoàn toàn miễn phí, không mất phí giao dịch</p>
            <p>✓ Sau khi chuyển khoản, upload bill để xác nhận</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Render QR code
  if (status === 'showing_qr' && qrData) {
    return (
      <Card className="vietqr-payment">
        <CardHeader>
          <CardTitle className="text-center">Quét mã QR để thanh toán</CardTitle>
          <CardDescription className="text-center">
            Sau khi chuyển khoản thành công, vui lòng upload bill
          </CardDescription>
        </CardHeader>
        <CardContent className="vietqr-qr-container space-y-3 max-h-[70vh] overflow-y-auto">
          {/* Badge hiển thị loại tài khoản */}
          {qrData.account_info.is_owner_account !== undefined && (
            <Alert className={qrData.account_info.is_owner_account ? "bg-green-50 border-green-200" : "bg-blue-50 border-blue-200"}>
              <AlertCircle className={`h-4 w-4 ${qrData.account_info.is_owner_account ? "text-green-600" : "text-blue-600"}`} />
              <AlertDescription className={`text-sm ${qrData.account_info.is_owner_account ? "text-green-800" : "text-blue-800"}`}>
                {qrData.account_info.is_owner_account ? (
                  <>
                    <strong>👤 Thanh toán trực tiếp cho chủ sân</strong><br />
                    Tiền sẽ được chuyển vào tài khoản của chủ sân
                  </>
                ) : (
                  <>
                    <strong>🏢 Thanh toán qua hệ thống</strong><br />
                    Chủ sân chưa cập nhật tài khoản. Tiền sẽ chuyển qua hệ thống.
                  </>
                )}
              </AlertDescription>
            </Alert>
          )}

          {/* QR Code */}
          <div className="qr-wrapper flex justify-center py-2">
            <img 
              src={qrData.qr_code_url} 
              alt="Mã QR thanh toán VietQR"
              className="w-[220px] h-[220px] object-contain border-4 border-gray-200 rounded-lg shadow-md"
            />
          </div>

          {/* Thông tin thanh toán */}
          <div className="payment-details space-y-1.5">
            <div className="detail-row">
              <span className="label">Số tiền:</span>
              <span className="value amount">{qrData.amount_formatted}</span>
            </div>
            
            <div className="detail-row">
              <span className="label">Nội dung CK:</span>
              <div className="value-with-copy">
                <span className="value font-mono text-sm">{qrData.transfer_content}</span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => copyToClipboard(qrData.transfer_content, 'content')}
                >
                  {copied === 'content' ? <CheckCheck className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
            </div>

            <div className="detail-row">
              <span className="label">Ngân hàng:</span>
              <span className="value">{qrData.account_info.bank_id}</span>
            </div>

            <div className="detail-row">
              <span className="label">Số TK:</span>
              <div className="value-with-copy">
                <span className="value font-mono">{qrData.account_info.account_no}</span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => copyToClipboard(qrData.account_info.account_no, 'account')}
                >
                  {copied === 'account' ? <CheckCheck className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
            </div>

            <div className="detail-row">
              <span className="label">Tên TK:</span>
              <span className="value">{qrData.account_info.account_name}</span>
            </div>
          </div>

          {/* Instructions */}
          <Alert className="bg-blue-50 border-blue-200">
            <AlertCircle className="h-4 w-4 text-blue-600" />
            <AlertDescription className="text-sm text-blue-800">
              <strong>Lưu ý:</strong> {qrData.instruction}
            </AlertDescription>
          </Alert>

          {/* Upload Bill Section */}
          <div className="upload-section space-y-2">
            <h3 className="font-semibold text-sm">📸 Upload Bill Chuyển Khoản</h3>
            
            <div className="file-input-wrapper">
              <Input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                disabled={uploading}
                className="cursor-pointer"
              />
            </div>

            {previewUrl && (
              <div className="preview">
                <Label>Xem trước:</Label>
                <img src={previewUrl} alt="Bill preview" className="preview-image" />
              </div>
            )}

            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <Button
              className="w-full"
              onClick={handleUploadBill}
              disabled={!selectedFile || uploading}
            >
              {uploading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Đang upload...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4 mr-2" />
                  Upload Bill
                </>
              )}
            </Button>
          </div>

          <Button 
            variant="outline"
            className="w-full" 
            onClick={handleCancel}
            disabled={uploading}
          >
            Hủy
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Render waiting confirm (đã upload bill)
  if (status === 'waiting_confirm') {
    return (
      <Card className="vietqr-payment">
        <CardContent className="vietqr-waiting text-center py-8 space-y-4">
          <div className="waiting-icon mx-auto">
            <Loader2 className="h-20 w-20 text-blue-500 animate-spin" />
          </div>
          <h3 className="text-2xl font-bold">Đang chờ xác nhận</h3>
          <p className="text-muted-foreground">
            Đã upload bill thành công.<br />
            Vui lòng chờ chủ sân xác nhận thanh toán.
          </p>
          {previewUrl && (
            <div className="bill-preview">
              <Label>Bill của bạn:</Label>
              <img src={previewUrl} alt="Uploaded bill" className="preview-image mx-auto" />
            </div>
          )}
          <p className="text-sm text-muted-foreground italic">
            🔄 Trang này tự động làm mới mỗi 10 giây
          </p>
          <Button 
            variant="outline"
            onClick={() => {
              stopPolling();
              if (onCancel) onCancel();
            }}
          >
            Đóng
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Render success
  if (status === 'paid') {
    return (
      <Card className="vietqr-payment">
        <CardContent className="vietqr-success text-center py-8">
          <div className="success-icon mx-auto mb-4">
            <CheckCircle2 className="h-20 w-20 text-green-500" />
          </div>
          <h3 className="text-2xl font-bold mb-2">Thanh toán thành công!</h3>
          <p className="text-muted-foreground mb-4">Booking của bạn đã được xác nhận thanh toán.</p>
          <div className="success-amount text-3xl font-bold text-green-600 mb-4">
            {formatCurrency(amount)}
          </div>
          <p className="success-note text-sm text-muted-foreground italic">
            Bạn sẽ được chuyển về trang chi tiết booking...
          </p>
        </CardContent>
      </Card>
    );
  }

  // Render failed
  if (status === 'failed') {
    return (
      <Card className="vietqr-payment">
        <CardContent className="vietqr-failed text-center py-8 space-y-4">
          <div className="failed-icon mx-auto">
            <XCircle className="h-20 w-20 text-red-500" />
          </div>
          <h3 className="text-2xl font-bold">Thanh toán bị từ chối</h3>
          <p className="text-muted-foreground">Chủ sân đã từ chối xác nhận thanh toán.</p>
          <div className="space-y-2">
            <Button 
              className="w-full" 
              onClick={() => {
                setStatus('idle');
                setQrData(null);
                setSelectedFile(null);
                setPreviewUrl(null);
              }}
            >
              Thử lại
            </Button>
            <Button 
              variant="outline"
              className="w-full" 
              onClick={handleCancel}
            >
              Đóng
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return null;
};

export default VietQRPayment;
