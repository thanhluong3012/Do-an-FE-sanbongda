import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScoreUpdateRequest } from '@/services/matchService';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface UpdateScoreDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: ScoreUpdateRequest) => Promise<void>;
  homeTeamName: string;
  awayTeamName: string;
}

export const UpdateScoreDialog = ({
  open,
  onOpenChange,
  onSubmit,
  homeTeamName,
  awayTeamName
}: UpdateScoreDialogProps) => {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [homeScore, setHomeScore] = useState<number>(0);
  const [awayScore, setAwayScore] = useState<number>(0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (homeScore < 0 || awayScore < 0) {
      toast({
        title: 'Lỗi',
        description: 'Tỷ số không được là số âm',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit({
        home_score: homeScore,
        away_score: awayScore,
        status: 'completed',
      });
      toast({
        title: 'Thành công',
        description: 'Đã cập nhật tỷ số trận đấu. Bảng xếp hạng sẽ được cập nhật tự động.',
      });
      onOpenChange(false);
      setHomeScore(0);
      setAwayScore(0);
    } catch (error: any) {
      toast({
        title: 'Lỗi',
        description: error.response?.data?.message || 'Có lỗi xảy ra khi cập nhật tỷ số',
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
          <DialogTitle>Cập nhật tỷ số</DialogTitle>
          <DialogDescription>
            Nhập tỷ số trận đấu đã kết thúc
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <Alert>
              <AlertDescription className="text-xs">
                Sau khi cập nhật tỷ số, hệ thống sẽ tự động:
                <ul className="list-disc list-inside mt-2 space-y-1">
                  <li>Tính điểm cho hai đội</li>
                  <li>Cập nhật bảng xếp hạng</li>
                  <li>Tiến đội thắng vào vòng sau (nếu là knockout)</li>
                </ul>
              </AlertDescription>
            </Alert>

            <div className="space-y-2">
              <Label htmlFor="home_score">
                {homeTeamName} <span className="text-destructive">*</span>
              </Label>
              <Input
                id="home_score"
                type="number"
                min="0"
                value={homeScore}
                onChange={(e) => setHomeScore(parseInt(e.target.value) || 0)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="away_score">
                {awayTeamName} <span className="text-destructive">*</span>
              </Label>
              <Input
                id="away_score"
                type="number"
                min="0"
                value={awayScore}
                onChange={(e) => setAwayScore(parseInt(e.target.value) || 0)}
                required
              />
            </div>

            <div className="p-4 bg-secondary/50 rounded-lg text-center">
              <div className="text-sm text-muted-foreground mb-2">Kết quả</div>
              <div className="text-3xl font-bold">
                {homeScore} - {awayScore}
              </div>
              <div className="text-sm text-muted-foreground mt-2">
                {homeScore > awayScore && `${homeTeamName} thắng`}
                {awayScore > homeScore && `${awayTeamName} thắng`}
                {homeScore === awayScore && 'Hòa'}
              </div>
            </div>
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
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Cập nhật tỷ số
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
