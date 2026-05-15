import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tournament, tournamentService } from '@/services/tournamentService';
import { TournamentStatusBadge, TournamentFormatBadge } from '@/components/Tournament/TournamentStatusBadge';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { Trophy, Plus, Loader2, AlertCircle, RefreshCw, Calendar, Users, MapPin, Megaphone, DollarSign, CheckCircle2, Clock, XCircle, FlagOff } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';

const MyTournaments = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [publishingId, setPublishingId] = useState<number | null>(null);
  const [completingId, setCompletingId] = useState<number | null>(null);
  const [confirmCompleteId, setConfirmCompleteId] = useState<number | null>(null);
  const [showDeleted, setShowDeleted] = useState(true); // Hiển thị giải đã xóa

  // Check authentication
  useEffect(() => {
    if (!user) {
      toast({
        title: 'Yêu cầu đăng nhập',
        description: 'Vui lòng đăng nhập để xem giải đấu của bạn',
        variant: 'destructive',
      });
      navigate('/auth');
      return;
    }
    loadMyTournaments();
  }, [user, navigate, toast]);

  const loadMyTournaments = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await tournamentService.getMyTournaments();
      setTournaments(Array.isArray(data) ? data : []);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Không thể tải danh sách giải đấu. Vui lòng thử lại sau.');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePublish = async (tournament: Tournament) => {
    setPublishingId(tournament.id);
    try {
      await tournamentService.publish(tournament.id);
      toast({
        title: 'Thành công',
        description: `Giải đấu "${tournament.name}" đã mở đăng ký!`,
      });
      await loadMyTournaments();
    } catch (err: any) {
      toast({
        title: 'Lỗi',
        description: err.response?.data?.message || 'Không thể mở đăng ký giải đấu',
        variant: 'destructive',
      });
    } finally {
      setPublishingId(null);
    }
  };

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'dd/MM/yyyy', { locale: vi });
    } catch {
      return dateString;
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount);
  };

  const getPaymentStatusBadge = (paymentStatus?: string) => {
    if (!paymentStatus) return null;
    
    const statusConfig = {
      pending: { label: 'Chờ thanh toán', className: 'bg-yellow-100 text-yellow-800 border-yellow-300', icon: Clock },
      paid: { label: 'Đã thanh toán', className: 'bg-green-100 text-green-800 border-green-300', icon: CheckCircle2 },
      rejected: { label: 'Bị từ chối', className: 'bg-red-100 text-red-800 border-red-300', icon: XCircle },
      failed: { label: 'Thất bại', className: 'bg-red-100 text-red-800 border-red-300', icon: XCircle },
    };

    const config = statusConfig[paymentStatus as keyof typeof statusConfig];
    if (!config) return null;

    const Icon = config.icon;
    return (
      <Badge className={`${config.className} border gap-1`}>
        <Icon className="w-3 h-3" />
        {config.label}
      </Badge>
    );
  };

  const handleComplete = async (tournamentId: number) => {
    setCompletingId(tournamentId);
    try {
      await tournamentService.complete(tournamentId);
      toast({ title: 'Thành công', description: 'Giải đấu đã được kết thúc!' });
      await loadMyTournaments();
    } catch (err: any) {
      toast({
        title: 'Lỗi',
        description: err.response?.data?.message || 'Không thể kết thúc giải đấu',
        variant: 'destructive',
      });
    } finally {
      setCompletingId(null);
      setConfirmCompleteId(null);
    }
  };

  const handleRemoveDeleted = (tournamentId: number) => {
    setTournaments(prev => prev.filter(t => t.id !== tournamentId));
    toast({
      title: 'Đã xóa',
      description: 'Đã ẩn giải đấu khỏi danh sách',
    });
  };

  // Filter tournaments
  const filteredTournaments = showDeleted 
    ? tournaments 
    : tournaments.filter(t => t.status !== 'deleted');

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8 mt-20">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-4xl font-bold mb-2">Giải đấu của tôi</h1>
            <p className="text-muted-foreground">Quản lý các giải đấu bạn đã tạo</p>
          </div>
          <Button asChild className="gap-2">
            <Link to="/tournament/create">
              <Plus className="w-4 h-4" />
              Tạo giải đấu mới
            </Link>
          </Button>
        </div>

        {/* Loading */}
        {isLoading && (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        )}

        {/* Error */}
        {!isLoading && error && (
          <Card className="p-12">
            <div className="text-center">
              <AlertCircle className="w-16 h-16 text-destructive mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Lỗi tải dữ liệu</h3>
              <p className="text-muted-foreground mb-4">{error}</p>
              <Button onClick={loadMyTournaments} variant="outline" className="gap-2">
                <RefreshCw className="w-4 h-4" />
                Thử lại
              </Button>
            </div>
          </Card>
        )}

        {/* Empty */}
        {!isLoading && !error && filteredTournaments.length === 0 && (
          <Card className="p-12">
            <div className="text-center">
              <Trophy className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">
                {!showDeleted && tournaments.length > 0 
                  ? 'Chỉ có giải đã xóa'
                  : 'Chưa có giải đấu nào'
                }
              </h3>
              <p className="text-muted-foreground mb-4">
                {!showDeleted && tournaments.length > 0
                  ? 'Bật hiển thị giải đã xóa để xem tất cả'
                  : 'Hãy tạo giải đấu đầu tiên của bạn!'
                }
              </p>
              {!showDeleted && tournaments.length > 0 ? (
                <Button onClick={() => setShowDeleted(true)} variant="outline">
                  Hiện giải đã xóa
                </Button>
              ) : (
                <Button asChild>
                  <Link to="/tournament/create">
                    <Plus className="w-4 h-4 mr-2" />
                    Tạo giải đấu mới
                  </Link>
                </Button>
              )}
            </div>
          </Card>
        )}

        {/* Tournament list */}
        {!isLoading && !error && filteredTournaments.length > 0 && (
          <div className="space-y-4">
            {/* Filter toggle */}
            <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg border">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">
                  Hiển thị: {filteredTournaments.length} giải đấu
                </span>
                {tournaments.some(t => t.status === 'deleted') && (
                  <Badge variant="outline" className="text-xs">
                    {tournaments.filter(t => t.status === 'deleted').length} đã xóa
                  </Badge>
                )}
              </div>
              {tournaments.some(t => t.status === 'deleted') && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowDeleted(!showDeleted)}
                  className="gap-2"
                >
                  <XCircle className="w-4 h-4" />
                  {showDeleted ? 'Ẩn giải đã xóa' : 'Hiện giải đã xóa'}
                </Button>
              )}
            </div>

            {filteredTournaments.map((tournament) => {
              const isDeleted = tournament.status === 'deleted';
              
              return (
                <Card 
                  key={tournament.id} 
                  className={`hover:shadow-md transition-shadow ${isDeleted ? 'border-red-200 bg-red-50/30 opacity-75' : ''}`}
                >
                <CardContent className="pt-6">
                  <div className="flex flex-col md:flex-row justify-between gap-4">
                    {/* Left: Info */}
                    <div className="flex-1 space-y-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="text-xl font-bold">{tournament.name}</h2>
                        <TournamentStatusBadge status={tournament.status} />
                        <TournamentFormatBadge format={tournament.format} />
                      </div>

                      {tournament.description && (
                        <p className="text-muted-foreground text-sm line-clamp-2">
                          {tournament.description}
                        </p>
                      )}

                      <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                        {tournament.field_cluster && (
                          <span className="flex items-center gap-1">
                            <MapPin className="w-4 h-4" />
                            {tournament.field_cluster.name}
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <Users className="w-4 h-4" />
                          {tournament.registered_teams_count ?? 0} / {tournament.max_teams} đội
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          {formatDate(tournament.start_date)} – {formatDate(tournament.end_date)}
                        </span>
                      </div>

                      {/* Payment Information */}
                      {tournament.payment_method && (
                        <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg border">
                          <DollarSign className="w-5 h-5 text-primary flex-shrink-0" />
                          <div className="flex-1 space-y-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-sm font-medium">Thanh toán:</span>
                              <Badge variant="outline" className="text-xs">
                                {tournament.payment_method === 'transfer' ? '🏦 Chuyển khoản' : '💵 Tiền mặt'}
                              </Badge>
                              {getPaymentStatusBadge(tournament.payment_status)}
                            </div>
                            {tournament.total_price && (
                              <p className="text-sm font-semibold text-primary">
                                {formatCurrency(tournament.total_price)}
                              </p>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Deleted Tournament Alert */}
                      {isDeleted && (
                        <Alert className="border-red-300 bg-red-100">
                          <XCircle className="h-4 w-4 text-red-700" />
                          <AlertDescription className="text-sm text-red-900">
                            <p className="font-semibold mb-1">Giải đấu đã bị hủy</p>
                            {tournament.rejected_reason && (
                              <p className="text-xs mb-1">
                                <strong>Lý do:</strong> {tournament.rejected_reason}
                              </p>
                            )}
                            {tournament.deleted_bookings !== undefined && (
                              <p className="text-xs">
                                <strong>Booking bị xóa:</strong> {tournament.deleted_bookings} lượt sân
                              </p>
                            )}
                            <p className="text-xs mt-2 text-red-700">
                              💡 Bạn có thể tạo giải mới để tiếp tục tổ chức.
                            </p>
                          </AlertDescription>
                        </Alert>
                      )}

                      {/* Payment Failed Alert - Only for non-deleted */}
                      {!isDeleted && (tournament.payment_status === 'rejected' || tournament.payment_status === 'failed') && (
                        <Alert className="border-red-200 bg-red-50">
                          <XCircle className="h-4 w-4 text-red-600" />
                          <AlertDescription className="text-sm text-red-800">
                            Thanh toán bị từ chối bởi chủ sân. Vui lòng liên hệ để xử lý hoặc thanh toán lại.
                          </AlertDescription>
                        </Alert>
                      )}

                      {/* Payment Pending Alert */}
                      {!isDeleted && tournament.payment_status === 'pending' && tournament.payment_proof_url && (
                        <Alert className="border-blue-200 bg-blue-50">
                          <Clock className="h-4 w-4 text-blue-600" />
                          <AlertDescription className="text-sm text-blue-800">
                            Đã upload chứng từ thanh toán. Đang chờ chủ sân xác nhận.
                          </AlertDescription>
                        </Alert>
                      )}

                      {!isDeleted && tournament.status === 'draft' && (
                        <p className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded px-2 py-1 inline-block">
                          ⚠️ Giải đang ở trạng thái nháp, chưa hiển thị công khai
                        </p>
                      )}
                    </div>

                    {/* Right: Actions */}
                    <div className="flex flex-col gap-2 min-w-[160px]">
                      {isDeleted ? (
                        <>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleRemoveDeleted(tournament.id)}
                            className="w-full gap-2"
                          >
                            <XCircle className="w-4 h-4" />
                            Xóa khỏi danh sách
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            asChild
                            className="w-full gap-2"
                          >
                            <Link to="/tournament/create">
                              <Plus className="w-4 h-4" />
                              Tạo giải mới
                            </Link>
                          </Button>
                        </>
                      ) : (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => navigate(`/tournament/${tournament.id}`)}
                            className="w-full"
                          >
                            Xem chi tiết
                          </Button>

                          {tournament.status === 'draft' && (
                            <Button
                              size="sm"
                              className="w-full gap-2"
                              onClick={() => handlePublish(tournament)}
                              disabled={publishingId === tournament.id}
                            >
                              {publishingId === tournament.id ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <Megaphone className="w-4 h-4" />
                              )}
                              Mở đăng ký
                            </Button>
                          )}

                          {tournament.status === 'open' && (
                            <Button
                              variant="secondary"
                              size="sm"
                              className="w-full"
                              onClick={() => navigate(`/tournament/${tournament.id}?tab=registrations`)}
                            >
                              <Users className="w-4 h-4 mr-2" />
                              Duyệt đăng ký ({tournament.registered_teams_count ?? 0})
                            </Button>
                          )}

                          {(tournament.status === 'open' || tournament.status === 'in_progress') && (
                            <Button
                              variant="destructive"
                              size="sm"
                              className="w-full gap-2"
                              onClick={() => setConfirmCompleteId(tournament.id)}
                              disabled={completingId === tournament.id}
                            >
                              {completingId === tournament.id ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <FlagOff className="w-4 h-4" />
                              )}
                              Kết thúc giải
                            </Button>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
              );
            })}
          </div>
        )}
      </main>
      {/* Confirm complete dialog */}
      <AlertDialog open={confirmCompleteId !== null} onOpenChange={(open) => { if (!open) setConfirmCompleteId(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Kết thúc giải đấu?</AlertDialogTitle>
            <AlertDialogDescription>
              Hành động này sẽ kết thúc giải đấu và không thể hoàn tác. Bạn có chắc chắn muốn tiếp tục không?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={completingId !== null}>Hủy</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={completingId !== null}
              onClick={() => { if (confirmCompleteId !== null) void handleComplete(confirmCompleteId); }}
            >
              {completingId !== null ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Xác nhận kết thúc
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Footer />
    </div>
  );
};

export default MyTournaments;
