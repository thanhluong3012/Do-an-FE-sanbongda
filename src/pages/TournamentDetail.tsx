import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { Tournament, tournamentService, TournamentBracket, FieldBooking } from '@/services/tournamentService';
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
import {
  Trophy, MapPin, Users, Calendar, ArrowLeft, CheckCircle,
  Loader2, User, Megaphone, AlertCircle, ClipboardList,
  Swords, BarChart3, Info, Clock,
} from 'lucide-react';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';

// ---------- helpers ----------
const formatDate = (dateString: string | null | undefined) => {
  if (!dateString) return 'Chưa có ngày';
  try { return format(new Date(dateString), 'dd/MM/yyyy', { locale: vi }); }
  catch { return dateString; }
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
      const hasToken = !!localStorage.getItem('access_token');
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

  // ---- loaders ----
  const loadTournament = async () => {
    setIsLoading(true);
    setTournamentError(null);
    try {
      const data = await tournamentService.getById(tournamentId);
      setTournament(data);
    } catch (err: any) {
      setTournamentError(err.response?.data?.message || 'Không thể tải thông tin giải đấu.');
    } finally {
      setIsLoading(false);
    }
  };

  const loadRegistrations = async () => {
    // Chỉ gọi khi có token (API cần auth)
    if (!localStorage.getItem('access_token')) return;
    
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
    if (!localStorage.getItem('access_token')) return;
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
  const handleGenerateSchedule = async () => {
    if (!tournament) return;
    setIsGeneratingSchedule(true);
    try {
      await tournamentService.generateSchedule(tournamentId, {
        start_date: tournament.start_date,
        end_date: tournament.end_date,
      });
      toast({ title: 'Thành công', description: 'Đã tự động sinh lịch thi đấu!' });
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
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-8 mt-20">
          <Button variant="ghost" onClick={() => navigate('/tournaments')} className="mb-6">
            <ArrowLeft className="w-4 h-4 mr-2" /> Quay lại danh sách
          </Button>
          <Card className="p-12 text-center space-y-3">
            <AlertCircle className="w-12 h-12 text-destructive mx-auto" />
            <p className="font-semibold text-lg">Không thể tải giải đấu</p>
            <p className="text-muted-foreground">{tournamentError || 'Không tìm thấy giải đấu này.'}</p>
            <Button onClick={loadTournament} variant="outline">Thử lại</Button>
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

            <div className="flex flex-wrap gap-2">
              {tournament.status === 'open' && (
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
                      {approvedCount} / {tournament.max_teams} đội
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
                    <p className="text-xs text-muted-foreground">Đăng ký</p>
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
              Giải đấu đã đủ {approvedCount}/{tournament.max_teams} đội. Không thể đăng ký thêm.
            </div>
          )}

          {/* Payment Info Card - hiển thị nếu có payment_method */}
          {tournament.payment_method && canPublish && (
            <div className="mt-4">
              <PaymentInfoCard 
                tournament={tournament}
                onPublish={handlePublish}
                isPublishing={isPublishing}
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
              <span className="hidden sm:inline">Đăng ký</span>
              {registrations.length > 0 && <span className="ml-1 text-xs bg-primary/20 px-1.5 rounded-full">{registrations.length}</span>}
            </TabsTrigger>
            <TabsTrigger value="matches" className="gap-1.5">
              <Swords className="w-4 h-4" />
              <span className="hidden sm:inline">Lịch đấu</span>
              {allMatches.length > 0 && <span className="ml-1 text-xs bg-primary/20 px-1.5 rounded-full">{allMatches.length}</span>}
            </TabsTrigger>
            <TabsTrigger value="standings" className="gap-1.5">
              <BarChart3 className="w-4 h-4" /><span className="hidden sm:inline">Xếp hạng</span>
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
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {fieldBookings.map((booking) => {
                        const bookingDate = booking.day_book || booking.booking_date;
                        return (
                        <Card key={booking.id} className="border-2">
                          <CardContent className="pt-4">
                            <div className="flex items-start gap-3">
                              <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center shrink-0">
                                <MapPin className="w-5 h-5 text-green-600" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <h4 className="font-semibold truncate">{booking.field?.name || 'Sân'}</h4>
                                {booking.field?.field_cluster && (
                                  <p className="text-xs text-muted-foreground truncate">
                                    {booking.field.field_cluster.name}
                                  </p>
                                )}
                                <div className="mt-2 space-y-1 text-xs text-muted-foreground">
                                  <div className="flex items-center gap-1.5">
                                    <Calendar className="w-3 h-3" />
                                    <span>{formatDate(bookingDate)}</span>
                                  </div>
                                  <div className="flex items-center gap-1.5">
                                    <Clock className="w-3 h-3" />
                                    <span>{booking.start_time} - {booking.end_time}</span>
                                  </div>
                                </div>
                              </div>
                              <div className="shrink-0">
                                {booking.status === 'confirmed' && (
                                  <CheckCircle className="w-5 h-5 text-green-600" />
                                )}
                                {booking.status === 'pending' && (
                                  <Clock className="w-5 h-5 text-yellow-600" />
                                )}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      )})}
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
                onGenerateSchedule={handleGenerateSchedule}
                onDeleteSchedule={handleDeleteSchedule}
                onPublishSchedule={handlePublishSchedule}
                onUnpublishSchedule={handleUnpublishSchedule}
                onAssignTeam={handleAssignTeam}
                onUpdateMatch={handleUpdateMatch}
                isGenerating={isGeneratingSchedule}
                isDeleting={isDeletingSchedule}
                isPublishing={isPublishingSchedule}
                isUnpublishing={isUnpublishingSchedule}
                schedulePublished={tournament.schedule_published || false}
              />
            ) : tournament.schedule_published && (!bracket || allMatches.length === 0) ? (
              <TabEmpty icon={Swords} text="Lịch thi đấu đang được chuẩn bị. Vui lòng quay lại sau." />
            ) : tournament.schedule_published && bracket && allMatches.length > 0 ? (
              <div className="space-y-4">
                <Card className="border-green-200 bg-green-50">
                  <CardContent className="pt-5">
                    <div className="flex items-start gap-3">
                      <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 shrink-0" />
                      <p className="text-sm text-green-800">
                        Lịch thi đấu đã được công bố. Xem chi tiết các trận đấu bên dưới.
                      </p>
                    </div>
                  </CardContent>
                </Card>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {allMatches.map((match) => (
                    <MatchCard
                      key={match.id}
                      match={match}
                      onClick={canManage ? handleMatchClick : undefined}
                    />
                  ))}
                </div>
              </div>
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
            ) : (
              <GroupStandingsTable standings={standings} />
            )}
          </TabsContent>
        </Tabs>
      </main>

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
