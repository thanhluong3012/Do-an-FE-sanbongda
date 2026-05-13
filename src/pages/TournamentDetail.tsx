import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { Tournament, tournamentService, TournamentBracket, FieldBooking } from '@/services/tournamentService';
import { useTournamentRealtimeSync, SyncMessage } from '@/hooks/useRealtimeSync';
import { useCallback } from 'react';
import { registrationService, RegistrationRequest, TournamentRegistration } from '@/services/registrationService';
import { matchService, Match } from '@/services/matchService';
import { GroupStanding } from '@/services/standingsService';
import { teamService, Team } from '@/services/teamService';
import { TournamentStatusBadge, TournamentFormatBadge } from '@/components/Tournament/TournamentStatusBadge';
import { RegistrationFormDialog } from '@/components/Registration/RegistrationFormDialog';
import { RegistrationList } from '@/components/Registration/RegistrationList';
import { MatchCard } from '@/components/Match/MatchCard';
import { UpdateScoreDialog } from '@/components/Match/UpdateScoreDialog';
import { GroupStandingsTable } from '@/components/Standings/GroupStandingsTable';
import { ScheduleBuilder } from '@/components/Match/ScheduleBuilder';
import { PaymentInfoCard } from '@/components/Tournament/PaymentInfoCard';
import { RulesFileSection } from '@/components/Tournament/RulesFileSection';
import { TournamentBracketView } from '@/components/Tournament/TournamentBracketView';
import {
  Trophy, MapPin, Users, Calendar, ArrowLeft, CheckCircle,
  Loader2, User, Megaphone, AlertCircle, ClipboardList,
  Swords, BarChart3, Info, Clock, DollarSign, Phone, Mail, Building2, CheckCircle2
} from 'lucide-react';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';

// ---------- helpers ----------
const formatDate = (dateString: string | null | undefined) => {
  if (!dateString) return 'Chưa có ngày';
  try { return format(new Date(dateString), 'dd/MM/yyyy', { locale: vi }); }
  catch { return dateString; }
};

const formatCurrency = (amount: number | undefined | null): string => {
  if (!amount) return '0 ₫';
  return new Intl.NumberFormat('vi-VN', { style: 'decimal' }).format(amount) + ' ₫';
};

const TabLoading = () => (
  <div className="flex items-center justify-center py-16">
    <Loader2 className="w-8 h-8 animate-spin text-primary" />
  </div>
);

const TabError = ({ message, onRetry }: { message: string; onRetry: () => void }) => (
  <Card>
    <CardContent className="py-12 text-center space-y-3">
      <AlertCircle className="w-10 h-10 text-destructive mx-auto" />
      <p className="font-medium">Không thể tải dữ liệu</p>
      <p className="text-sm text-muted-foreground">{message}</p>
      <Button size="sm" variant="outline" onClick={onRetry}>Thử lại</Button>
    </CardContent>
  </Card>
);

const TabEmpty = ({ icon: Icon, text }: { icon: React.ElementType; text: string }) => (
  <Card>
    <CardContent className="py-16 text-center space-y-3">
      <Icon className="w-12 h-12 text-muted-foreground mx-auto" />
      <p className="text-muted-foreground">{text}</p>
    </CardContent>
  </Card>
);
// ---------- end helpers ----------

const TournamentDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { isAdmin, user } = useAuth();

  // Tournament
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [tournamentError, setTournamentError] = useState<string | null>(null);
  const [isPublishing, setIsPublishing] = useState(false);

  // Registrations tab
  const [registrations, setRegistrations] = useState<TournamentRegistration[]>([]);
  const [regLoading, setRegLoading] = useState(false);

  // Real-time sync từ Owner khi confirm payment
  const handleTournamentUpdate = useCallback((message: SyncMessage) => {
    // Chỉ reload nếu là tournament hiện tại
    const tournamentId = parseInt(id || '0');
    if (message.relatedIds?.tournamentId === tournamentId) {
      console.log('🔔 [Tournament Detail] Payment status updated from another tab');

      if (message.type === 'payment_confirmed') {
        toast({
          title: '✅ Thanh toán đã được xác nhận',
          description: 'Owner đã xác nhận thanh toán của bạn',
          duration: 5000,
        });
        // Reload tournament để cập nhật payment_status
        loadTournament();
      } else if (message.type === 'payment_rejected') {
        toast({
          title: '❌ Thanh toán bị từ chối',
          description: 'Vui lòng kiểm tra lại và upload bill mới',
          variant: 'destructive',
          duration: 5000,
        });
        loadTournament();
      }
    }
  }, [id]);

  useTournamentRealtimeSync(handleTournamentUpdate, parseInt(id || '0'));
  const [regError, setRegError] = useState<string | null>(null);

  // Matches tab - use Bracket structure
  const [bracket, setBracket] = useState<TournamentBracket | null>(null);
  const [matchLoading, setMatchLoading] = useState(false);
  const [matchError, setMatchError] = useState<string | null>(null);
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);
  const [isScoreDialogOpen, setIsScoreDialogOpen] = useState(false);
  const [isGeneratingSchedule, setIsGeneratingSchedule] = useState(false);
  const [isDeletingSchedule, setIsDeletingSchedule] = useState(false);
  const [isPublishingSchedule, setIsPublishingSchedule] = useState(false);
  const [isUnpublishingSchedule, setIsUnpublishingSchedule] = useState(false);
  const [scheduleDialogOpen, setScheduleDialogOpen] = useState(false);
  const [scheduleNumGroups, setScheduleNumGroups] = useState<number>(2);
  const [scheduleTeamsPerGroup, setScheduleTeamsPerGroup] = useState<number>(4);
  const [scheduleDaysBetweenRounds, setScheduleDaysBetweenRounds] = useState<number>(3);
  const [scheduleMatchDuration, setScheduleMatchDuration] = useState<number>(60);
  const [schedulePreparationTime, setSchedulePreparationTime] = useState<number>(15);
  const [scheduleAutoSelectFields, setScheduleAutoSelectFields] = useState<boolean>(true);
  const [scheduleCreateThirdPlaceMatch, setScheduleCreateThirdPlaceMatch] = useState<boolean>(false);

  // Standings — derived from bracket data (groups[].standings[])
  // Không cần gọi API riêng, lấy trực tiếp từ bracket

  // Teams (for registration dialog)
  const [teams, setTeams] = useState<Team[]>([]);
  const [isRegistrationDialogOpen, setIsRegistrationDialogOpen] = useState(false);

  // Field Bookings
  const [fieldBookings, setFieldBookings] = useState<FieldBooking[]>([]);
  const [bookingsLoading, setBookingsLoading] = useState(false);
  const [bookingsError, setBookingsError] = useState<string | null>(null);

  const tournamentId = id ? parseInt(id) : 0;

  // Extract matches từ bracket structure - MUST be before early returns to avoid hooks rules violation
  const allMatches = useMemo(() => {
    if (!bracket) return [];
    const matches = [];

    // Round robin hoặc group knockout: lấy từ groups
    if (bracket.groups && bracket.groups.length > 0) {
      for (const group of bracket.groups) {
        if (group.matches) {
          matches.push(...group.matches);
        }
      }
    }

    // Knockout: lấy từ rounds
    if (bracket.rounds && bracket.rounds.length > 0) {
      for (const round of bracket.rounds) {
        if (round.matches) {
          matches.push(...round.matches);
        }
      }
    }

    return matches;
  }, [bracket]);

  const approvedTeamsForSchedule = useMemo(() => {
    const fromBracketTeams = bracket?.teams?.length ?? 0;
    if (fromBracketTeams > 0) return fromBracketTeams;

    const fromTournamentTeams = tournament?.teams?.length ?? 0;
    if (fromTournamentTeams > 0) return fromTournamentTeams;

    const fromTournamentRegistrations = (tournament?.registrations ?? []).filter(
      (r: any) => (r.registration_status || r.status) === 'approved'
    ).length;
    if (fromTournamentRegistrations > 0) return fromTournamentRegistrations;

    const fromRegistrations = registrations.filter(
      (r: any) => (r.registration_status || r.status) === 'approved'
    ).length;
    if (fromRegistrations > 0) return fromRegistrations;

    return tournament?.approved_teams_count ?? 0;
  }, [bracket?.teams, tournament?.teams, tournament?.registrations, tournament?.approved_teams_count, registrations]);

  const scheduleBaseTeamCount = Math.max(2, approvedTeamsForSchedule);

  // Standings: extract từ bracket groups
  const standings: GroupStanding[] = useMemo(() => {
    if (!bracket?.groups) return [];
    const result: GroupStanding[] = [];
    for (const group of bracket.groups) {
      if (group.standings && group.standings.length > 0) {
        for (const s of group.standings) {
          result.push({
            id: (s as any).id || 0,
            tournament_id: (s as any).tournament_group_id || 0,
            group_id: group.id,
            team_id: (s as any).team_id || s.team?.id || 0,
            matches_played: (s as any).matches_played ?? 0,
            wins: s.wins ?? 0,
            draws: s.draws ?? 0,
            losses: s.losses ?? 0,
            goals_for: (s as any).goals_for ?? 0,
            goals_against: (s as any).goals_against ?? 0,
            goal_difference: (s as any).goal_difference ?? 0,
            points: s.points ?? 0,
            rank: s.ranking ?? 0,
            team: s.team ? { id: s.team.id, name: s.team.name, logo: s.team.logo } : undefined,
            group: { id: group.id, name: group.group_name },
          });
        }
      }
    }
    return result;
  }, [bracket]);

  useEffect(() => {
    if (tournamentId) {
      loadTournament();
      // Chỉ gọi API cần auth khi có token
      const hasToken = !!sessionStorage.getItem('access_token');
      if (hasToken) {
        loadRegistrations();
        loadTeams();
      }
      // loadBracket() - sẽ được gọi trong useEffect riêng sau khi có tournament data
      // standings lấy từ bracket, không cần gọi API riêng
      // Field bookings chỉ load cho organizer/admin - sẽ được gọi sau khi có tournament data
    }
    // Re-fetch khi user thay đổi để cập nhật quyền và danh sách đăng ký
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tournamentId, user?.id]);

  // Load bracket khi đã có tournament data để biết user có phải organizer không
  useEffect(() => {
    if (tournament) {
      loadBracket();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tournament?.id, user?.id]);

  // Load field bookings khi đã có tournament data và user là organizer/admin
  useEffect(() => {
    if (tournament && user) {
      const isOrganizer = String(user.id) === String(tournament.organizer_id);
      const isAdminUser = user.role_id === 1;
      if (isOrganizer || isAdminUser) {
        loadFieldBookings();
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tournament?.id, user?.id]);

  // Auto-refresh tournament khi user quay lại trang (sau khi owner xác nhận thanh toán)
  useEffect(() => {
    const handleFocus = () => {
      if (tournamentId && tournament) {
        // Chỉ reload nếu đang chờ thanh toán
        if (tournament.payment_status === 'pending' && tournament.payment_method) {
          loadTournament();
        }
      }
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tournamentId, tournament?.payment_status, tournament?.payment_method]);

  // ---- loaders ----
  const loadTournament = async () => {
    setIsLoading(true);
    setTournamentError(null);
    try {
      const data = await tournamentService.getById(tournamentId);
      console.log('🔍 [DEBUG] Tournament data từ API:', data);
      console.log('💰 payment_status:', data.payment_status);
      console.log('💳 payment_method:', data.payment_method);
      setTournament(data);
    } catch (err: any) {
      setTournamentError(err.response?.data?.message || 'Không thể tải thông tin giải đấu.');
    } finally {
      setIsLoading(false);
    }
  };

  const loadRegistrations = async () => {
    // Chỉ gọi khi có token (API cần auth)
    if (!sessionStorage.getItem('access_token')) return;

    setRegLoading(true);
    setRegError(null);
    try {
      const data = await registrationService.getAll({ tournament_id: tournamentId });
      setRegistrations(Array.isArray(data) ? data : []);
    } catch (err: any) {
      // Nếu lỗi 401/403 (token hết hạn) thì set empty, không báo lỗi
      if (err.response?.status === 401 || err.response?.status === 403) {
        setRegistrations([]);
      } else {
        setRegError(err.response?.data?.message || 'Không thể tải danh sách đăng ký.');
      }
    } finally {
      setRegLoading(false);
    }
  };

  const loadBracket = async () => {
    setMatchLoading(true);
    setMatchError(null);
    try {
      // Kiểm tra xem user có phải organizer/admin không
      // Nếu chưa đăng nhập hoặc chưa có tournament → dùng public endpoint (isOrganizer = false)
      const isOrganizer = user && tournament?.organizer_id && String(user.id) === String(tournament.organizer_id);
      const isAdminUser = user && user.role_id === 1; // role_id 1 = admin
      const canManageTournament = !!(isOrganizer || isAdminUser);

      const data = await tournamentService.getBracket(tournamentId, canManageTournament);
      setBracket(data);
    } catch (err: any) {
      console.error('Bracket error:', err);
      // Nếu chưa có lịch hoặc chưa publish thì không báo lỗi, chỉ set bracket = null
      if (err.response?.status === 404 || err.response?.status === 403 || err.response?.data?.message?.includes('not found')) {
        setBracket(null);
      } else {
        setMatchError(err.response?.data?.message || 'Không thể tải lịch thi đấu.');
      }
    } finally {
      setMatchLoading(false);
    }
  };

  const loadTeams = async () => {
    // Chỉ gọi khi có token (API cần auth)
    if (!sessionStorage.getItem('access_token')) return;
    try {
      const data = await teamService.getAll();
      setTeams(Array.isArray(data) ? data : []);
    } catch {
      // silent — không ảnh hưởng giao diện chính
    }
  };

  const loadFieldBookings = async () => {
    // Chỉ load nếu user đã đăng nhập
    if (!user) return;

    setBookingsLoading(true);
    setBookingsError(null);
    try {
      const data = await tournamentService.getFieldBookings(tournamentId);
      setFieldBookings(Array.isArray(data) ? data : []);
    } catch (err: any) {
      console.error('Field bookings error:', err);
      // Không báo lỗi nếu chưa book sân hoặc không có quyền
      if (err.response?.status !== 404 && err.response?.status !== 403) {
        setBookingsError(err.response?.data?.message || 'Không thể tải danh sách sân đã đặt.');
      }
    } finally {
      setBookingsLoading(false);
    }
  };

  // ---- handlers ----
  const handlePublish = async () => {
    if (!tournament) return;
    setIsPublishing(true);
    try {
      const updated = await tournamentService.publish(tournament.id);
      setTournament(updated);
      toast({ title: 'Thành công', description: 'Giải đấu đã mở đăng ký!' });
    } catch (err: any) {
      toast({ title: 'Lỗi', description: err.response?.data?.message || 'Không thể mở đăng ký', variant: 'destructive' });
    } finally {
      setIsPublishing(false);
    }
  };

  const handleRegister = async (data: RegistrationRequest) => {
    try {
      await registrationService.create(data);
      toast({ title: 'Thành công', description: 'Đăng ký tham gia giải đấu thành công!' });
      await loadRegistrations();
      await loadTournament(); // refresh để cập nhật approved_teams_count và is_full
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Không thể đăng ký tham gia giải đấu.';
      toast({ title: 'Đăng ký thất bại', description: msg, variant: 'destructive' });
      throw err; // để RegistrationFormDialog biết có lỗi
    }
  };

  const handleApproveRegistration = async (registrationId: number) => {
    try {
      await registrationService.approve(registrationId);
      toast({ title: 'Thành công', description: 'Đã duyệt đăng ký. Đội sẽ nhận được thông báo.' });
      await loadRegistrations();
      await loadTournament();
    } catch (err: any) {
      toast({ title: 'Lỗi', description: err.response?.data?.message || 'Không thể duyệt đăng ký', variant: 'destructive' });
    }
  };

  const handleRejectRegistration = async (registrationId: number, reason: string) => {
    try {
      await registrationService.reject(registrationId, { rejected_reason: reason });
      toast({ title: 'Thành công', description: 'Đã từ chối đăng ký. Đội sẽ nhận được thông báo.' });
      await loadRegistrations();
      await loadTournament();
    } catch (err: any) {
      toast({ title: 'Lỗi', description: err.response?.data?.message || 'Không thể từ chối đăng ký', variant: 'destructive' });
    }
  };

  const handleMatchClick = (match: Match) => {
    setSelectedMatch(match);
    setIsScoreDialogOpen(true);
  };

  const handleUpdateScore = async (data: { home_score: number; away_score: number; status: 'completed' | 'in_progress' }) => {
    if (!selectedMatch) return;
    try {
      await matchService.updateScore(selectedMatch.id, data);
      toast({ title: 'Thành công', description: 'Đã cập nhật kết quả' });
      await loadBracket(); // Reload bracket (includes standings)
    } catch (err: any) {
      toast({ title: 'Lỗi', description: err.response?.data?.message || 'Không thể cập nhật kết quả', variant: 'destructive' });
    }
  };

  // ---- Schedule handlers ----
  const clampScheduleValue = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));

  const handleNumGroupsChange = (rawValue: string) => {
    const parsed = Number.parseInt(rawValue, 10);
    const nextNumGroups = clampScheduleValue(Number.isNaN(parsed) ? 2 : parsed, 2, 8);
    setScheduleNumGroups(nextNumGroups);

    if (tournament?.format === 'group_knockout') {
      const nextTeamsPerGroup = clampScheduleValue(Math.ceil(scheduleBaseTeamCount / nextNumGroups), 2, 16);
      setScheduleTeamsPerGroup(nextTeamsPerGroup);
    }
  };

  const handleTeamsPerGroupChange = (rawValue: string) => {
    const parsed = Number.parseInt(rawValue, 10);
    const nextTeamsPerGroup = clampScheduleValue(Number.isNaN(parsed) ? 4 : parsed, 2, 16);
    setScheduleTeamsPerGroup(nextTeamsPerGroup);

    if (tournament?.format === 'group_knockout') {
      const nextNumGroups = clampScheduleValue(Math.ceil(scheduleBaseTeamCount / nextTeamsPerGroup), 2, 8);
      setScheduleNumGroups(nextNumGroups);
    }
  };

  const handleOpenScheduleDialog = async () => {
    if (tournament?.format === 'group_knockout') {
      const normalizedGroups = clampScheduleValue(scheduleNumGroups, 2, 8);
      setScheduleNumGroups(normalizedGroups);
      setScheduleTeamsPerGroup(
        clampScheduleValue(Math.ceil(scheduleBaseTeamCount / normalizedGroups), 2, 16)
      );
    }
    setScheduleDialogOpen(true);
  };

  const handleGenerateSchedule = async () => {
    if (!tournament) return;
    setIsGeneratingSchedule(true);
    try {
      const params: Record<string, any> = {
        start_date: tournament.start_date,
        end_date: tournament.end_date,
        days_between_rounds: scheduleDaysBetweenRounds,
        match_duration: scheduleMatchDuration,
        preparation_time: schedulePreparationTime,
      };

      if (!scheduleAutoSelectFields) {
        // TODO: Thêm UI chọn sân thủ công sau
        // params.field_ids = selectedFieldIds;
      }

      // Thêm tùy chọn tạo trận tranh hạng 3 cho knockout và group_knockout
      if (tournament.format === 'knockout' || tournament.format === 'group_knockout') {
        params.create_third_place_match = scheduleCreateThirdPlaceMatch;
      }

      if (tournament.format === 'group_knockout') {
        params.num_groups = scheduleNumGroups;
        params.teams_per_group = scheduleTeamsPerGroup;
      }
      await tournamentService.generateSchedule(tournamentId, params);
      toast({ title: 'Thành công', description: 'Đã tự động sinh lịch thi đấu!' });
      setScheduleDialogOpen(false);
      await loadBracket();
      await loadTournament();
      await loadFieldBookings(); // ← Reload sân đã book
    } catch (err: any) {
      toast({ title: 'Lỗi', description: err.response?.data?.message || 'Không thể sinh lịch thi đấu', variant: 'destructive' });
    } finally {
      setIsGeneratingSchedule(false);
    }
  };

  const handleDeleteSchedule = async () => {
    setIsDeletingSchedule(true);
    try {
      await tournamentService.deleteSchedule(tournamentId);
      toast({ title: 'Thành công', description: 'Đã xóa lịch thi đấu' });
      await loadBracket();
      await loadTournament();
    } catch (err: any) {
      toast({ title: 'Lỗi', description: err.response?.data?.message || 'Không thể xóa lịch thi đấu', variant: 'destructive' });
    } finally {
      setIsDeletingSchedule(false);
    }
  };

  const handlePublishSchedule = async () => {
    if (!tournament) return;
    setIsPublishingSchedule(true);
    try {
      const updated = await tournamentService.publishSchedule(tournamentId);
      setTournament(updated);
      toast({ title: 'Thành công', description: 'Đã công khai lịch thi đấu. Người dùng giờ có thể xem lịch đấu!' });
      await loadBracket(); // Reload bracket
    } catch (err: any) {
      toast({ title: 'Lỗi', description: err.response?.data?.message || 'Không thể công khai lịch thi đấu', variant: 'destructive' });
    } finally {
      setIsPublishingSchedule(false);
    }
  };

  const handleUnpublishSchedule = async () => {
    if (!tournament) return;
    setIsUnpublishingSchedule(true);
    try {
      const updated = await tournamentService.unpublishSchedule(tournamentId);
      setTournament(updated);
      toast({ title: 'Thành công', description: 'Đã ẩn lịch thi đấu. Chỉ bạn mới xem được lịch.' });
      await loadBracket(); // Reload bracket
    } catch (err: any) {
      toast({ title: 'Lỗi', description: err.response?.data?.message || 'Không thể ẩn lịch thi đấu', variant: 'destructive' });
    } finally {
      setIsUnpublishingSchedule(false);
    }
  };

  const handleAssignTeam = async (matchId: number, data: { home_team_id?: number; away_team_id?: number }) => {
    console.log('🔄 Assigning team to match:', matchId, data);
    try {
      const result = await matchService.assignTeam(matchId, data);
      console.log('✅ Team assigned successfully:', result);
      toast({ title: 'Thành công', description: 'Đã gán đội vào trận đấu' });
      await loadBracket();
    } catch (err: any) {
      console.error('❌ Failed to assign team:', err);
      const errorMsg = err.response?.data?.message || err.message || 'Không thể gán đội';
      toast({ title: 'Lỗi', description: errorMsg, variant: 'destructive' });
      throw err; // Re-throw để ScheduleBuilder biết có lỗi
    }
  };

  const handleUpdateMatch = async (matchId: number, data: { match_date?: string; match_time?: string; field_id?: number }) => {
    try {
      await matchService.update(matchId, data);
      toast({ title: 'Thành công', description: 'Đã cập nhật trận đấu' });
      await loadBracket();
    } catch (err: any) {
      toast({ title: 'Lỗi', description: err.response?.data?.message || 'Không thể cập nhật trận đấu', variant: 'destructive' });
    }
  };

  // ---- render states ----
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-8 mt-20 flex items-center justify-center">
          <Loader2 className="w-10 h-10 animate-spin text-primary" />
        </main>
        <Footer />
      </div>
    );
  }

  if (tournamentError || !tournament) {
    // Check if tournament was deleted (404 or "No query results" error)
    const isDeleted = tournamentError?.includes('No query results') ||
      tournamentError?.includes('not found') ||
      tournamentError?.includes('404');

    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-8 mt-20">
          <Button variant="ghost" onClick={() => navigate(-1)} className="mb-6">
            <ArrowLeft className="w-4 h-4 mr-2" /> Quay lại
          </Button>
          <Card className="p-12 text-center space-y-4">
            <AlertCircle className="w-16 h-16 text-destructive mx-auto" />
            <div className="space-y-2">
              <p className="font-semibold text-xl">
                {isDeleted ? 'Giải đấu không tồn tại' : 'Không thể tải giải đấu'}
              </p>
              <p className="text-muted-foreground">
                {isDeleted
                  ? 'Giải đấu này đã bị xóa hoặc không còn tồn tại. Có thể do thanh toán bị từ chối hoặc giải đấu đã bị hủy.'
                  : (tournamentError || 'Không tìm thấy giải đấu này.')
                }
              </p>
            </div>
            <div className="flex gap-2 justify-center pt-4">
              {isDeleted ? (
                <>
                  {user && (
                    <Button onClick={() => navigate('/my-tournaments')} variant="default">
                      <Trophy className="w-4 h-4 mr-2" />
                      Quản lý giải đấu
                    </Button>
                  )}
                  <Button onClick={() => navigate('/tournaments')} variant="outline">
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Danh sách giải đấu
                  </Button>
                </>
              ) : (
                <>
                  <Button onClick={loadTournament} variant="default">Thử lại</Button>
                  <Button onClick={() => navigate('/tournaments')} variant="outline">
                    Quay lại danh sách
                  </Button>
                </>
              )}
            </div>
          </Card>
        </main>
        <Footer />
      </div>
    );
  }

  // Giờ dữ liệu từ API public đã nhất quán cho cả đăng nhập và chưa đăng nhập
  const isFull = tournament.is_full === true;
  const approvedCount = tournament.approved_teams_count ?? tournament.registered_teams_count ?? 0;
  const availableSlots = tournament.available_slots ?? (tournament.max_teams - approvedCount);
  const canRegister = tournament.status === 'open' && !isFull;
  const isOrganizer = user && tournament.organizer_id && String(user.id) === String(tournament.organizer_id);
  const canPublish = tournament.status === 'draft' && (isOrganizer || isAdmin());
  const canManage = isOrganizer || isAdmin();

  // Lấy danh sách đội từ nhiều nguồn (ưu tiên bracket > tournament > registrations)
  const tournamentTeams = bracket?.teams || tournament.teams ||
    (tournament.registrations || [])
      .filter((r: any) => (r.registration_status || r.status) === 'approved')
      .map((r: any) => ({
        id: r.team_id || r.team?.id,
        name: r.team?.name || 'Team',
        logo: r.team?.logo,
      }));

  console.log('tournamentTeams', tournamentTeams);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8 mt-20">
        {/* Back button */}
        <Button variant="ghost" onClick={() => navigate('/tournaments')} className="mb-6">
          <ArrowLeft className="w-4 h-4 mr-2" /> Quay lại danh sách
        </Button>

        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
            <div className="flex items-start gap-4">
              <div className="w-16 h-16 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Trophy className="w-8 h-8 text-primary" />
              </div>
              <div>
                <h1 className="text-3xl md:text-4xl font-bold mb-2">{tournament.name}</h1>
                <div className="flex flex-wrap gap-2">
                  <TournamentStatusBadge status={tournament.status} />
                  <TournamentFormatBadge format={tournament.format} />
                </div>
              </div>
            </div>
            {
              canManage ? <div className="flex flex-wrap gap-2  text-md text-white bg-green-600 p-3 rounded-xl">
                Ban tổ chức giải  : <span className=" uppercase  font-semibold">{tournament.organizer?.name || 'N/A'}</span>
              </div> :
                <div className="flex flex-wrap gap-2">
                  {tournament.status === 'open' && !canManage && (
                    <Button
                      size="lg"
                      className={`gap-2 ${isFull ? 'opacity-60 cursor-not-allowed' : ''}`}
                      onClick={() => !isFull && setIsRegistrationDialogOpen(true)}
                      disabled={isFull}
                      variant={isFull ? 'outline' : 'default'}
                    >
                      <CheckCircle className="w-5 h-5" />
                      {isFull ? 'Đã đủ đội' : 'Đăng ký tham gia'}
                    </Button>
                  )}
                  {canPublish && (
                    <Button size="lg" className="gap-2 bg-green-600 hover:bg-green-700" onClick={handlePublish} disabled={isPublishing}>
                      {isPublishing ? <Loader2 className="w-5 h-5 animate-spin" /> : <Megaphone className="w-5 h-5" />}
                      Mở đăng ký
                    </Button>
                  )}
                </div>
            }

          </div>

          {/* Info cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-5">
                <div className="flex items-center gap-3">
                  <MapPin className="w-5 h-5 text-muted-foreground shrink-0" />
                  <div className="min-w-0">
                    <p className="text-xs text-muted-foreground">Địa điểm</p>
                    <p className="font-semibold truncate">{tournament.field_cluster?.name || 'N/A'}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-5">
                <div className="flex items-center gap-3">
                  <Users className={`w-5 h-5 shrink-0 ${isFull ? 'text-red-500' : 'text-green-500'}`} />
                  <div>
                    <p className="text-xs text-muted-foreground">Số đội tham gia</p>
                    <p className={`font-semibold ${isFull ? 'text-red-500' : 'text-green-600'}`}>
                      {tournamentTeams.length} / {tournament.max_teams} đội
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-5">
                <div className="flex items-center gap-3">
                  <Calendar className="w-5 h-5 text-muted-foreground shrink-0" />
                  <div>
                    <p className="text-xs text-muted-foreground">Đăng ký từ ngày</p>
                    <p className="font-semibold text-sm">{formatDate(tournament.registration_start)} – {formatDate(tournament.registration_end)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-5">
                <div className="flex items-center gap-3">
                  <Trophy className="w-5 h-5 text-muted-foreground shrink-0" />
                  <div>
                    <p className="text-xs text-muted-foreground">Thi đấu</p>
                    <p className="font-semibold text-sm">{formatDate(tournament.start_date)} – {formatDate(tournament.end_date)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Warning banners */}
          {isFull && (
            <div className="mt-4 flex items-center gap-2 px-4 py-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm font-medium">
              <AlertCircle className="w-4 h-4 shrink-0" />
              Giải đấu đã đủ {tournamentTeams.length}/{tournament.max_teams} đội. Không thể đăng ký thêm.
            </div>
          )}

          {/* Payment Info Card - hiển thị nếu có payment_method */}
          {tournament.payment_method && canPublish && (
            <div className="mt-4">
              <PaymentInfoCard
                tournament={tournament}
                onPublish={handlePublish}
                isPublishing={isPublishing}
                onRefresh={loadTournament}
              />
            </div>
          )}
          {!isFull && availableSlots <= 2 && availableSlots > 0 && (
            <div className="mt-4 flex items-center gap-2 px-4 py-3 rounded-lg bg-yellow-50 border border-yellow-200 text-yellow-700 text-sm font-medium">
              <AlertCircle className="w-4 h-4 shrink-0" />
              Chỉ còn {availableSlots} chỗ trống! Đăng ký sớm để không bỏ lỡ.
            </div>
          )}
        </div>

        {/* Tabs */}
        <Tabs defaultValue="info" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="info" className="gap-1.5">
              <Info className="w-4 h-4" /><span className="hidden sm:inline">Thông tin</span>
            </TabsTrigger>
            <TabsTrigger value="registrations" className="gap-1.5">
              <ClipboardList className="w-4 h-4" />
              <span className="hidden sm:inline">Danh sách đội đăng ký</span>
              {registrations.length > 0 && <span className="ml-1 text-xs bg-primary/20 px-1.5 rounded-full">{registrations.length}</span>}
            </TabsTrigger>
            <TabsTrigger value="matches" className="gap-1.5">
              <Swords className="w-4 h-4" />
              <span className="hidden sm:inline">Lịch thi đấu</span>
              {allMatches.length > 0 && <span className="ml-1 text-xs bg-primary/20 px-1.5 rounded-full">{allMatches.length}</span>}
            </TabsTrigger>
            <TabsTrigger value="standings" className="gap-1.5">
              <BarChart3 className="w-4 h-4" /><span className="hidden sm:inline">Bảng xếp hạng</span>
            </TabsTrigger>
          </TabsList>

          {/* ── Tab: Thông tin ── */}
          <TabsContent value="info" className="space-y-4">
            <Card>
              <CardHeader><CardTitle>Thông tin chi tiết</CardTitle></CardHeader>
              <CardContent className="space-y-5">
                {tournament.description ? (
                  <div>
                    <p className="text-sm font-semibold mb-1 text-muted-foreground uppercase tracking-wide">Mô tả</p>
                    <p>{tournament.description}</p>
                  </div>
                ) : (
                  <p className="text-muted-foreground text-sm italic">Chưa có mô tả</p>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground mb-1">Thể thức</p>
                    <TournamentFormatBadge format={tournament.format} />
                  </div>
                  <div>
                    <p className="text-muted-foreground mb-1">Số đội (tối thiểu / tối đa)</p>
                    <p className="font-medium">{tournament.min_teams} – {tournament.max_teams} đội</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground mb-1">Thời gian đăng ký</p>
                    <p className="font-medium">{formatDate(tournament.registration_start)} – {formatDate(tournament.registration_end)}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground mb-1">Thời gian thi đấu</p>
                    <p className="font-medium">{formatDate(tournament.start_date)} – {formatDate(tournament.end_date)}</p>
                  </div>
                </div>

                {tournament.organizer && (
                  <div>
                    <p className="text-sm font-semibold mb-1 text-muted-foreground uppercase tracking-wide">Ban tổ chức</p>
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-muted-foreground" />
                      <span>{tournament.organizer.name}</span>
                      <span className="text-muted-foreground text-sm">— {tournament.organizer.email}</span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Thể lệ giải đấu */}
            <RulesFileSection
              tournament={tournament}
              canEdit={canManage}
              onUpdate={loadTournament}
            />

            {/* Danh sách sân đã đặt - CHỈ HIỂN THỊ CHO ORGANIZER/ADMIN */}
            {canManage && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>Sân thi đấu đã đặt</span>
                    {bookingsLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {bookingsError ? (
                    <Card className="border-red-200 bg-red-50">
                      <CardContent className="pt-5">
                        <div className="flex items-start gap-3">
                          <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 shrink-0" />
                          <div>
                            <p className="font-medium text-red-800">Lỗi tải danh sách sân</p>
                            <p className="text-sm text-red-700 mt-1">{bookingsError}</p>
                            <Button size="sm" variant="outline" onClick={loadFieldBookings} className="mt-2">
                              Thử lại
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ) : fieldBookings.length === 0 ? (
                    <Card className="border-yellow-200 bg-yellow-50">
                      <CardContent className="pt-5">
                        <div className="flex items-start gap-3">
                          <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5 shrink-0" />
                          <p className="text-sm text-yellow-800">
                            Chưa có sân nào được đặt cho giải đấu này.
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                      {fieldBookings.map((booking) => {
                        const bookingDate = booking.day_book || booking.booking_date;
                        const fieldType = booking.field?.field_type || '5v5';

                        return (
                          <Card
                            key={booking.id}
                            className="relative overflow-hidden border-2 border-green-200 hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
                          >
                            {/* Gradient background giống sân cỏ */}
                            <div className="absolute inset-0 bg-gradient-to-br from-green-50 via-green-100 to-emerald-100 opacity-60" />

                            {/* Pattern sọc ngang như sân cỏ thật */}
                            <div className="absolute inset-0 opacity-10">
                              <div className="h-full w-full bg-[repeating-linear-gradient(0deg,transparent,transparent_10px,rgba(34,197,94,0.3)_10px,rgba(34,197,94,0.3)_20px)]" />
                            </div>

                            {/* Status badge */}
                            <div className="absolute top-2 right-2 z-10">
                              {booking.status === 'confirmed' && (
                                <div className="bg-green-600 text-white text-xs font-semibold px-2 py-1 rounded-full flex items-center gap-1 shadow-md">
                                  <CheckCircle className="w-3 h-3" />
                                  Đã xác nhận
                                </div>
                              )}
                              {booking.status === 'pending' && (
                                <div className="bg-yellow-500 text-white text-xs font-semibold px-2 py-1 rounded-full flex items-center gap-1 shadow-md">
                                  <Clock className="w-3 h-3" />
                                  Chờ xác nhận
                                </div>
                              )}
                              {booking.status === 'completed' && (
                                <div className="bg-blue-600 text-white text-xs font-semibold px-2 py-1 rounded-full flex items-center gap-1 shadow-md">
                                  <CheckCircle className="w-3 h-3" />
                                  Hoàn thành
                                </div>
                              )}
                              {booking.status === 'cancelled' && (
                                <div className="bg-red-600 text-white text-xs font-semibold px-2 py-1 rounded-full flex items-center gap-1 shadow-md">
                                  <AlertCircle className="w-3 h-3" />
                                  Đã hủy
                                </div>
                              )}
                            </div>

                            <CardContent className="pt-4 space-y-4 relative z-10">
                              {/* Icon sân bóng */}
                              <div className="flex justify-center mb-2">
                                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center shadow-lg border-2 border-white">
                                  <svg
                                    className="w-7 h-7 text-white"
                                    fill="currentColor"
                                    viewBox="0 0 24 24"
                                  >
                                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z" />
                                    <path d="M12 6c-3.31 0-6 2.69-6 6s2.69 6 6 6 6-2.69 6-6-2.69-6-6-6zm0 10c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4z" />
                                    <circle cx="12" cy="12" r="2" />
                                  </svg>
                                </div>
                              </div>

                              {/* Tên sân và loại sân */}
                              <div className="text-center">
                                <h4 className="font-bold text-lg text-green-900 truncate">
                                  {booking.field?.name || 'Sân'}
                                </h4>
                                <div className="flex items-center justify-center gap-2 mt-1">
                                  <span className="inline-flex items-center bg-green-600 text-white text-xs font-bold px-2.5 py-1 rounded-full shadow-sm">
                                    ⚽ {fieldType.toUpperCase()}
                                  </span>
                                </div>
                              </div>

                              {/* Thông tin chi tiết */}
                              <div className="space-y-2 bg-white/80 backdrop-blur-sm rounded-lg p-3 shadow-sm border border-green-100">
                                {booking.field?.field_cluster && (
                                  <div className="flex items-center gap-2 text-xs text-gray-700">
                                    <MapPin className="w-3.5 h-3.5 text-green-600 shrink-0" />
                                    <span className="font-medium truncate">{booking.field.field_cluster.name}</span>
                                  </div>
                                )}

                                <div className="flex items-center gap-2 text-xs text-gray-700">
                                  <Calendar className="w-3.5 h-3.5 text-green-600 shrink-0" />
                                  <span className="font-medium">{formatDate(bookingDate)}</span>
                                </div>

                                <div className="flex items-center gap-2 text-xs text-gray-700">
                                  <Clock className="w-3.5 h-3.5 text-green-600 shrink-0" />
                                  <span className="font-semibold text-green-700">
                                    {booking.start_time} - {booking.end_time}
                                  </span>
                                </div>
                              </div>

                              {/* Price */}
                              {booking.total_price && (
                                <div className="flex items-center justify-between p-2.5 bg-primary/10 rounded-lg">
                                  <div className="flex items-center gap-2">
                                    <DollarSign className="w-3.5 h-3.5 text-primary" />
                                    <span className="font-medium text-xs">Giá</span>
                                  </div>
                                  <span className="font-bold text-primary text-sm">
                                    {formatCurrency(booking.total_price)}
                                  </span>
                                </div>
                              )}

                              {/* Payment Method */}
                              {booking.payment_method && (
                                <div className="space-y-2 pt-2 border-t border-green-200">
                                  <div className="flex items-center justify-between text-xs">
                                    <span className="text-gray-600">Thanh toán:</span>
                                    <Badge variant="outline" className="text-xs font-semibold text-primary">
                                      {booking.payment_method === 'transfer' ? '🏦 Chuyển khoản' : '💵 Tiền mặt'}
                                    </Badge>
                                  </div>

                                  {booking.payment_method === 'transfer' && (
                                    <div className="flex items-center justify-between text-xs">
                                      <span className="text-gray-600">Trạng thái:</span>
                                      <Badge
                                        variant={booking.payment_status === 'paid' ? 'default' : 'secondary'}
                                        className={`text-xs font-semibold ${booking.payment_status === 'paid' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}
                                      >
                                        {booking.payment_status === 'paid' ? '✓ Đã thanh toán' : '⏳ Chờ xác nhận'}
                                      </Badge>
                                    </div>
                                  )}
                                </div>
                              )}

                              {/* Customer Contact */}
                              {(booking.customer_name || booking.customer_phone) && (
                                <div className="space-y-1 text-xs border-t border-green-200 pt-2">
                                  {booking.customer_name && (
                                    <p><span className="text-gray-600">Người đặt:</span> <span className="font-medium">{booking.customer_name}</span></p>
                                  )}
                                  {booking.customer_phone && (
                                    <p className="text-gray-700">{booking.customer_phone}</p>
                                  )}
                                </div>
                              )}

                              {/* Owner Contact */}
                              {booking.field?.field_cluster?.phone && (
                                <div className="space-y-1 text-xs border-t border-green-200 pt-2">
                                  <p className="font-semibold text-gray-700">Liên hệ chủ sân:</p>
                                  <a href={`tel:${booking.field.field_cluster.phone}`} className="text-blue-600 hover:underline">
                                    {booking.field.field_cluster.phone}
                                  </a>
                                </div>
                              )}

                              {/* Note */}
                              {booking.note && (
                                <div className="p-2 bg-amber-50 rounded text-xs border border-amber-200">
                                  <p><span className="font-medium text-amber-900">Ghi chú:</span> <span className="text-amber-800">{booking.note}</span></p>
                                </div>
                              )}
                            </CardContent>
                          </Card>
                        )
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* ── Tab: Đăng ký ── */}
          <TabsContent value="registrations">
            {regLoading ? (
              <TabLoading />
            ) : regError ? (
              <TabError message={regError} onRetry={loadRegistrations} />
            ) : (() => {
              // Ưu tiên dùng tournament.registrations (từ API public), fallback sang registrations từ API call riêng
              // Vì khi chưa login, API /tournament-registrations sẽ lỗi 401 và set registrations = []
              const sourceRegistrations = (tournament.registrations && tournament.registrations.length > 0)
                ? tournament.registrations.map((r: any) => ({
                  ...r,
                  // Backend dùng registration_status, frontend dùng status
                  status: r.registration_status || r.status,
                  tournament_id: r.tournament_id || tournament.id,
                  registered_at: r.registered_at || r.registration_date || r.created_at || new Date().toISOString(),
                }))
                : registrations;

              // Nếu không phải organizer/admin thì chỉ hiển thị các đội đã approved
              const displayRegistrations = canManage
                ? sourceRegistrations
                : sourceRegistrations.filter((r: any) => r.status === 'approved');

              return displayRegistrations.length === 0 ? (
                <TabEmpty
                  icon={ClipboardList}
                  text={canManage
                    ? "Chưa có đội nào đăng ký tham gia giải đấu này."
                    : "Chưa có đội nào được duyệt tham gia giải đấu này."
                  }
                />
              ) : (
                <>
                  {!canManage && (
                    <Card className="border-blue-200 bg-blue-50 mb-4">
                      <CardContent className="pt-5">
                        <div className="flex items-start gap-3">
                          <Users className="w-5 h-5 text-blue-600 mt-0.5 shrink-0" />
                          <div>
                            <p className="font-medium text-blue-800">
                              Danh sách các đội tham gia
                            </p>
                            <p className="text-sm text-blue-700 mt-1">
                              {displayRegistrations.length} đội đã được duyệt tham gia giải đấu
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                  <RegistrationList
                    registrations={displayRegistrations as TournamentRegistration[]}
                    onApprove={canManage ? handleApproveRegistration : undefined}
                    onReject={canManage ? handleRejectRegistration : undefined}
                    showActions={!!canManage}
                  />
                </>
              );
            })()}
          </TabsContent>

          {/* ── Tab: Lịch thi đấu ── */}
          <TabsContent value="matches">
            {matchLoading ? (
              <TabLoading />
            ) : matchError ? (
              <TabError message={matchError} onRetry={loadBracket} />
            ) : canManage ? (
              <ScheduleBuilder
                tournamentId={tournamentId}
                format={tournament.format}
                maxTeams={tournament.max_teams}
                registrations={registrations}
                teams={tournamentTeams}
                matches={allMatches}
                onGenerateSchedule={handleOpenScheduleDialog}
                onDeleteSchedule={handleDeleteSchedule}
                onPublishSchedule={handlePublishSchedule}
                onUnpublishSchedule={handleUnpublishSchedule}
                onAssignTeam={handleAssignTeam}
                onUpdateMatch={handleUpdateMatch}
                onScoreUpdated={loadBracket}
                isGenerating={isGeneratingSchedule}
                isDeleting={isDeletingSchedule}
                isPublishing={isPublishingSchedule}
                isUnpublishing={isUnpublishingSchedule}
                schedulePublished={tournament.schedule_published || false}
              />
            ) : tournament.schedule_published ? (
              <TournamentBracketView
                tournamentId={tournamentId}
                format={tournament.format}
                bracket={bracket}
                canManage={canManage}
                onScoreUpdated={loadBracket}
                myTeamId={
                  user
                    ? (teams.find((t) => String(t.captain_id) === String(user.id) || String((t as any).captain_user_id) === String(user.id))?.id)
                    : undefined
                }
              />
            ) : (
              <Card className="border-yellow-200 bg-yellow-50">
                <CardContent className="py-12 text-center space-y-3">
                  <AlertCircle className="w-10 h-10 text-yellow-600 mx-auto" />
                  <p className="font-medium text-yellow-800">Lịch thi đấu chưa được công bố</p>
                  <p className="text-sm text-yellow-700">
                    Ban tổ chức đang chuẩn bị lịch thi đấu. Vui lòng quay lại sau khi lịch được công khai.
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* ── Tab: Bảng xếp hạng ── */}
          <TabsContent value="standings">
            {matchLoading ? (
              <TabLoading />
            ) : standings.length === 0 ? (
              <TabEmpty icon={BarChart3} text="Chưa có dữ liệu xếp hạng. Bảng xếp hạng sẽ cập nhật sau mỗi trận đấu." />
            ) : bracket?.groups && bracket.groups.length > 1 ? (
              // Multiple groups → show each group's standings in a grid
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {bracket.groups.map((group: any) => {
                  const groupStandings = standings.filter((s) => s.group_id === group.id);
                  return groupStandings.length > 0 ? (
                    <GroupStandingsTable
                      key={group.id}
                      standings={groupStandings}
                      groupName={group.group_name}
                    />
                  ) : null;
                })}
              </div>
            ) : (
              <GroupStandingsTable standings={standings} />
            )}
          </TabsContent>
        </Tabs>
      </main>

      {/* Schedule Generation Dialog */}
      <Dialog open={scheduleDialogOpen} onOpenChange={setScheduleDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Cấu hình sinh lịch thi đấu</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="rounded-md border bg-muted/30 px-3 py-2 text-sm text-muted-foreground">
              Tổng số đội đã duyệt: <span className="font-semibold text-foreground">{approvedTeamsForSchedule}</span>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="auto-select-fields"
                checked={scheduleAutoSelectFields}
                onCheckedChange={(checked) => setScheduleAutoSelectFields(checked === true)}
              />
              <Label
                htmlFor="auto-select-fields"
                className="text-sm font-normal cursor-pointer"
              >
                Tự động chọn tất cả sân đã đặt (khuyên dùng)
              </Label>
            </div>

            {tournament?.format === 'group_knockout' && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="num-groups">Số bảng (groups)</Label>
                  <Input
                    id="num-groups"
                    type="number"
                    min="2"
                    max="8"
                    value={scheduleNumGroups}
                    onChange={(e) => handleNumGroupsChange(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">Số lượng bảng trong vòng bảng (2-8). Khi đổi số bảng, hệ thống tự tính số đội mỗi bảng theo tổng đội.</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="teams-per-group">Số đội mỗi bảng</Label>
                  <Input
                    id="teams-per-group"
                    type="number"
                    min="2"
                    max="16"
                    value={scheduleTeamsPerGroup}
                    onChange={(e) => handleTeamsPerGroupChange(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">Số đội mỗi bảng (2-16). Khi đổi số đội/bảng, hệ thống tự tính lại số bảng theo tổng đội.</p>
                </div>

                <p className="text-xs text-muted-foreground">
                  Cấu hình hiện tại: {scheduleNumGroups} bảng, khoảng {scheduleTeamsPerGroup} đội/bảng. Hệ thống lấy 2 đội/bảng (nhất + nhì) vào vòng knockout với cơ chế cross-matching.
                </p>
              </>
            )}

            <div className="space-y-2">
              <Label htmlFor="days-between">Ngày giữa các vòng</Label>
              <Input
                id="days-between"
                type="number"
                min="1"
                max="30"
                value={scheduleDaysBetweenRounds}
                onChange={(e) => setScheduleDaysBetweenRounds(Math.max(1, Math.min(30, parseInt(e.target.value) || 3)))}
              />
              <p className="text-xs text-muted-foreground">Số ngày cách nhau giữa các vòng đấu</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="match-duration">Thời gian trận (phút)</Label>
                <Input
                  id="match-duration"
                  type="number"
                  min="30"
                  max="180"
                  value={scheduleMatchDuration}
                  onChange={(e) => setScheduleMatchDuration(Math.max(30, Math.min(180, parseInt(e.target.value) || 60)))}
                />
                <p className="text-xs text-muted-foreground">Thời gian trung bình 1 trận</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="preparation-time">Thời gian chuẩn bị (phút)</Label>
                <Input
                  id="preparation-time"
                  type="number"
                  min="0"
                  max="60"
                  value={schedulePreparationTime}
                  onChange={(e) => setSchedulePreparationTime(Math.max(0, Math.min(60, parseInt(e.target.value) || 15)))}
                />
                <p className="text-xs text-muted-foreground">Thời gian dọn dẹp sau trận</p>
              </div>
            </div>

            {(tournament?.format === 'knockout' || tournament?.format === 'group_knockout') && (
              <div className="flex items-center space-x-2 p-3 rounded-lg bg-primary/5 border border-primary/20">
                <Checkbox
                  id="create-third-place"
                  checked={scheduleCreateThirdPlaceMatch}
                  onCheckedChange={(checked) => setScheduleCreateThirdPlaceMatch(checked === true)}
                />
                <Label
                  htmlFor="create-third-place"
                  className="text-sm font-normal cursor-pointer flex-1"
                >
                  <div className="font-semibold text-foreground">🥉 Tạo trận tranh hạng 3</div>
                  <p className="text-xs text-muted-foreground mt-0.5">Thêm trận tranh hạng 3 giữa 2 đội thua bán kết</p>
                </Label>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setScheduleDialogOpen(false)}>
              Hủy
            </Button>
            <Button onClick={handleGenerateSchedule} disabled={isGeneratingSchedule}>
              {isGeneratingSchedule ? 'Đang sinh...' : 'Sinh lịch'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Registration Dialog */}
      <RegistrationFormDialog
        open={isRegistrationDialogOpen}
        onOpenChange={setIsRegistrationDialogOpen}
        onSubmit={handleRegister}
        tournamentId={tournament.id}
        teams={teams}
        onTeamCreated={async (team) => {
          await loadTeams();
          // teams state is updated, also set the new team selected in dialog
        }}
      />

      {/* Update Score Dialog */}
      {selectedMatch && (
        <UpdateScoreDialog
          open={isScoreDialogOpen}
          onOpenChange={setIsScoreDialogOpen}
          onSubmit={handleUpdateScore}
          homeTeamName={selectedMatch.home_team?.name || 'Home'}
          awayTeamName={selectedMatch.away_team?.name || 'Away'}
        />
      )}

      <Footer />
    </div>
  );
};

export default TournamentDetail;
