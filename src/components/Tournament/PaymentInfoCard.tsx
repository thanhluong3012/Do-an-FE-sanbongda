import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Phone, MapPin, User, Building2, Banknote, 
  CheckCircle, Clock, AlertCircle, Copy 
} from 'lucide-react';
import { Tournament } from '@/services/tournamentService';
import { useToast } from '@/hooks/use-toast';

interface PaymentInfoCardProps {
  tournament: Tournament;
  onPublish?: () => void;
  isPublishing?: boolean;
}

export const PaymentInfoCard = ({ tournament, onPublish, isPublishing }: PaymentInfoCardProps) => {
  const { toast } = useToast();

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: 'Đã sao chép',
      description: `${label} đã được sao chép vào clipboard`,
    });
  };

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
        {isPending && (
          <Alert className="bg-amber-50 border-amber-200">
            <Clock className="h-4 w-4 text-amber-600" />
            <AlertDescription className="text-sm text-amber-800">
              {isCash ? (
                <>
                  <strong>Chờ xác nhận từ chủ sân</strong>
                  <p className="text-xs mt-1">
                    Vui lòng liên hệ chủ sân để thanh toán tiền mặt. Sau khi chủ sân xác nhận, 
                    bạn có thể mở đăng ký giải đấu.
                  </p>
                </>
              ) : (
                <>
                  <strong>Chờ upload bill chuyển khoản</strong>
                  <p className="text-xs mt-1">
                    Vui lòng chuyển khoản và upload bill để chủ sân xác nhận.
                  </p>
                </>
              )}
            </AlertDescription>
          </Alert>
        )}

        {isPaid && (
          <Alert className="bg-green-50 border-green-200">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-sm text-green-800">
              <strong>Thanh toán thành công!</strong>
              <p className="text-xs mt-1">
                Bạn đã hoàn thành thanh toán. Bây giờ bạn có thể mở đăng ký giải đấu.
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
            className="w-full"
            size="lg"
          >
            {isPublishing ? (
              <>
                <Clock className="w-4 h-4 mr-2 animate-spin" />
                Đang mở đăng ký...
              </>
            ) : (
              <>
                <Banknote className="w-4 h-4 mr-2" />
                Mở đăng ký giải đấu ngay
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
