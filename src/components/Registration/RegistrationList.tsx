import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { TournamentRegistration } from '@/services/registrationService';
import { Check, X, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

interface RegistrationListProps {
  registrations: TournamentRegistration[];
  onApprove?: (id: number) => Promise<void>;
  onReject?: (id: number, reason: string) => Promise<void>;
  showActions?: boolean;
}

export const RegistrationList = ({
  registrations,
  onApprove,
  onReject,
  showActions = false
}: RegistrationListProps) => {
  const [rejectingId, setRejectingId] = useState<number | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  const getStatusBadge = (status: TournamentRegistration['status']) => {
    switch (status) {
      case 'pending':
        return (
          <Badge variant="outline" className="bg-yellow-50">
            <Clock className="w-3 h-3 mr-1" />
            Chờ duyệt
          </Badge>
        );
      case 'approved':
        return (
          <Badge variant="outline" className="bg-green-50 text-green-700">
            <Check className="w-3 h-3 mr-1" />
            Đã duyệt
          </Badge>
        );
      case 'rejected':
        return (
          <Badge variant="outline" className="bg-red-50 text-red-700">
            <X className="w-3 h-3 mr-1" />
            Bị từ chối
          </Badge>
        );
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const handleRejectClick = (id: number) => {
    setRejectingId(id);
    setRejectReason('');
  };

  const handleRejectConfirm = async () => {
    if (rejectingId && onReject) {
      await onReject(rejectingId, rejectReason);
      setRejectingId(null);
      setRejectReason('');
    }
  };

  if (registrations.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-muted-foreground">Chưa có đội nào đăng ký</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <div className="space-y-4">
        {registrations.map((registration) => (
          <Card key={registration.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 flex-1">
                  <Avatar className="w-12 h-12">
                    <AvatarImage src={registration.team?.logo} alt={registration.team?.name} />
                    <AvatarFallback>
                      {registration.team?.name ? getInitials(registration.team.name) : 'T'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <CardTitle className="text-lg">{registration.team?.name || 'N/A'}</CardTitle>
                    <CardDescription>
                      Đội trưởng: {registration.team?.captain?.name || 'N/A'}
                    </CardDescription>
                  </div>
                </div>
                {getStatusBadge(registration.status)}
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="text-sm text-muted-foreground">
                  Đăng ký: {format(new Date(registration.registered_at), 'dd/MM/yyyy HH:mm', { locale: vi })}
                </div>
                {showActions && registration.status === 'pending' && (
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-green-700 hover:bg-green-50"
                      onClick={() => onApprove?.(registration.id)}
                    >
                      <Check className="w-4 h-4 mr-1" />
                      Duyệt
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-red-700 hover:bg-red-50"
                      onClick={() => handleRejectClick(registration.id)}
                    >
                      <X className="w-4 h-4 mr-1" />
                      Từ chối
                    </Button>
                  </div>
                )}
              </div>
              {registration.status === 'rejected' && registration.rejection_reason && (
                <div className="mt-3 p-3 bg-red-50 rounded-md">
                  <p className="text-sm text-red-800">
                    <strong>Lý do từ chối:</strong> {registration.rejection_reason}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Reject Dialog */}
      <AlertDialog open={!!rejectingId} onOpenChange={() => setRejectingId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Từ chối đăng ký</AlertDialogTitle>
            <AlertDialogDescription>
              Vui lòng nhập lý do từ chối để thông báo cho đội bóng
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-2 py-4">
            <Label htmlFor="rejectReason">Lý do từ chối</Label>
            <Textarea
              id="rejectReason"
              placeholder="VD: Đội không đủ điều kiện tham gia..."
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              rows={4}
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction onClick={handleRejectConfirm} disabled={!rejectReason.trim()}>
              Xác nhận từ chối
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
