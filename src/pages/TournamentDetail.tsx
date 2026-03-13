import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { Tournament, tournamentService } from '@/services/tournamentService';
import { registrationService, RegistrationRequest, TournamentRegistration } from '@/services/registrationService';
import { matchService, Match } from '@/services/matchService';
import { standingsService, GroupStanding } from '@/services/standingsService';
import { teamService, Team } from '@/services/teamService';
import { TournamentStatusBadge, TournamentFormatBadge } from '@/components/Tournament/TournamentStatusBadge';
import { RegistrationFormDialog } from '@/components/Registration/RegistrationFormDialog';
import { RegistrationList } from '@/components/Registration/RegistrationList';
import { MatchCard } from '@/components/Match/MatchCard';
import { UpdateScoreDialog } from '@/components/Match/UpdateScoreDialog';
import { GroupStandingsTable } from '@/components/Standings/GroupStandingsTable';
import { Trophy, MapPin, Users, Calendar, ArrowLeft, CheckCircle, Loader2, FileText, User } from 'lucide-react';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';

const TournamentDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { isAdmin } = useAuth();

  // States
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [registrations, setRegistrations] = useState<TournamentRegistration[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [standings, setStandings] = useState<GroupStanding[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRegistrationDialogOpen, setIsRegistrationDialogOpen] = useState(false);
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);
  const [isScoreDialogOpen, setIsScoreDialogOpen] = useState(false);

  // Load data
  useEffect(() => {
    if (id) {
      loadTournamentData();
    }
  }, [id]);

  const loadTournamentData = async () => {
    setIsLoading(true);
    try {
      const tournamentId = parseInt(id!);
      
      // Load tournament detail
      const tournamentData = await tournamentService.getById(tournamentId);
      setTournament(tournamentData);

      // Load related data (with fallbacks) - không để lỗi này ảnh hưởng đến trang
      try {
        const registrationsData = await registrationService.getAll({ tournament_id: tournamentId }).catch(err => {
          console.warn('Failed to load registrations:', err);
          return [];
        });
        setRegistrations(registrationsData);
      } catch (err) {
        console.warn('Registration service error:', err);
      }

      try {
        const matchesData = await matchService.getAll({ tournament_id: tournamentId }).catch(err => {
          console.warn('Failed to load matches:', err);
          return [];
        });
        setMatches(matchesData);
      } catch (err) {
        console.warn('Match service error:', err);
      }

      try {
        const standingsData = await standingsService.getByTournament(tournamentId).catch(err => {
          console.warn('Failed to load standings:', err);
          return [];
        });
        setStandings(standingsData);
      } catch (err) {
        console.warn('Standings service error:', err);
      }

      try {
        const teamsData = await teamService.getAll().catch(err => {
          console.warn('Failed to load teams:', err);
          return [];
        });
        setTeams(teamsData);
      } catch (err) {
        console.warn('Team service error:', err);
      }
    } catch (error: any) {
      console.error('Error loading tournament:', error);
      toast({
        title: 'Lỗi kết nối API',
        description: error.response?.data?.message || 'Không thể tải thông tin giải đấu. Vui lòng kiểm tra backend.',
        variant: 'destructive',
      });
      // Don't navigate away immediately, show error in page
      setTournament(null);
    } finally {
      setIsLoading(false);
    }
  };

  // Registration handlers
  const handleRegister = async (data: RegistrationRequest) => {
    await registrationService.create(data);
    await loadTournamentData(); // Reload data
  };

  const handleApproveRegistration = async (registrationId: number) => {
    try {
      await registrationService.approve(registrationId);
      toast({
        title: 'Thành công',
        description: 'Đã duyệt đăng ký',
      });
      await loadTournamentData();
    } catch (error: any) {
      toast({
        title: 'Lỗi',
        description: error.response?.data?.message || 'Không thể duyệt đăng ký',
        variant: 'destructive',
      });
    }
  };

  const handleRejectRegistration = async (registrationId: number, reason: string) => {
    try {
      await registrationService.reject(registrationId, { reason });
      toast({
        title: 'Thành công',
        description: 'Đã từ chối đăng ký',
      });
      await loadTournamentData();
    } catch (error: any) {
      toast({
        title: 'Lỗi',
        description: error.response?.data?.message || 'Không thể từ chối đăng ký',
        variant: 'destructive',
      });
    }
  };

  // Match handlers
  const handleMatchClick = (match: Match) => {
    setSelectedMatch(match);
    setIsScoreDialogOpen(true);
  };

  const handleUpdateScore = async (data: { home_score: number; away_score: number; status: 'completed' | 'in_progress' }) => {
    if (selectedMatch) {
      await matchService.updateScore(selectedMatch.id, data);
      await loadTournamentData(); // Reload to get updated standings
    }
  };

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'dd/MM/yyyy', { locale: vi });
    } catch {
      return dateString;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-8 mt-20">
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!tournament) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-8 mt-20">
          <Card className="p-12 text-center">
            <p className="text-muted-foreground">Không tìm thấy giải đấu</p>
          </Card>
        </main>
        <Footer />
      </div>
    );
  }

  const canRegister = tournament.status === 'open';

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8 mt-20">
        {/* Back button */}
        <Button variant="ghost" onClick={() => navigate('/tournaments')} className="mb-6">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Quay lại danh sách
        </Button>

        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
            <div className="flex items-start gap-4">
              <div className="w-16 h-16 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Trophy className="w-8 h-8 text-primary" />
              </div>
              <div>
                <h1 className="text-4xl font-bold mb-2">{tournament.name}</h1>
                <div className="flex flex-wrap gap-2">
                  <TournamentStatusBadge status={tournament.status} className="text-lg px-3 py-1" />
                  <TournamentFormatBadge format={tournament.format} className="text-lg px-3 py-1" />
                </div>
              </div>
            </div>
            
            {canRegister && (
              <Button size="lg" className="gap-2" onClick={() => setIsRegistrationDialogOpen(true)}>
                <CheckCircle className="w-5 h-5" />
                Đăng ký tham gia
              </Button>
            )}
          </div>

          {/* Tournament Info Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <MapPin className="w-5 h-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Địa điểm</p>
                    <p className="font-semibold">{tournament.field_cluster?.name || 'N/A'}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <Users className="w-5 h-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Số đội</p>
                    <p className="font-semibold">
                      {tournament.registered_teams_count || 0} / {tournament.max_teams}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <Calendar className="w-5 h-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Thời gian</p>
                    <p className="font-semibold">
                      {formatDate(tournament.start_date)} - {formatDate(tournament.end_date)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="info" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="info">Thông tin</TabsTrigger>
            <TabsTrigger value="registrations">
              Đăng ký ({registrations.length})
            </TabsTrigger>
            <TabsTrigger value="matches">
              Lịch thi đấu ({matches.length})
            </TabsTrigger>
            <TabsTrigger value="standings">Bảng xếp hạng</TabsTrigger>
          </TabsList>

          {/* Tab: Thông tin */}
          <TabsContent value="info" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Thông tin chi tiết</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {tournament.description && (
                  <div>
                    <h3 className="font-semibold mb-2">Mô tả</h3>
                    <p className="text-muted-foreground">{tournament.description}</p>
                  </div>
                )}
                
                <div>
                  <h3 className="font-semibold mb-2">Thể thức thi đấu</h3>
                  <TournamentFormatBadge format={tournament.format} />
                </div>

                <div>
                  <h3 className="font-semibold mb-2">Thời gian đăng ký</h3>
                  <p className="text-muted-foreground">
                    {formatDate(tournament.registration_start)} - {formatDate(tournament.registration_end)}
                  </p>
                </div>

                {tournament.organizer && (
                  <div>
                    <h3 className="font-semibold mb-2 flex items-center gap-2">
                      <User className="w-4 h-4" />
                      Ban tổ chức
                    </h3>
                    <p className="text-muted-foreground">
                      {tournament.organizer.name} - {tournament.organizer.email}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab: Đăng ký */}
          <TabsContent value="registrations">
            <RegistrationList
              registrations={registrations}
              onApprove={isAdmin() ? handleApproveRegistration : undefined}
              onReject={isAdmin() ? handleRejectRegistration : undefined}
              showActions={isAdmin()}
            />
          </TabsContent>

          {/* Tab: Lịch thi đấu */}
          <TabsContent value="matches">
            {matches.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <p className="text-muted-foreground">Chưa có lịch thi đấu</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {matches.map((match) => (
                  <MatchCard
                    key={match.id}
                    match={match}
                    onClick={isAdmin() ? handleMatchClick : undefined}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          {/* Tab: Bảng xếp hạng */}
          <TabsContent value="standings">
            <GroupStandingsTable standings={standings} />
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
