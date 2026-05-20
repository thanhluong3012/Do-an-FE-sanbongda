import { useEffect, useState } from 'react';
import RoleBasedLayout from '@/components/layout/RoleBasedLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Loader2, CheckCircle, XCircle, Eye, DollarSign, Calendar, MapPin } from 'lucide-react';
import { tournamentService, Tournament } from '@/services/tournamentService';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { useTournamentRealtimeSync, SyncMessage } from '@/hooks/useRealtimeSync';
import { useCallback } from 'react';

export default function OwnerPaymentConfirmation() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [selectedTournament, setSelectedTournament] = useState<Tournament | null>(null);
  const [viewDialog, setViewDialog] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [action, setAction] = useState<'approve' | 'reject'>('approve');
  const [note, setNote] = useState('');

  useEffect(() => {
    loadTournaments();
  }, []);

  // Real-time sync từ tab User khi upload payment
  const handleTournamentUpdate = useCallback((message: SyncMessage) => {
    console.log('🔔 [Owner Payment] Received update:', message);
    
    // Show notification
    if (message.type === 'payment_uploaded') {
      toast({
        title: '💰 Payment mới',
        description: 'Có tournament vừa upload bill thanh toán',
        duration: 5000,
      });
      // Reload danh sách
      loadTournaments();
    } else if (message.type === 'payment_confirmed' || message.type === 'payment_rejected') {
      // Reload khi có owner khác confirm/reject ở tab khác
      loadTournaments();
    }
  }, []);

  useTournamentRealtimeSync(handleTournamentUpdate);

  const loadTournaments = async () => {
    try {
      setLoading(true);
      // Get all tournaments for owner's field clusters
      const data = await tournamentService.getAll();
      console.log('🏟️ [Owner] All tournaments:', data);
      // Filter tournaments that need payment confirmation (payment_status = pending)
      // Bao gồm cả cash và vietqr
      const pendingPayments = data.filter(t => 
        t.payment_status === 'pending' && 
        (t.payment_method === 'vietqr' || t.payment_method === 'cash')
      );
      console.log('⏳ [Owner] Pending payment tournaments:', pendingPayments);
      setTournaments(pendingPayments);
    } catch (error: any) {
      console.error('Error loading tournaments:', error);
      toast({
        title: 'Lỗi',
        description: 'Không thể tải danh sách giải đấu',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleViewProof = (tournament: Tournament) => {
    setSelectedTournament(tournament);
    setViewDialog(true);
  };

  const handleOpenConfirm = (tournament: Tournament, actionType: 'approve' | 'reject') => {
    setSelectedTournament(tournament);
    setAction(actionType);
    setNote(actionType === 'approve' 
      ? `Đã nhận ${tournament.payment_method === 'cash' ? 'tiền mặt' : 'chuyển khoản'} đầy đủ`
      : ''
    );
    setConfirmDialog(true);
  };

  const { broadcast } = useTournamentRealtimeSync(handleTournamentUpdate);

  const handleConfirmPayment = async () => {
    if (!selectedTournament) return;

    const bookings: any[] = Array.isArray(selectedTournament.bookings)
      ? selectedTournament.bookings
      : [];

    if (bookings.length === 0) {
      toast({
        title: 'Lỗi',
        description: 'Không tìm thấy thông tin đặt sân của giải đấu này',
        variant: 'destructive',
      });
      return;
    }

    try {
      setConfirming(true);
      await tournamentService.confirmPaymentAllBookings(bookings, action, note);

      toast({
        title: 'Thành công',
        description: action === 'approve' 
          ? 'Đã xác nhận thanh toán thành công'
          : 'Đã từ chối thanh toán',
      });

      // Broadcast tới tab User để update real-time
      broadcast({
        type: action === 'approve' ? 'payment_confirmed' : 'payment_rejected',
        entityId: selectedTournament.id,
        entityType: 'tournament',
        relatedIds: {
          tournamentId: selectedTournament.id,
        },
      });

      setConfirmDialog(false);
      setViewDialog(false);
      setNote('');
      loadTournaments();
    } catch (error: any) {
      console.error('Error confirming payment:', error);
      toast({
        title: 'Lỗi',
        description: error?.response?.data?.message || 'Không thể xác nhận thanh toán',
        variant: 'destructive',
      });
    } finally {
      setConfirming(false);
    }
  };

  if (loading) {
    return (
      <RoleBasedLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </RoleBasedLayout>
    );
  }

  return (
    <RoleBasedLayout>
      <div className="container mx-auto p-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold">Xác Nhận Thanh Toán</h1>
          <p className="text-muted-foreground mt-2">
            Danh sách giải đấu chờ xác nhận thanh toán
          </p>
        </div>

        {tournaments.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <DollarSign className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
              <p className="text-lg font-semibold mb-2">Không có thanh toán chờ xác nhận</p>
              <p className="text-muted-foreground">
                Tất cả thanh toán đã được xử lý
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {tournaments.map((tournament) => (
              <Card key={tournament.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="flex items-center gap-2">
                        {tournament.name}
                        <Badge variant="outline" className="ml-2">
                          Chờ xác nhận
                        </Badge>
                        {tournament.payment_method === 'cash' ? (
                          <Badge variant="secondary" className="bg-green-100 text-green-700">
                            💵 Tiền mặt
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="bg-blue-100 text-blue-700">
                            🏦 Chuyển khoản
                          </Badge>
                        )}
                      </CardTitle>
                      <CardDescription className="mt-2 space-y-1">
                        <div className="flex items-center gap-2 text-sm">
                          <Calendar className="w-4 h-4" />
                          {format(new Date(tournament.start_date), 'dd/MM/yyyy', { locale: vi })} - {format(new Date(tournament.end_date), 'dd/MM/yyyy', { locale: vi })}
                        </div>
                        {tournament.field_cluster && (
                          <div className="flex items-center gap-2 text-sm">
                            <MapPin className="w-4 h-4" />
                            {tournament.field_cluster.name}
                          </div>
                        )}
                      </CardDescription>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground mb-1">Tổng tiền</p>
                      <p className="text-2xl font-bold text-primary">
                        {tournament.total_price?.toLocaleString('vi-VN')} ₫
                      </p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-3">
                    {tournament.payment_method === 'vietqr' && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleViewProof(tournament)}
                      >
                        <Eye className="w-4 h-4 mr-2" />
                        Xem bill
                      </Button>
                    )}
                    {tournament.payment_method === 'cash' && (
                      <div className="text-sm text-muted-foreground italic">
                        Thanh toán tiền mặt tại sân - Xác nhận sau khi nhận tiền
                      </div>
                    )}
                    <div className="flex-1"></div>
                    <Button
                      size="sm"
                      onClick={() => handleOpenConfirm(tournament, 'approve')}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Xác nhận
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleOpenConfirm(tournament, 'reject')}
                    >
                      <XCircle className="w-4 h-4 mr-2" />
                      Từ chối
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* View Payment Proof Dialog */}
        <Dialog open={viewDialog} onOpenChange={setViewDialog}>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle>
                {selectedTournament?.payment_method === 'cash' ? 'Xác nhận thanh toán tiền mặt' : 'Bill Chuyển Khoản'}
              </DialogTitle>
              <DialogDescription>
                Giải đấu: {selectedTournament?.name}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              {selectedTournament?.payment_method === 'cash' ? (
                <div className="text-center py-8 space-y-4">
                  <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto">
                    <DollarSign className="w-10 h-10 text-green-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold">Thanh toán tiền mặt</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      Khách hàng sẽ đến sân thanh toán trực tiếp.
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Vui lòng nhận tiền và xác nhận ngay sau khi giao dịch hoàn tất.
                    </p>
                  </div>
                </div>
              ) : (
                <>
                  {selectedTournament?.payment_proof_url ? (
                    <div className="border rounded-lg p-4">
                      <img
                        src={selectedTournament.payment_proof_url}
                        alt="Payment proof"
                        className="w-full h-auto object-contain max-h-[500px]"
                      />
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      Không có bill chuyển khoản
                    </div>
                  )}
                </>
              )}
              <div className="bg-muted rounded-lg p-4 space-y-2">
                <div className="flex justify-between">
                  <span className="font-medium">Tổng tiền:</span>
                  <span className="text-lg font-bold text-primary">
                    {selectedTournament?.total_price?.toLocaleString('vi-VN')} ₫
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Phương thức:</span>
                  <span>{selectedTournament?.payment_method === 'cash' ? '💵 Tiền mặt' : '🏦 Chuyển khoản'}</span>
                </div>
              </div>
            </div>
            <DialogFooter className="gap-2">
              <Button variant="outline" onClick={() => setViewDialog(false)}>
                Đóng
              </Button>
              <Button
                variant="destructive"
                onClick={() => {
                  setViewDialog(false);
                  handleOpenConfirm(selectedTournament!, 'reject');
                }}
              >
                <XCircle className="w-4 h-4 mr-2" />
                Từ chối
              </Button>
              <Button
                onClick={() => {
                  setViewDialog(false);
                  handleOpenConfirm(selectedTournament!, 'approve');
                }}
                className="bg-green-600 hover:bg-green-700"
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                Xác nhận
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Confirm Dialog */}
        <Dialog open={confirmDialog} onOpenChange={setConfirmDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {action === 'approve' ? 'Xác nhận thanh toán' : 'Từ chối thanh toán'}
              </DialogTitle>
              <DialogDescription>
                {action === 'approve'
                  ? `Bạn xác nhận đã nhận được ${selectedTournament?.payment_method === 'cash' ? 'tiền mặt' : 'chuyển khoản'} cho giải đấu này?`
                  : 'Bạn muốn từ chối thanh toán cho giải đấu này?'}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="bg-muted rounded-lg p-4 space-y-2">
                <div><span className="font-medium">Giải đấu:</span> {selectedTournament?.name}</div>
                <div><span className="font-medium">Tổng tiền:</span> {selectedTournament?.total_price?.toLocaleString('vi-VN')} ₫</div>
                <div>
                  <span className="font-medium">Phương thức:</span>{' '}
                  {selectedTournament?.payment_method === 'cash' ? '💵 Tiền mặt' : '🏦 Chuyển khoản'}
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="note">Ghi chú {action === 'reject' && <span className="text-destructive">*</span>}</Label>
                <Textarea
                  id="note"
                  placeholder={action === 'approve' 
                    ? 'VD: Đã nhận tiền mặt tại sân lúc 14:00 ngày 13/04/2026'
                    : 'VD: Khách hẹn nhưng không đến thanh toán'
                  }
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  rows={3}
                  required={action === 'reject'}
                />
                {action === 'reject' && !note && (
                  <p className="text-xs text-destructive">Vui lòng nhập lý do từ chối</p>
                )}
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setConfirmDialog(false)}>
                Hủy
              </Button>
              <Button
                onClick={handleConfirmPayment}
                disabled={confirming || (action === 'reject' && !note)}
                variant={action === 'approve' ? 'default' : 'destructive'}
              >
                {confirming ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Đang xử lý...
                  </>
                ) : (
                  <>
                    {action === 'approve' ? (
                      <>
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Xác nhận
                      </>
                    ) : (
                      <>
                        <XCircle className="w-4 h-4 mr-2" />
                        Từ chối
                      </>
                    )}
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </RoleBasedLayout>
  );
}
