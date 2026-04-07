import { useState, useEffect } from 'react';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { teamService, TeamMember, TeamMemberRequest } from '@/services/teamService';
import { Loader2, User } from 'lucide-react';

interface TeamMemberDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  teamId: number;
  /** Nếu truyền `member` thì là chế độ chỉnh sửa */
  member?: TeamMember | null;
  onSuccess: (member: TeamMember) => void;
}

const emptyForm: TeamMemberRequest = {
  player_name: '',
  code_id: '',
  jersey_number: undefined,
  position: '',
};

export const TeamMemberDialog = ({ open, onOpenChange, teamId, member, onSuccess }: TeamMemberDialogProps) => {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [form, setForm] = useState<TeamMemberRequest>(emptyForm);

  const isEdit = !!member;

  useEffect(() => {
    if (open) {
      setForm(
        member
          ? {
              player_name: member.player_name || '',
              code_id: member.code_id || '',
              jersey_number: member.jersey_number,
              position: member.position || '',
            }
          : emptyForm,
      );
    }
  }, [open, member]);

  const set = (field: keyof TeamMemberRequest) =>
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = field === 'jersey_number'
        ? e.target.value === '' ? undefined : Number(e.target.value)
        : e.target.value;
      setForm((prev) => ({ ...prev, [field]: value }));
    };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.player_name.trim()) {
      toast({ title: 'Thiếu thông tin', description: 'Tên cầu thủ không được để trống', variant: 'destructive' });
      return;
    }

    setIsSubmitting(true);
    try {
      const payload: TeamMemberRequest = {
        player_name: form.player_name.trim(),
        code_id: form.code_id?.trim() || undefined,
        jersey_number: form.jersey_number || undefined,
        position: form.position?.trim() || undefined,
      };

      const result = isEdit
        ? await teamService.updateMember(teamId, member!.id, payload)
        : await teamService.addMember(teamId, payload);

      toast({
        title: 'Thành công',
        description: isEdit ? 'Đã cập nhật thông tin thành viên' : 'Đã thêm thành viên mới',
      });
      onSuccess(result);
      onOpenChange(false);
    } catch (err: any) {
      toast({
        title: 'Lỗi',
        description: err.response?.data?.message || 'Có lỗi xảy ra',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-1">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <User className="w-5 h-5 text-primary" />
            </div>
            <div>
              <DialogTitle>{isEdit ? 'Chỉnh sửa thành viên' : 'Thêm thành viên'}</DialogTitle>
              <DialogDescription>
                {isEdit ? 'Cập nhật thông tin cầu thủ' : 'Điền thông tin để thêm cầu thủ vào đội'}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="player-name">
                Tên cầu thủ <span className="text-destructive">*</span>
              </Label>
              <Input
                id="player-name"
                placeholder="VD: Nguyễn Văn A"
                value={form.player_name}
                onChange={set('player_name')}
                disabled={isSubmitting}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="jersey-number">Số áo</Label>
                <Input
                  id="jersey-number"
                  type="number"
                  placeholder="VD: 10"
                  min={1}
                  max={99}
                  value={form.jersey_number ?? ''}
                  onChange={set('jersey_number')}
                  disabled={isSubmitting}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="position">Vị trí</Label>
                <Input
                  id="position"
                  placeholder="VD: forward, midfielder..."
                  value={form.position || ''}
                  onChange={set('position')}
                  disabled={isSubmitting}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="code-id">CMND / CCCD</Label>
              <Input
                id="code-id"
                placeholder="VD: 001234567890"
                value={form.code_id}
                onChange={set('code_id')}
                disabled={isSubmitting}
              />
            </div>
          </div>

          <DialogFooter className="mt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
              Hủy
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isEdit ? 'Lưu thay đổi' : 'Thêm cầu thủ'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
