import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RegistrationRequest } from '@/services/registrationService';
import { Team } from '@/services/teamService';
import { useToast } from '@/hooks/use-toast';
import { Loader2, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface RegistrationFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: RegistrationRequest) => Promise<void>;
  tournamentId: number;
  teams: Team[];
  myTeams?: Team[]; // Teams where user is captain
}

export const RegistrationFormDialog = ({
  open,
  onOpenChange,
  onSubmit,
  tournamentId,
  teams,
  myTeams = []
}: RegistrationFormDialogProps) => {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedTeamId, setSelectedTeamId] = useState<number>(0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedTeamId) {
      toast({
        title: 'Lỗi',
        description: 'Vui lòng chọn đội bóng',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit({
        tournament_id: tournamentId,
        team_id: selectedTeamId,
      });
      toast({
        title: 'Thành công',
        description: 'Đã gửi đăng ký tham gia giải đấu',
      });
      onOpenChange(false);
      setSelectedTeamId(0);
    } catch (error: any) {
      toast({
        title: 'Lỗi',
        description: error.response?.data?.message || 'Có lỗi xảy ra khi đăng ký',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const availableTeams = myTeams.length > 0 ? myTeams : teams;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Đăng ký tham gia giải đấu</DialogTitle>
          <DialogDescription>
            Chọn đội bóng của bạn để đăng ký tham gia
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            {availableTeams.length === 0 ? (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Bạn chưa có đội bóng nào. Vui lòng tạo đội bóng trước khi đăng ký.
                </AlertDescription>
              </Alert>
            ) : (
              <div className="space-y-2">
                <Label htmlFor="team_id">
                  Chọn đội bóng <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={selectedTeamId?.toString()}
                  onValueChange={(value) => setSelectedTeamId(parseInt(value))}
                >
                  <SelectTrigger id="team_id">
                    <SelectValue placeholder="Chọn đội bóng" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableTeams.map((team) => (
                      <SelectItem key={team.id} value={team.id.toString()}>
                        {team.name}
                        {team.captain && ` • ${team.captain.name}`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Hủy
            </Button>
            <Button type="submit" disabled={isSubmitting || availableTeams.length === 0}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Đăng ký
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
