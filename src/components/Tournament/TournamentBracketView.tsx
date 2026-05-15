import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import {
  Search, Shield, LayoutGrid, Trophy, Users, Loader2, AlertCircle,
  Swords, MapPin, Calendar
} from 'lucide-react';
import { Match, matchService } from '@/services/matchService';
import { tournamentService, TournamentBracket } from '@/services/tournamentService';
import { UpdateScoreDialog } from '@/components/Match/UpdateScoreDialog';
import { GroupView } from './GroupView';
import { KnockoutView } from './KnockoutView';
import { MatchCard } from './MatchCard';

const ROUND_TYPE_ORDER: Record<string, number> = {
  group_stage: 1,
  round_of_32: 2,
  round_of_16: 3,
  quarter_final: 4,
  semi_final: 5,
  third_place: 6,
  final: 7,
};

const initials = (name: string) => name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
const normalizeText = (value?: string) =>
  (value ?? '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');

interface GroupData {
  id: number;
  group_name: string;
  standings: Array<{
    id: number;
    ranking: number;
    team_id: number;
    matches_played: number;
    wins: number;
    draws: number;
    losses: number;
    goals_for: number;
    goals_against: number;
    goal_difference: number;
    points: number;
    team?: { id: number; name: string; logo?: string };
  }>;
  matches: Match[];
  teams: { id: number; name: string; logo?: string }[];
}

interface RoundData {
  id: number;
  round_name: string;
  round_type: string;
  round_order: number;
  matches: Match[];
}

interface Props {
  tournamentId: number;
  format: 'round_robin' | 'knockout' | 'group_knockout';
  bracket?: TournamentBracket | null;
  canManage?: boolean;
  onScoreUpdated?: () => void;
  userTeamIds?: number[]; // Danh sách ID của các đội mà user là captain
}

interface PodiumTeam {
  id: number;
  name: string;
  logo?: string;
}

export const TournamentBracketView = ({
  tournamentId,
  format,
  bracket,
  canManage,
  onScoreUpdated,
  userTeamIds = [],
}: Props) => {
  const { toast } = useToast();

  // Data
  const [groups, setGroups] = useState<GroupData[]>([]);
  const [rounds, setRounds] = useState<RoundData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // UI State
  const [activeGroup, setActiveGroup] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterTeamId, setFilterTeamId] = useState<number | null>(null);
  const [filterTeamName, setFilterTeamName] = useState('');

  // Dialogs
  const [scoreMatch, setScoreMatch] = useState<Match | null>(null);
  const [scoreDialogOpen, setScoreDialogOpen] = useState(false);
  const [editFieldMatch, setEditFieldMatch] = useState<Match | null>(null);
  const [fieldDialogOpen, setFieldDialogOpen] = useState(false);
  const [selectedFieldId, setSelectedFieldId] = useState<number | null>(null);
  const [availableFields, setAvailableFields] = useState<Array<{
    id: number;
    name: string | null;
    field_type: string;
    field_cluster?: { name: string; address: string };
  }>>([]);
  const [editScheduleMatch, setEditScheduleMatch] = useState<Match | null>(null);
  const [scheduleDialogOpen, setScheduleDialogOpen] = useState(false);
  const [editMatchDate, setEditMatchDate] = useState('');
  const [editMatchTime, setEditMatchTime] = useState('');

  useEffect(() => {
    loadAll();
  }, [tournamentId]);

  const loadAll = async () => {
    setLoading(true);
    setError(null);
    try {
      const [groupsRaw, matchesRaw] = await Promise.all([
        tournamentService.getGroups(tournamentId),
        tournamentService.getMatches(tournamentId),
      ]);

      setGroups(Array.isArray(groupsRaw) ? groupsRaw : []);
      setRounds(
        (Array.isArray(matchesRaw) ? matchesRaw : []).map((r: any) => {
          const firstMatch = r.matches?.[0];
          const roundOrder = r.round_order ?? firstMatch?.round?.round_order ??
            ROUND_TYPE_ORDER[r.round_type as string] ?? r.round_id ?? 0;
          return {
            id: r.round_id ?? r.id ?? 0,
            round_name: r.round_name ?? '',
            round_type: r.round_type ?? '',
            round_order: roundOrder,
            matches: r.matches ?? [],
          };
        })
      );
    } catch (err: any) {
      if (bracket) {
        setGroups((bracket.groups ?? []).map((g: any) => ({
          id: g.id,
          group_name: g.group_name,
          standings: g.standings ?? [],
          matches: g.matches ?? [],
          teams: g.teams ?? [],
        })));
        setRounds((bracket.rounds ?? []).map((r: any) => ({
          id: r.id ?? 0,
          round_name: r.round_name,
          round_type: r.round_type ?? '',
          round_order: r.round_order ?? 0,
          matches: r.matches ?? [],
        })));
      } else {
        setError('Không thể tải dữ liệu lịch thi đấu.');
      }
    } finally {
      setLoading(false);
    }
  };

  // Derived data
  const knockoutRounds = useMemo(
    () => rounds.filter((r) => r.round_type !== 'group_stage').sort((a, b) => a.round_order - b.round_order),
    [rounds]
  );

  const knockoutMatches = useMemo(
    () => knockoutRounds.flatMap((r) => r.matches ?? []),
    [knockoutRounds]
  );

  const allTeams = useMemo(() => {
    const map = new Map<number, { id: number; name: string; logo?: string }>();
    groups.forEach((g) => {
      (g.standings ?? []).forEach((s) => {
        if (s.team) map.set(s.team_id, s.team);
      });
    });
    return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [groups]);

  const allMatches = useMemo(() => {
    const groupMatches = groups.flatMap((g) => g.matches ?? []);
    return [...groupMatches, ...knockoutMatches];
  }, [groups, knockoutMatches]);

  const areAllKnockoutMatchesScored = useMemo(() => {
    if (knockoutMatches.length === 0) return false;
    return knockoutMatches.every(
      (m) =>
        m.status === 'completed' ||
        (m.home_score !== null && m.home_score !== undefined && m.away_score !== null && m.away_score !== undefined)
    );
  }, [knockoutMatches]);

  const getWinnerTeam = (match?: Match): PodiumTeam | null => {
    if (!match) return null;

    if (match.winner_id) {
      if (match.home_team?.id === match.winner_id) return match.home_team;
      if (match.away_team?.id === match.winner_id) return match.away_team;
    }

    if (match.home_score === null || match.home_score === undefined || match.away_score === null || match.away_score === undefined) {
      return null;
    }

    if (match.home_score > match.away_score) return match.home_team ?? null;
    if (match.away_score > match.home_score) return match.away_team ?? null;
    return null;
  };

  const getLoserTeam = (match?: Match): PodiumTeam | null => {
    if (!match) return null;
    const winner = getWinnerTeam(match);
    if (!winner) return null;
    if (winner.id === match.home_team?.id) return match.away_team ?? null;
    if (winner.id === match.away_team?.id) return match.home_team ?? null;
    return null;
  };

  const knockoutRanking = useMemo(() => {
    if (!areAllKnockoutMatchesScored) {
      return {
        champion: null as PodiumTeam | null,
        runnerUp: null as PodiumTeam | null,
        third: null as PodiumTeam | null,
        fourth: null as PodiumTeam | null,
      };
    }

    const finalRound = knockoutRounds.find((r) => {
      const type = normalizeText(r.round_type);
      const name = normalizeText(r.round_name);
      return type === 'final' || name.includes('chung ket') || name.includes('final');
    }) ||
      [...knockoutRounds]
        .sort((a, b) => b.round_order - a.round_order)
        .find((r) => {
          const type = normalizeText(r.round_type);
          const name = normalizeText(r.round_name);
          return type !== 'third_place' && !name.includes('tranh hang 3');
        });

    const thirdPlaceRound = knockoutRounds.find((r) => {
      const type = normalizeText(r.round_type);
      const name = normalizeText(r.round_name);
      return type === 'third_place' || name.includes('tranh hang 3') || name.includes('third');
    });

    const finalMatch = finalRound?.matches?.[0]
      || knockoutMatches.find((m) => normalizeText(m.round?.round_type) === 'final')
      || knockoutMatches.find((m) => normalizeText(m.round?.name).includes('chung ket'));

    const thirdPlaceMatch = thirdPlaceRound?.matches?.[0]
      || knockoutMatches.find((m) => normalizeText(m.round?.round_type) === 'third_place')
      || knockoutMatches.find((m) => normalizeText(m.round?.name).includes('tranh hang 3'));

    return {
      champion: getWinnerTeam(finalMatch),
      runnerUp: getLoserTeam(finalMatch),
      third: getWinnerTeam(thirdPlaceMatch),
      fourth: getLoserTeam(thirdPlaceMatch),
    };
  }, [areAllKnockoutMatchesScored, knockoutMatches, knockoutRounds]);

  const filteredMatches = useMemo(() => {
    let result = allMatches;
    if (filterTeamId) {
      result = result.filter(
        (m) => m.home_team_id === filterTeamId || m.away_team_id === filterTeamId ||
          m.home_team?.id === filterTeamId || m.away_team?.id === filterTeamId
      );
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (m) =>
          m.home_team?.name?.toLowerCase().includes(q) ||
          m.away_team?.name?.toLowerCase().includes(q) ||
          m.home_from_position?.toLowerCase().includes(q) ||
          m.away_from_position?.toLowerCase().includes(q) ||
          m.field?.name?.toLowerCase().includes(q) ||
          String(m.match_number).includes(q)
      );
    }
    return result;
  }, [allMatches, filterTeamId, searchQuery]);

  // Handlers
  const handleEditScore = (m: Match) => {
    setScoreMatch(m);
    setScoreDialogOpen(true);
  };

  const handleScoreSubmit = async (data: { home_score: number; away_score: number; status: 'completed' | 'in_progress' }) => {
    if (!scoreMatch) return;
    try {
      await matchService.updateScore(scoreMatch.id, data);
      toast({ title: 'Thành công', description: 'Đã cập nhật tỷ số. Bảng xếp hạng cập nhật tự động.' });
      await loadAll();
      onScoreUpdated?.();
    } catch (err: any) {
      toast({ title: 'Lỗi', description: err?.response?.data?.message ?? 'Không thể cập nhật tỷ số', variant: 'destructive' });
      throw err;
    }
  };

  const handleTeamClick = (id: number, name: string) => {
    setFilterTeamId(id);
    setFilterTeamName(name);
  };

  const clearTeamFilter = () => {
    setFilterTeamId(null);
    setFilterTeamName('');
  };

  const handleEditField = async (m: Match) => {
    setEditFieldMatch(m);
    setSelectedFieldId(m.field_id ?? null);
    try {
      const bookings = await tournamentService.getFieldBookings(tournamentId);
      setAvailableFields(bookings.map((b: any) => ({
        id: b.field.id,
        name: b.field.name,
        field_type: b.field.field_type,
        field_cluster: b.field.field_cluster
      })));
    } catch (err) {
      if (m.field) setAvailableFields([{
        id: m.field.id,
        name: m.field.name,
        field_type: m.field.field_type,
        field_cluster: m.field.field_cluster
      }]);
    }
    setFieldDialogOpen(true);
  };

  const handleFieldSubmit = async () => {
    if (!editFieldMatch || !selectedFieldId) return;
    try {
      await matchService.updateField(editFieldMatch.id, selectedFieldId);
      toast({ title: 'Thành công', description: 'Đã cập nhật sân thi đấu' });
      setFieldDialogOpen(false);
      await loadAll();
      onScoreUpdated?.();
    } catch (err: any) {
      toast({ title: 'Lỗi', description: err?.response?.data?.message ?? 'Không thể cập nhật sân', variant: 'destructive' });
    }
  };

  const handleEditSchedule = (m: Match) => {
    setEditScheduleMatch(m);
    setEditMatchDate(m.match_date || '');
    setEditMatchTime(m.match_time || '');
    setScheduleDialogOpen(true);
  };

  const handleScheduleSubmit = async () => {
    if (!editScheduleMatch || !editMatchDate || !editMatchTime) return;
    try {
      await matchService.updateSchedule(editScheduleMatch.id, {
        match_date: editMatchDate,
        match_time: editMatchTime
      });
      toast({ title: 'Thành công', description: 'Đã cập nhật lịch thi đấu' });
      setScheduleDialogOpen(false);
      await loadAll();
      onScoreUpdated?.();
    } catch (err: any) {
      toast({ title: 'Lỗi', description: err?.response?.data?.message ?? 'Không thể cập nhật lịch', variant: 'destructive' });
    }
  };

  const hasGroups = groups.length > 0;
  const hasKnockout = knockoutRounds.length > 0;
  const showKnockoutRankingTab = format === 'knockout' && hasKnockout;
  const defaultTab = hasGroups ? 'groups' : hasKnockout ? 'knockout' : 'teams';

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error && !hasGroups && !hasKnockout) {
    return (
      <Card className="border-red-200">
        <CardContent className="py-10 text-center">
          <AlertCircle className="w-10 h-10 text-destructive mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">{error}</p>
        </CardContent>
      </Card>
    );
  }

  if (allMatches.length === 0 && !loading) {
    return (
      <Card>
        <CardContent className="py-16 text-center space-y-2">
          <Swords className="w-12 h-12 text-muted-foreground mx-auto" />
          <p className="text-sm text-muted-foreground">Chưa có lịch thi đấu</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Tìm đội, sân, trận đấu..."
            className="pl-9"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        {filterTeamId && (
          <Button variant="secondary" size="sm" className="gap-2" onClick={clearTeamFilter}>
            <Shield className="w-4 h-4" />
            {filterTeamName}
            <span className="ml-1">✕</span>
          </Button>
        )}
      </div>

      {/* Filtered Results or Main Tabs */}
      {(searchQuery.trim() || filterTeamId) ? (
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground font-medium">
            {filteredMatches.length} trận đấu
            {filterTeamId ? ` của ${filterTeamName}` : ''}
            {searchQuery ? ` khớp với "${searchQuery}"` : ''}
          </p>
          {filteredMatches.length === 0 ? (
            <Card>
              <CardContent className="py-10 text-center text-sm text-muted-foreground">
                Không tìm thấy trận đấu nào
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {filteredMatches.map((m) => (
                <MatchCard
                  key={m.id}
                  match={m}
                  userTeamIds={filterTeamId ? [filterTeamId] : userTeamIds}
                  canManage={canManage}
                  onEditScore={handleEditScore}
                  onEditField={handleEditField}
                  onEditSchedule={handleEditSchedule}
                />
              ))}
            </div>
          )}
        </div>
      ) : (
        <Tabs defaultValue={defaultTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            {hasGroups && (
              <TabsTrigger value="groups" className="gap-2">
                <LayoutGrid className="w-4 h-4" />
                Vòng bảng
                <Badge variant="secondary" className="ml-1 text-xs">{groups.length}</Badge>
              </TabsTrigger>
            )}
            {hasKnockout && (
              <TabsTrigger value="knockout" className="gap-2">
                <Trophy className="w-4 h-4" />
                Đấu loại
              </TabsTrigger>
            )}
            <TabsTrigger value="teams" className="gap-2">
              <Users className="w-4 h-4" />
              {showKnockoutRankingTab ? 'Bảng xếp hạng' : 'Xem theo đội'}
            </TabsTrigger>
          </TabsList>

          {/* Groups Tab */}
          {hasGroups && (
            <TabsContent value="groups" className="space-y-6">
              {/* Group Selector */}
              <div className="flex flex-wrap gap-2">
                {groups.map((g, idx) => (
                  <Button
                    key={g.id}
                    size="sm"
                    variant={activeGroup === idx ? 'default' : 'outline'}
                    className="gap-2"
                    onClick={() => setActiveGroup(idx)}
                  >
                    <Shield className="w-4 h-4" />
                    {g.group_name}
                    <span className="text-xs opacity-70">({g.matches?.length ?? 0})</span>
                  </Button>
                ))}
              </div>

              {/* Group View */}
              {groups[activeGroup] && (
                <GroupView
                  group={groups[activeGroup]}
                  userTeamIds={userTeamIds}
                  canManage={canManage}
                  onTeamClick={handleTeamClick}
                  onEditScore={handleEditScore}
                  onEditField={handleEditField}
                  onEditSchedule={handleEditSchedule}
                />
              )}
            </TabsContent>
          )}

          {/* Knockout Tab */}
          {hasKnockout && (
            <TabsContent value="knockout">
              <KnockoutView
                rounds={knockoutRounds}
                canManage={canManage}
                onEditScore={handleEditScore}
                userTeamIds={userTeamIds}
              />
            </TabsContent>
          )}

          {/* Teams Tab */}
          <TabsContent value="teams" className="space-y-4">
            {showKnockoutRankingTab ? (
              !areAllKnockoutMatchesScored ? (
                <Card>
                  <CardContent className="py-12 text-center space-y-2">
                    <Trophy className="w-10 h-10 text-muted-foreground mx-auto" />
                    <p className="font-medium">Bảng xếp hạng knock-out chưa sẵn sàng</p>
                    <p className="text-sm text-muted-foreground">
                      Cần cập nhật tỉ số đầy đủ cho tất cả trận đấu ở nhánh knock-out để xác định hạng 1-4.
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <Card>
                  <CardContent className="p-0">
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead className="bg-muted/50">
                          <tr className="border-b">
                            <th className="text-left font-semibold px-4 py-3 w-28">Thứ hạng</th>
                            <th className="text-left font-semibold px-4 py-3">Đội</th>
                          </tr>
                        </thead>
                        <tbody>
                          {[
                            { rank: 'Hạng 1', team: knockoutRanking.champion, medal: '🏆' },
                            { rank: 'Hạng 2', team: knockoutRanking.runnerUp, medal: '🥈' },
                            { rank: 'Hạng 3', team: knockoutRanking.third, medal: '🥉' },
                            { rank: 'Hạng 4', team: knockoutRanking.fourth, medal: '4️⃣' },
                          ].map((row) => (
                            <tr key={row.rank} className="border-b last:border-b-0">
                              <td className="px-4 py-3 font-medium">{row.medal} {row.rank}</td>
                              <td className="px-4 py-3">
                                {row.team ? (
                                  <div className="flex items-center gap-2">
                                    <Avatar className="w-7 h-7">
                                      {row.team.logo && <AvatarImage src={row.team.logo} alt={row.team.name} />}
                                      <AvatarFallback className="text-xs">{initials(row.team.name)}</AvatarFallback>
                                    </Avatar>
                                    <span className="font-medium">{row.team.name}</span>
                                  </div>
                                ) : (
                                  <span className="text-muted-foreground">Chưa xác định</span>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>
              )
            ) : (
              <>
                <div className="space-y-3">
                  <p className="text-sm text-muted-foreground">Chọn đội để xem lịch thi đấu:</p>
                  <div className="flex flex-wrap gap-2">
                    {allTeams.map((t) => (
                      <button
                        key={t.id}
                        className={`
                      flex items-center gap-2 px-3 py-2 rounded-lg border-2 transition-all
                      ${filterTeamId === t.id ? 'bg-primary text-primary-foreground border-primary shadow-md' :
                            userTeamIds.includes(t.id) ? 'border-primary text-primary bg-primary/5 hover:bg-primary/10' :
                              'border-border hover:border-primary/50 hover:shadow-sm'}
                    `}
                        onClick={() =>
                          filterTeamId === t.id ? clearTeamFilter() : handleTeamClick(t.id, t.name)
                        }
                      >
                        <Avatar className="w-6 h-6">
                          {t.logo && <AvatarImage src={t.logo} />}
                          <AvatarFallback className="text-xs">{initials(t.name)}</AvatarFallback>
                        </Avatar>
                        <span className="font-medium">{t.name}</span>
                        {userTeamIds.includes(t.id) && <Badge className="text-xs h-5">Tôi</Badge>}
                      </button>
                    ))}
                  </div>
                </div>

                {filterTeamId ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold flex items-center gap-2">
                        <Shield className="w-5 h-5 text-primary" />
                        Lịch thi đấu — {filterTeamName}
                      </h3>
                      <Button size="sm" variant="ghost" onClick={clearTeamFilter}>Xóa lọc</Button>
                    </div>
                    {filteredMatches.length === 0 ? (
                      <Card>
                        <CardContent className="py-12 text-center text-sm text-muted-foreground">
                          Chưa có trận đấu
                        </CardContent>
                      </Card>
                    ) : (
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        {filteredMatches.map((m) => (
                          <MatchCard
                            key={m.id}
                            match={m}
                            highlightTeamId={filterTeamId}
                            canManage={canManage}
                            onEditScore={handleEditScore}
                            onEditField={handleEditField}
                            onEditSchedule={handleEditSchedule}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <Card>
                    <CardContent className="py-12 text-center space-y-2">
                      <Users className="w-10 h-10 text-muted-foreground mx-auto" />
                      <p className="text-sm text-muted-foreground">Chọn đội ở trên để xem lịch</p>
                    </CardContent>
                  </Card>
                )}
              </>
            )}
          </TabsContent>
        </Tabs>
      )}

      {/* Score Dialog */}
      {scoreMatch && (
        <UpdateScoreDialog
          open={scoreDialogOpen}
          onOpenChange={setScoreDialogOpen}
          onSubmit={handleScoreSubmit}
          homeTeamName={scoreMatch.home_team?.name ?? scoreMatch.home_from_position ?? 'Home'}
          awayTeamName={scoreMatch.away_team?.name ?? scoreMatch.away_from_position ?? 'Away'}
        />
      )}

      {/* Field Dialog */}
      <Dialog open={fieldDialogOpen} onOpenChange={setFieldDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MapPin className="w-5 h-5" />
              Chọn sân thi đấu
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Sân</Label>
              <Select
                value={selectedFieldId?.toString() ?? ''}
                onValueChange={(val) => setSelectedFieldId(Number(val))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Chọn sân" />
                </SelectTrigger>
                <SelectContent>
                  {availableFields.map((f) => (
                    <SelectItem key={f.id} value={f.id.toString()}>
                      <div className="flex flex-col">
                        <span className="font-medium">
                          Sân {f.field_type} {f.name ? `- ${f.name}` : ''}
                        </span>
                        {f.field_cluster && (
                          <span className="text-xs text-muted-foreground">
                            {f.field_cluster.name}
                          </span>
                        )}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setFieldDialogOpen(false)}>
              Hủy
            </Button>
            <Button onClick={handleFieldSubmit} disabled={!selectedFieldId}>
              Lưu
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Schedule Dialog */}
      <Dialog open={scheduleDialogOpen} onOpenChange={setScheduleDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Cập nhật lịch thi đấu
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Ngày thi đấu</Label>
              <Input
                type="date"
                value={editMatchDate}
                onChange={(e) => setEditMatchDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Giờ thi đấu</Label>
              <Input
                type="time"
                value={editMatchTime}
                onChange={(e) => setEditMatchTime(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setScheduleDialogOpen(false)}>
              Hủy
            </Button>
            <Button onClick={handleScheduleSubmit} disabled={!editMatchDate || !editMatchTime}>
              Lưu
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
