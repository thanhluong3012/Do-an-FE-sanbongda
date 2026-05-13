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
  const [homePenaltyScore, setHomePenaltyScore] = useState<number>(0);
  const [awayPenaltyScore, setAwayPenaltyScore] = useState<number>(0);

  const isTied = homeScore === awayScore;

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

    // Nếu hoà và knockout, bắt buộc nhập pen
    if (isTied && (homePenaltyScore === awayPenaltyScore)) {
      toast({
        title: 'Lỗi',
        description: 'Trận hoà cần có kết quả đá pen để xác định đội thắng',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const scoreData: ScoreUpdateRequest = {
        home_score: homeScore,
        away_score: awayScore,
        status: 'completed',
      };

      // Chỉ gửi penalty nếu hoà
      if (isTied) {
        scoreData.home_penalty_score = homePenaltyScore;
        scoreData.away_penalty_score = awayPenaltyScore;
      }

      await onSubmit(scoreData);
      toast({
        title: 'Thành công',
        description: 'Đã cập nhật tỷ số trận đấu. Bảng xếp hạng sẽ được cập nhật tự động.',
      });
      onOpenChange(false);
      setHomeScore(0);
      setAwayScore(0);
      setHomePenaltyScore(0);
      setAwayPenaltyScore(0);
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

            {/* Penalty shootout (chỉ hiện khi hoà) */}
            {isTied && (
              <div className="space-y-4 p-4 bg-amber-50 dark:bg-amber-950/20 border-2 border-amber-200 dark:border-amber-800 rounded-lg">
                <div className="text-center">
                  <div className="text-sm font-semibold text-amber-700 dark:text-amber-400 mb-2">
                    ⚽ Đá luân lưu (Penalty)
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Trận hoà cần xác định đội thắng qua đá pen
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="home_penalty_score">
                      {homeTeamName} (Pen) <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="home_penalty_score"
                      type="number"
                      min="0"
                      value={homePenaltyScore}
                      onChange={(e) => setHomePenaltyScore(parseInt(e.target.value) || 0)}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="away_penalty_score">
                      {awayTeamName} (Pen) <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="away_penalty_score"
                      type="number"
                      min="0"
                      value={awayPenaltyScore}
                      onChange={(e) => setAwayPenaltyScore(parseInt(e.target.value) || 0)}
                      required
                    />
                  </div>
                </div>

                {homePenaltyScore === awayPenaltyScore && (
                  <Alert variant="destructive">
                    <AlertDescription className="text-xs">
                      Penalty không thể hoà! Phải có đội thắng.
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            )}

            <div className="p-4 bg-secondary/50 rounded-lg text-center">
              <div className="text-sm text-muted-foreground mb-2">Kết quả</div>
              <div className="text-3xl font-bold">
                {homeScore} - {awayScore}
                {isTied && homePenaltyScore !== awayPenaltyScore && (
                  <span className="text-lg text-muted-foreground ml-2">
                    ({homePenaltyScore} - {awayPenaltyScore} pen)
                  </span>
                )}
              </div>
              <div className="text-sm text-muted-foreground mt-2">
                {!isTied && homeScore > awayScore && `${homeTeamName} thắng`}
                {!isTied && awayScore > homeScore && `${awayTeamName} thắng`}
                {isTied && homePenaltyScore > awayPenaltyScore && `${homeTeamName} thắng (pen)`}
                {isTied && awayPenaltyScore > homePenaltyScore && `${awayTeamName} thắng (pen)`}
                {isTied && homePenaltyScore === awayPenaltyScore && 'Hoà (cần nhập pen)'}
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
