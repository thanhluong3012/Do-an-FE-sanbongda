import { useEffect, useState } from 'react';
import RoleBasedLayout from '@/components/layout/RoleBasedLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Loader2, CheckCircle, XCircle, Eye, DollarSign, Calendar, MapPin } from 'lucide-react';
import { tournamentService, Tournament } from '@/services/tournamentService';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';

export default function OwnerPaymentConfirmation() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [selectedTournament, setSelectedTournament] = useState<Tournament | null>(null);
  const [viewDialog, setViewDialog] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [action, setAction] = useState<'approve' | 'reject'>('approve');

  useEffect(() => {
    loadTournaments();
  }, []);

  const loadTournaments = async () => {
    try {
      setLoading(true);
      // Get all tournaments for owner's field clusters
      const data = await tournamentService.getAll();
      // Filter tournaments that need payment confirmation (payment_status = pending)
      const pendingPayments = data.filter(t => 
        t.payment_status === 'pending' && 
        t.payment_method === 'transfer'
      );
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
    setConfirmDialog(true);
  };

  const handleConfirmPayment = async () => {
    if (!selectedTournament) return;

    try {
      setConfirming(true);
      await tournamentService.confirmPayment(selectedTournament.id, action);

      toast({
        title: 'Thành công',
        description: action === 'approve' 
          ? 'Đã xác nhận thanh toán thành công'
          : 'Đã từ chối thanh toán',
      });

      setConfirmDialog(false);
      setViewDialog(false);
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
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleViewProof(tournament)}
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      Xem bill
                    </Button>
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
              <DialogTitle>Bill Chuyển Khoản</DialogTitle>
              <DialogDescription>
                Giải đấu: {selectedTournament?.name}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
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
              <div className="bg-muted rounded-lg p-4 space-y-2">
                <div className="flex justify-between">
                  <span className="font-medium">Tổng tiền:</span>
                  <span className="text-lg font-bold text-primary">
                    {selectedTournament?.total_price?.toLocaleString('vi-VN')} ₫
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Phương thức:</span>
                  <span>Chuyển khoản</span>
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
                  ? 'Bạn xác nhận đã nhận được tiền chuyển khoản cho giải đấu này?'
                  : 'Bạn muốn từ chối thanh toán cho giải đấu này?'}
              </DialogDescription>
            </DialogHeader>
            <div className="bg-muted rounded-lg p-4 space-y-2">
              <div><span className="font-medium">Giải đấu:</span> {selectedTournament?.name}</div>
              <div><span className="font-medium">Tổng tiền:</span> {selectedTournament?.total_price?.toLocaleString('vi-VN')} ₫</div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setConfirmDialog(false)}>
                Hủy
              </Button>
              <Button
                onClick={handleConfirmPayment}
                disabled={confirming}
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
