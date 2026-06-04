import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScoreUpdateRequest } from '@/services/matchService';
import { teamService, TeamMember } from '@/services/teamService';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Trash } from 'lucide-react';
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface UpdateScoreDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  // onSubmit now accepts optional penalties arrays
  onSubmit: (data: ScoreUpdateRequest) => Promise<void>;
  homeTeamName: string;
  awayTeamName: string;
  homeTeamId?: number | null;
  awayTeamId?: number | null;
}

export const UpdateScoreDialog = ({
  open,
  onOpenChange,
  onSubmit,
  homeTeamName,
  awayTeamName
  , homeTeamId, awayTeamId
}: UpdateScoreDialogProps) => {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [homeScore, setHomeScore] = useState<number>(0);
  const [awayScore, setAwayScore] = useState<number>(0);
  const [homePenaltyScore, setHomePenaltyScore] = useState<number>(0);
  const [awayPenaltyScore, setAwayPenaltyScore] = useState<number>(0);
  const [homeMembers, setHomeMembers] = useState<TeamMember[]>([]);
  const [awayMembers, setAwayMembers] = useState<TeamMember[]>([]);

  const [homeCards, setHomeCards] = useState<{ player_id: number; player_name: string; card_type: 'yellow' | 'red' }[]>([]);
  const [awayCards, setAwayCards] = useState<{ player_id: number; player_name: string; card_type: 'yellow' | 'red' }[]>([]);

  const [selectedHomePlayer, setSelectedHomePlayer] = useState<number | ''>('');
  const [selectedHomeCardType, setSelectedHomeCardType] = useState<'yellow' | 'red'>('yellow');
  const [selectedAwayPlayer, setSelectedAwayPlayer] = useState<number | ''>('');
  const [selectedAwayCardType, setSelectedAwayCardType] = useState<'yellow' | 'red'>('yellow');

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

      // Luôn gửi card penalties (dù có hoặc không)
      scoreData.home_penalties = homeCards.map(c => ({ player_id: c.player_id, card_type: c.card_type }));
      scoreData.away_penalties = awayCards.map(c => ({ player_id: c.player_id, card_type: c.card_type }));

      console.log('=== SCORE UPDATE REQUEST ===');
      console.log('homeCards state:', homeCards);
      console.log('awayCards state:', awayCards);
      console.log('scoreData.home_penalties:', scoreData.home_penalties);
      console.log('scoreData.away_penalties:', scoreData.away_penalties);
      console.log('Full scoreData:', scoreData);
      console.log('========================');

      await onSubmit(scoreData);
      toast({
        title: 'Thành công',
        description: 'Đã cập nhật tỷ số trận đấu. Bảng xếp hạng sẽ được cập nhật tự động.',
      });
      console.log('✅ Score update successful, closing dialog and resetting states');
      onOpenChange(false);
      setHomeScore(0);
      setAwayScore(0);
      setHomePenaltyScore(0);
      setAwayPenaltyScore(0);
      setHomeCards([]);
      setAwayCards([]);
      setSelectedHomePlayer('');
      setSelectedAwayPlayer('');
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

  // Load team members when dialog opens or team ids change
  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        if (homeTeamId) {
          const members = await teamService.getMembers(homeTeamId);
          if (mounted) setHomeMembers(members);
        }
        if (awayTeamId) {
          const members = await teamService.getMembers(awayTeamId);
          if (mounted) setAwayMembers(members);
        }
      } catch (err) {
        // ignore fetch errors here
      }
    };
    if (open) load();
    return () => { mounted = false; };
  }, [open, homeTeamId, awayTeamId]);
  // Reset all states when dialog closes
  useEffect(() => {
    if (!open) {
      console.log('🔄 DIALOG CLOSED - Resetting all states');
      setHomeScore(0);
      setAwayScore(0);
      setHomePenaltyScore(0);
      setAwayPenaltyScore(0);
      setHomeCards([]);
      setAwayCards([]);
      setSelectedHomePlayer('');
      setSelectedAwayPlayer('');
    } else {
      console.log('🔓 DIALOG OPENED');
    }
  }, [open]);
  const handleAddHomeCard = () => {
    console.log('=== handleAddHomeCard CALLED ===');
    console.log('selectedHomePlayer:', selectedHomePlayer, 'homeMembers:', homeMembers);
    if (!selectedHomePlayer) {
      console.log('❌ No player selected');
      toast({
        title: 'Lỗi',
        description: 'Vui lòng chọn cầu thủ',
        variant: 'destructive',
      });
      return;
    }
    const m = homeMembers.find(x => x.id === Number(selectedHomePlayer));
    console.log('Found player:', m);
    if (!m) {
      console.log('❌ Player not found');
      toast({
        title: 'Lỗi',
        description: 'Không tìm thấy cầu thủ',
        variant: 'destructive',
      });
      return;
    }
    const newCard = { player_id: m.id, player_name: m.player_name, card_type: selectedHomeCardType };
    console.log('✅ Adding card:', newCard);
    console.log('Previous homeCards:', homeCards);
    setHomeCards(prev => {
      const updated = [...prev, newCard];
      console.log('Updated homeCards:', updated);
      return updated;
    });
    setSelectedHomePlayer('');
    console.log('==============================');
  };

  const handleAddAwayCard = () => {
    console.log('=== handleAddAwayCard CALLED ===');
    console.log('selectedAwayPlayer:', selectedAwayPlayer, 'awayMembers:', awayMembers);
    if (!selectedAwayPlayer) {
      console.log('❌ No player selected');
      toast({
        title: 'Lỗi',
        description: 'Vui lòng chọn cầu thủ',
        variant: 'destructive',
      });
      return;
    }
    const m = awayMembers.find(x => x.id === Number(selectedAwayPlayer));
    console.log('Found player:', m);
    if (!m) {
      console.log('❌ Player not found');
      toast({
        title: 'Lỗi',
        description: 'Không tìm thấy cầu thủ',
        variant: 'destructive',
      });
      return;
    }
    const newCard = { player_id: m.id, player_name: m.player_name, card_type: selectedAwayCardType };
    console.log('✅ Adding card:', newCard);
    console.log('Previous awayCards:', awayCards);
    setAwayCards(prev => {
      const updated = [...prev, newCard];
      console.log('Updated awayCards:', updated);
      return updated;
    });
    setSelectedAwayPlayer('');
    console.log('==============================');
  };

  const handleRemoveHomeCard = (index: number) => {
    console.log('Removing home card at index:', index);
    setHomeCards(prev => {
      const updated = prev.filter((_, i) => i !== index);
      console.log('Updated homeCards after removal:', updated);
      return updated;
    });
  };

  const handleRemoveAwayCard = (index: number) => {
    console.log('Removing away card at index:', index);
    setAwayCards(prev => {
      const updated = prev.filter((_, i) => i !== index);
      console.log('Updated awayCards after removal:', updated);
      return updated;
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl w-full max-h-[90vh] overflow-y-auto">
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

            {/* Fair-play / Cards input for both teams */}
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              {/* Alert instructions */}
              <div className="lg:col-span-2">
                <Alert className="border-blue-200 bg-blue-50 dark:bg-blue-950/20">
                  <AlertDescription className="text-xs text-blue-900 dark:text-blue-200">
                    <div className="font-semibold mb-1">📋 Hướng dẫn thêm thẻ:</div>
                    <ol className="list-decimal list-inside space-y-1">
                      <li>Chọn <strong>cầu thủ</strong> từ dropdown</li>
                      <li>Chọn <strong>loại thẻ</strong> (Vàng/Đỏ)</li>
                      <li><strong>Click "➕ Thêm thẻ"</strong> để thêm vào danh sách</li>
                      <li>Cầu thủ sẽ hiển thị bên dưới khi được thêm thành công</li>
                    </ol>
                  </AlertDescription>
                </Alert>
              </div>

              {/* Home team cards */}
              <div className={`space-y-2 p-3 border rounded min-w-0 ${selectedHomePlayer ? 'border-amber-300 bg-amber-50 dark:bg-amber-950/20' : ''}`}>
                <div className="flex items-center justify-between">
                  <div className="font-medium">Thẻ - {homeTeamName}</div>
                </div>
                <div className="space-y-2">
                  <Label>Chọn cầu thủ</Label>
                  <Select value={selectedHomePlayer?.toString() ?? ''} onValueChange={(v) => setSelectedHomePlayer(v === '' ? '' : Number(v))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Chọn cầu thủ" />
                    </SelectTrigger>
                    <SelectContent>
                      {homeMembers.map(m => (
                        <SelectItem key={m.id} value={m.id.toString()}>{m.player_name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Loại thẻ</Label>
                  <select className="w-full border rounded px-2 py-1" value={selectedHomeCardType} onChange={(e) => setSelectedHomeCardType(e.target.value as 'yellow' | 'red')}>
                    <option value="yellow">🟡 Yellow</option>
                    <option value="red">🔴 Red</option>
                  </select>
                </div>
                <div className="flex gap-2">
                  <Button 
                    type="button" 
                    onClick={handleAddHomeCard} 
                    size="sm"
                    disabled={!selectedHomePlayer}
                    className={selectedHomePlayer ? 'bg-blue-600 hover:bg-blue-700' : ''}
                  >
                    ➕ Thêm thẻ
                  </Button>
                  {selectedHomePlayer && (
                    <div className="text-xs text-amber-600 dark:text-amber-400 flex items-center">
                      ⚠️ Chưa thêm
                    </div>
                  )}
                </div>
                <div className="mt-2 text-sm">
                  {homeCards.length === 0 ? (
                    <div className="text-muted-foreground text-xs">Chưa có thẻ</div>
                  ) : (
                    <ul className="space-y-1">
                      {homeCards.map((c, i) => (
                        <li key={i} className="flex items-center justify-between">
                          <span>{c.player_name} - {c.card_type === 'yellow' ? '🟡' : '🔴'}</span>
                          <button type="button" className="text-destructive" onClick={() => handleRemoveHomeCard(i)}>
                            <Trash className="w-4 h-4" />
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>

              {/* Away team cards */}
              <div className={`space-y-2 p-3 border rounded ${selectedAwayPlayer ? 'border-amber-300 bg-amber-50 dark:bg-amber-950/20' : ''}`}>
                <div className="flex items-center justify-between">
                  <div className="font-medium">Thẻ - {awayTeamName}</div>
                </div>
                <div className="space-y-2">
                  <Label>Chọn cầu thủ</Label>
                  <Select value={selectedAwayPlayer?.toString() ?? ''} onValueChange={(v) => setSelectedAwayPlayer(v === '' ? '' : Number(v))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Chọn cầu thủ" />
                    </SelectTrigger>
                    <SelectContent>
                      {awayMembers.map(m => (
                        <SelectItem key={m.id} value={m.id.toString()}>{m.player_name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Loại thẻ</Label>
                  <select className="w-full border rounded px-2 py-1" value={selectedAwayCardType} onChange={(e) => setSelectedAwayCardType(e.target.value as 'yellow' | 'red')}>
                    <option value="yellow">🟡 Yellow</option>
                    <option value="red">🔴 Red</option>
                  </select>
                </div>
                <div className="flex gap-2">
                  <Button 
                    type="button" 
                    onClick={handleAddAwayCard} 
                    size="sm"
                    disabled={!selectedAwayPlayer}
                    className={selectedAwayPlayer ? 'bg-blue-600 hover:bg-blue-700' : ''}
                  >
                    ➕ Thêm thẻ
                  </Button>
                  {selectedAwayPlayer && (
                    <div className="text-xs text-amber-600 dark:text-amber-400 flex items-center">
                      ⚠️ Chưa thêm
                    </div>
                  )}
                </div>
                <div className="mt-2 text-sm">
                  {awayCards.length === 0 ? (
                    <div className="text-muted-foreground text-xs">Chưa có thẻ</div>
                  ) : (
                    <ul className="space-y-1">
                      {awayCards.map((c, i) => (
                        <li key={i} className="flex items-center justify-between">
                          <span>{c.player_name} - {c.card_type === 'yellow' ? '🟡' : '🔴'}</span>
                          <button type="button" className="text-destructive" onClick={() => handleRemoveAwayCard(i)}>
                            <Trash className="w-4 h-4" />
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            </div>

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
