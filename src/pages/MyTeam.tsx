import { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { teamService, Team, TeamMember } from '@/services/teamService';
import { TeamFormDialog } from '@/components/Team/TeamFormDialog';
import { TeamMemberDialog } from '@/components/Team/TeamMemberDialog';
import {
  Shield, Plus, Pencil, Trash2, Loader2, Users,
  Phone, Mail, UserPlus, ShieldAlert, Hash, User,
  Trophy, Calendar, Clock, MapPin, ChevronRight,
} from 'lucide-react';
import { format as fmtDate, parseISO } from 'date-fns';
import { vi } from 'date-fns/locale';

const fmtMatchDate = (d: string | null | undefined) => {
  if (!d) return '—';
  try { return fmtDate(parseISO(d), 'EEEE, dd/MM/yyyy', { locale: vi }); }
  catch { return d; }
};
const fmtTime = (t: string | null | undefined) => (t ? t.slice(0, 5) : '');

const MyTeam = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  // Team state
  const [teams, setTeams] = useState<Team[]>([]);
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [teamsLoading, setTeamsLoading] = useState(true);

  // Members state
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [membersLoading, setMembersLoading] = useState(false);
  const [memberRefreshKey, setMemberRefreshKey] = useState(0);

  // Upcoming matches
  const [upcomingMatches, setUpcomingMatches] = useState<any[]>([]);
  const [upcomingLoading, setUpcomingLoading] = useState(false);

  // Tournaments
  const [teamTournaments, setTeamTournaments] = useState<any[]>([]);
  const [tournamentsLoading, setTournamentsLoading] = useState(false);

  // Dialogs
  const [teamFormOpen, setTeamFormOpen] = useState(false);
  const [editTeam, setEditTeam] = useState<Team | null>(null);
  const [memberFormOpen, setMemberFormOpen] = useState(false);
  const [editMember, setEditMember] = useState<TeamMember | null>(null);
  const [deleteTeamId, setDeleteTeamId] = useState<number | null>(null);
  const [deleteMemberId, setDeleteMemberId] = useState<number | null>(null);

  // Load teams
  const loadTeams = useCallback(async () => {
    setTeamsLoading(true);
    try {
      const data = await teamService.getAll();
      setTeams(data);
      // Nếu đang có team được chọn thì cập nhật lại
      if (selectedTeam) {
        const updated = data.find((t) => t.id === selectedTeam.id);
        setSelectedTeam(updated ?? data[0] ?? null);
      } else if (data.length > 0) {
        setSelectedTeam(data[0]);
      }
    } catch {
      toast({ title: 'Lỗi', description: 'Không thể tải danh sách đội bóng', variant: 'destructive' });
    } finally {
      setTeamsLoading(false);
    }
  }, [selectedTeam, toast]);

  // Load members of selected team
  const loadMembers = useCallback(async (teamId: number) => {
    setMembersLoading(true);
    try {
      const data = await teamService.getMembers(teamId);
      setMembers(Array.isArray(data) ? data : []);
    } catch {
      toast({ title: 'Lỗi', description: 'Không thể tải danh sách thành viên', variant: 'destructive' });
    } finally {
      setMembersLoading(false);
    }
  }, [toast]);

  const loadUpcomingMatches = useCallback(async (teamId: number) => {
    setUpcomingLoading(true);
    try {
      const data = await teamService.getUpcomingMatches(teamId);
      setUpcomingMatches(Array.isArray(data) ? data : []);
    } catch {
      setUpcomingMatches([]);
    } finally {
      setUpcomingLoading(false);
    }
  }, []);

  const loadTeamTournaments = useCallback(async (teamId: number) => {
    setTournamentsLoading(true);
    try {
      const data = await teamService.getTournaments(teamId);
      setTeamTournaments(Array.isArray(data) ? data : []);
    } catch {
      setTeamTournaments([]);
    } finally {
      setTournamentsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!user) { navigate('/auth'); return; }
    loadTeams();
  }, [user]);

  useEffect(() => {
    if (selectedTeam) {
      loadMembers(selectedTeam.id);
      loadUpcomingMatches(selectedTeam.id);
      loadTeamTournaments(selectedTeam.id);
    } else {
      setMembers([]);
      setUpcomingMatches([]);
      setTeamTournaments([]);
    }
  }, [selectedTeam, memberRefreshKey]);

  // ── Handlers đội bóng ──
  const handleOpenCreateTeam = () => { setEditTeam(null); setTeamFormOpen(true); };
  const handleOpenEditTeam = (team: Team) => { setEditTeam(team); setTeamFormOpen(true); };
  const handleTeamSuccess = async (team: Team) => {
    await loadTeams();
    setSelectedTeam(team);
  };

  const handleDeleteTeam = async () => {
    if (!deleteTeamId) return;
    try {
      await teamService.delete(deleteTeamId);
      toast({ title: 'Đã xóa', description: 'Đội bóng đã được xóa' });
      if (selectedTeam?.id === deleteTeamId) setSelectedTeam(null);
      await loadTeams();
    } catch (err: any) {
      toast({ title: 'Lỗi', description: err.response?.data?.message || 'Không thể xóa đội bóng', variant: 'destructive' });
    } finally {
      setDeleteTeamId(null);
    }
  };

  // ── Handlers thành viên ──
  const handleOpenAddMember = () => { setEditMember(null); setMemberFormOpen(true); };
  const handleOpenEditMember = (member: TeamMember) => { setEditMember(member); setMemberFormOpen(true); };
  const handleMemberSuccess = () => {
    setMemberRefreshKey((k) => k + 1);
  };

  const handleDeleteMember = async () => {
    if (!deleteMemberId || !selectedTeam) return;
    try {
      await teamService.deleteMember(selectedTeam.id, deleteMemberId);
      toast({ title: 'Đã xóa', description: 'Thành viên đã được xóa khỏi đội' });
      await loadMembers(selectedTeam.id);
    } catch (err: any) {
      toast({ title: 'Lỗi', description: err.response?.data?.message || 'Không thể xóa thành viên', variant: 'destructive' });
    } finally {
      setDeleteMemberId(null);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8 mt-20">
        <div className="mb-8">
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Shield className="w-8 h-8 text-primary" />
            Quản lý đội bóng
          </h1>
          <p className="text-muted-foreground mt-1">Tạo và quản lý đội bóng, thêm thành viên tham gia giải đấu</p>
        </div>

        {teamsLoading ? (
          <div className="flex items-center justify-center py-24">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* ── Sidebar: danh sách đội ── */}
            <div className="lg:col-span-1 space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">Đội của bạn</h2>
                <Button size="sm" variant="outline" className="gap-1" onClick={handleOpenCreateTeam}>
                  <Plus className="w-4 h-4" /> Tạo đội
                </Button>
              </div>

              {teams.length === 0 ? (
                <Card className="border-dashed">
                  <CardContent className="py-8 text-center space-y-3">
                    <ShieldAlert className="w-10 h-10 text-muted-foreground mx-auto" />
                    <p className="text-sm text-muted-foreground">Bạn chưa có đội bóng nào</p>
                    <Button size="sm" className="gap-2" onClick={handleOpenCreateTeam}>
                      <Plus className="w-4 h-4" /> Tạo đội bóng đầu tiên
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                teams.map((team) => (
                  <button
                    key={team.id}
                    onClick={() => setSelectedTeam(team)}
                    className={`w-full text-left rounded-lg border p-3 transition-all hover:border-primary ${selectedTeam?.id === team.id ? 'border-primary bg-primary/5 shadow-sm' : 'bg-card'
                      }`}
                  >
                    <div className="flex items-center gap-3">
                      {team.logo ? (
                        <img src={team.logo} alt={team.name} className="w-10 h-10 rounded-lg object-cover border" />
                      ) : (
                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                          <Shield className="w-5 h-5 text-primary" />
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="font-semibold text-sm truncate">{team.name}</p>
                        {team.short_name && (
                          <p className="text-xs text-muted-foreground">{team.short_name}</p>
                        )}
                      </div>
                    </div>
                  </button>
                ))
              )}
            </div>

            {/* ── Main: chi tiết + thành viên ── */}
            <div className="lg:col-span-3 space-y-6">
              {!selectedTeam ? (
                <Card className="border-dashed">
                  <CardContent className="py-20 text-center">
                    <Shield className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                    <p className="text-muted-foreground">Chọn đội bóng ở bên trái để xem chi tiết</p>
                  </CardContent>
                </Card>
              ) : (
                <>
                  {/* Thông tin đội */}
                  <Card>
                    <CardHeader>
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex items-center gap-4">
                          {selectedTeam.logo ? (
                            <img
                              src={selectedTeam.logo}
                              alt={selectedTeam.name}
                              className="w-16 h-16 rounded-xl object-cover border"
                            />
                          ) : (
                            <div className="w-16 h-16 rounded-xl bg-primary/10 flex items-center justify-center">
                              <Shield className="w-8 h-8 text-primary" />
                            </div>
                          )}
                          <div>
                            <CardTitle className="text-xl">{selectedTeam.name}</CardTitle>
                            {selectedTeam.short_name && (
                              <Badge variant="secondary" className="mt-1">{selectedTeam.short_name}</Badge>
                            )}
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline" className="gap-1" onClick={() => handleOpenEditTeam(selectedTeam)}>
                            <Pencil className="w-4 h-4" /> Sửa
                          </Button>
                          <Button size="sm" variant="destructive" className="gap-1" onClick={() => setDeleteTeamId(selectedTeam.id)}>
                            <Trash2 className="w-4 h-4" /> Xóa đội
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
                        {selectedTeam.captain && (
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <User className="w-4 h-4 shrink-0" />
                            <span>Đội trưởng: <span className="text-foreground font-medium">{selectedTeam.captain.name}</span></span>
                          </div>
                        )}
                        {selectedTeam.contact_phone && (
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Phone className="w-4 h-4 shrink-0" />
                            <span>{selectedTeam.contact_phone}</span>
                          </div>
                        )}
                        {selectedTeam.contact_email && (
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Mail className="w-4 h-4 shrink-0" />
                            <span className="truncate">{selectedTeam.contact_email}</span>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Tabs: Thành viên / Lịch thi đấu / Giải đấu */}
                  <Tabs defaultValue="members" className="space-y-4">
                    <TabsList className="grid w-full grid-cols-3">
                      <TabsTrigger value="members" className="gap-1.5">
                        <Users className="w-4 h-4" />
                        <span>Thành viên</span>
                        {members.length > 0 && (
                          <span className="text-xs bg-primary/20 px-1.5 rounded-full">{members.length}</span>
                        )}
                      </TabsTrigger>
                      <TabsTrigger value="upcoming" className="gap-1.5">
                        <Calendar className="w-4 h-4" />
                        <span>Lịch sắp tới</span>
                        {upcomingMatches.length > 0 && (
                          <span className="text-xs bg-primary/20 px-1.5 rounded-full">{upcomingMatches.length}</span>
                        )}
                      </TabsTrigger>
                      <TabsTrigger value="tournaments" className="gap-1.5">
                        <Trophy className="w-4 h-4" />
                        <span>Giải đấu</span>
                        {teamTournaments.length > 0 && (
                          <span className="text-xs bg-primary/20 px-1.5 rounded-full">{teamTournaments.length}</span>
                        )}
                      </TabsTrigger>
                    </TabsList>

                    {/* ── Tab: Thành viên ── */}
                    <TabsContent value="members">
                      <Card>
                        <CardHeader>
                          <div className="flex items-center justify-between">
                            <CardTitle className="flex items-center gap-2 text-base">
                              <Users className="w-5 h-5 text-primary" />
                              Thành viên
                              <Badge variant="secondary">{members.length}</Badge>
                            </CardTitle>
                            <Button size="sm" className="gap-1" onClick={handleOpenAddMember}>
                              <UserPlus className="w-4 h-4" /> Thêm cầu thủ
                            </Button>
                          </div>
                        </CardHeader>
                        <CardContent>
                          {membersLoading ? (
                            <div className="flex items-center justify-center py-10">
                              <Loader2 className="w-6 h-6 animate-spin text-primary" />
                            </div>
                          ) : members.length === 0 ? (
                            <div className="py-10 text-center space-y-3">
                              <Users className="w-10 h-10 text-muted-foreground mx-auto" />
                              <p className="text-muted-foreground text-sm">Đội chưa có thành viên nào</p>
                              <Button size="sm" variant="outline" className="gap-1" onClick={handleOpenAddMember}>
                                <UserPlus className="w-4 h-4" /> Thêm cầu thủ đầu tiên
                              </Button>
                            </div>
                          ) : (
                            <div className="space-y-2">
                              <div className="grid grid-cols-12 gap-2 text-xs text-muted-foreground font-medium uppercase tracking-wide px-3 pb-1 border-b">
                                <span className="col-span-1 text-center">#</span>
                                <span className="col-span-4">Tên cầu thủ</span>
                                <span className="col-span-3">Vị trí</span>
                                <span className="col-span-2">CMND</span>
                                <span className="col-span-2 text-right">Thao tác</span>
                              </div>
                              {members.map((member) => (
                                <div
                                  key={member.id}
                                  className="grid grid-cols-12 gap-2 items-center rounded-lg px-3 py-2.5 hover:bg-muted/50 transition-colors text-sm"
                                >
                                  <div className="col-span-1 text-center">
                                    {member.jersey_number ? (
                                      <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-primary/10 text-primary font-bold text-xs">
                                        {member.jersey_number}
                                      </span>
                                    ) : (
                                      <Hash className="w-4 h-4 text-muted-foreground mx-auto" />
                                    )}
                                  </div>
                                  <div className="col-span-4 font-medium truncate">{member.player_name}</div>
                                  <div className="col-span-3 text-muted-foreground truncate">
                                    {member.position || <span className="italic text-xs">Chưa có</span>}
                                  </div>
                                  <div className="col-span-2 text-muted-foreground text-xs truncate">
                                    {member.code_id || '—'}
                                  </div>
                                  <div className="col-span-2 flex justify-end gap-1">
                                    <Button
                                      size="icon"
                                      variant="ghost"
                                      className="h-7 w-7"
                                      onClick={() => handleOpenEditMember(member)}
                                    >
                                      <Pencil className="w-3.5 h-3.5" />
                                    </Button>
                                    <Button
                                      size="icon"
                                      variant="ghost"
                                      className="h-7 w-7 text-destructive hover:text-destructive"
                                      onClick={() => setDeleteMemberId(member.id)}
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </Button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    </TabsContent>

                    {/* ── Tab: Lịch sắp tới ── */}
                    <TabsContent value="upcoming">
                      {upcomingLoading ? (
                        <div className="flex justify-center py-12">
                          <Loader2 className="w-7 h-7 animate-spin text-primary" />
                        </div>
                      ) : upcomingMatches.length === 0 ? (
                        <Card>
                          <CardContent className="py-14 text-center space-y-2">
                            <Calendar className="w-10 h-10 text-muted-foreground mx-auto" />
                            <p className="text-muted-foreground text-sm">Không có trận đấu sắp tới</p>
                          </CardContent>
                        </Card>
                      ) : (
                        <div className="space-y-3">
                          {upcomingMatches.map((m: any) => {
                            const done = m.status === 'completed';
                            const live = m.status === 'in_progress';
                            const homeName = m.home_team?.name ?? m.home_from_position ?? 'TBD';
                            const awayName = m.away_team?.name ?? m.away_from_position ?? 'TBD';
                            const homeIsMyTeam = m.home_team_id === selectedTeam.id || m.home_team?.id === selectedTeam.id;
                            const awayIsMyTeam = m.away_team_id === selectedTeam.id || m.away_team?.id === selectedTeam.id;
                            return (
                              <Card key={m.id} className={`border-2 ${homeIsMyTeam || awayIsMyTeam ? 'border-primary/40' : ''}`}>
                                <CardContent className="pt-4 pb-3">
                                  {/* Meta */}
                                  <div className="flex items-center justify-between text-xs text-muted-foreground mb-3 gap-2 flex-wrap">
                                    <div className="flex items-center gap-3">
                                      {m.match_date && (
                                        <span className="flex items-center gap-1">
                                          <Calendar className="w-3 h-3" />
                                          {fmtMatchDate(m.match_date)}
                                        </span>
                                      )}
                                      {m.match_time && (
                                        <span className="flex items-center gap-1">
                                          <Clock className="w-3 h-3" />
                                          {fmtTime(m.match_time)}
                                        </span>
                                      )}
                                      {m.field?.name && (
                                        <span className="flex items-center gap-1">
                                          <MapPin className="w-3 h-3" />
                                          {m.field.name}
                                        </span>
                                      )}
                                    </div>
                                    {live && <Badge className="bg-green-500 text-xs animate-pulse">Đang đấu</Badge>}
                                    {!live && !done && <Badge variant="outline" className="text-xs">Sắp diễn ra</Badge>}
                                    {done && <Badge className="text-xs">Đã kết thúc</Badge>}
                                  </div>

                                  {/* Tournament name */}
                                  {m.tournament?.name && (
                                    <p className="text-xs font-medium text-primary mb-2 flex items-center gap-1">
                                      <Trophy className="w-3 h-3" />
                                      {m.tournament.name}
                                      {m.group?.name && <span className="text-muted-foreground"> • {m.group.name}</span>}
                                      {m.round?.name && <span className="text-muted-foreground"> • {m.round.name}</span>}
                                    </p>
                                  )}

                                  {/* Teams + score */}
                                  <div className="flex items-center gap-3">
                                    <div className={`flex items-center gap-2 flex-1 min-w-0 ${homeIsMyTeam ? 'font-bold' : ''}`}>
                                      <Avatar className="w-8 h-8 shrink-0">
                                        <AvatarImage src={m.home_team?.logo} />
                                        <AvatarFallback className="text-xs">
                                          {homeName.slice(0, 2).toUpperCase()}
                                        </AvatarFallback>
                                      </Avatar>
                                      <span className="truncate text-sm">{homeName}</span>
                                    </div>

                                    <div className="px-3 text-center shrink-0">
                                      {done || live ? (
                                        <span className="text-lg font-bold">
                                          {m.home_score ?? 0} – {m.away_score ?? 0}
                                        </span>
                                      ) : (
                                        <span className="text-xs font-semibold text-muted-foreground">vs</span>
                                      )}
                                    </div>

                                    <div className={`flex items-center gap-2 flex-1 min-w-0 justify-end ${awayIsMyTeam ? 'font-bold' : ''}`}>
                                      <span className="truncate text-sm text-right">{awayName}</span>
                                      <Avatar className="w-8 h-8 shrink-0">
                                        <AvatarImage src={m.away_team?.logo} />
                                        <AvatarFallback className="text-xs">
                                          {awayName.slice(0, 2).toUpperCase()}
                                        </AvatarFallback>
                                      </Avatar>
                                    </div>
                                  </div>
                                </CardContent>
                              </Card>
                            );
                          })}
                        </div>
                      )}
                    </TabsContent>

                    {/* ── Tab: Giải đấu ── */}
                    <TabsContent value="tournaments">
                      {tournamentsLoading ? (
                        <div className="flex justify-center py-12">
                          <Loader2 className="w-7 h-7 animate-spin text-primary" />
                        </div>
                      ) : teamTournaments.length === 0 ? (
                        <Card>
                          <CardContent className="py-14 text-center space-y-2">
                            <Trophy className="w-10 h-10 text-muted-foreground mx-auto" />
                            <p className="text-muted-foreground text-sm">Đội chưa tham gia giải đấu nào</p>
                            <Link to="/tournaments">
                              <Button size="sm" variant="outline" className="gap-1 mt-2">
                                <Trophy className="w-4 h-4" /> Xem danh sách giải đấu
                              </Button>
                            </Link>
                          </CardContent>
                        </Card>
                      ) : (
                        <div className="space-y-3">
                          {teamTournaments.map((t: any) => {
                            const statusColors: Record<string, string> = {
                              draft: 'bg-gray-100 text-gray-600',
                              open: 'bg-blue-100 text-blue-700',
                              in_progress: 'bg-green-100 text-green-700',
                              completed: 'bg-purple-100 text-purple-700',
                              cancelled: 'bg-red-100 text-red-600',
                            };
                            const statusLabels: Record<string, string> = {
                              draft: 'Nháp',
                              open: 'Mở đăng ký',
                              in_progress: 'Đang diễn ra',
                              completed: 'Đã kết thúc',
                              cancelled: 'Đã hủy',
                            };
                            const regStatusColors: Record<string, string> = {
                              pending: 'border-yellow-300 bg-yellow-50 text-yellow-700',
                              approved: 'border-green-300 bg-green-50 text-green-700',
                              rejected: 'border-red-300 bg-red-50 text-red-600',
                            };
                            const regStatus = t.registration_status ?? 'pending';
                            return (
                              <Link key={t.id} to={`/tournament/${t.id}`} className="block">
                                <Card className="hover:shadow-md transition-shadow hover:border-primary/40 cursor-pointer">
                                  <CardContent className="pt-4 pb-3">
                                    <div className="flex items-start justify-between gap-3">
                                      <div className="flex items-start gap-3 flex-1 min-w-0">
                                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                                          <Trophy className="w-5 h-5 text-primary" />
                                        </div>
                                        <div className="min-w-0">
                                          <p className="font-semibold truncate">{t.name}</p>
                                          <div className="flex flex-wrap items-center gap-1.5 mt-1">
                                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColors[t.status] ?? 'bg-gray-100 text-gray-600'}`}>
                                              {statusLabels[t.status] ?? t.status}
                                            </span>
                                            <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${regStatusColors[regStatus] ?? ''}`}>
                                              {regStatus === 'approved' ? '✓ Đã duyệt' : regStatus === 'rejected' ? '✗ Bị từ chối' : '⏳ Chờ duyệt'}
                                            </span>
                                          </div>
                                          {t.start_date && (
                                            <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                                              <Calendar className="w-3 h-3" />
                                              {t.start_date?.slice(0, 10)} – {t.end_date?.slice(0, 10)}
                                            </p>
                                          )}
                                        </div>
                                      </div>
                                      <ChevronRight className="w-5 h-5 text-muted-foreground shrink-0 mt-0.5" />
                                    </div>
                                  </CardContent>
                                </Card>
                              </Link>
                            );
                          })}
                        </div>
                      )}
                    </TabsContent>
                  </Tabs>
                </>
              )}
            </div>
          </div>
        )}
      </main>
      <Footer />

      {/* Team Form Dialog */}
      <TeamFormDialog
        open={teamFormOpen}
        onOpenChange={setTeamFormOpen}
        team={editTeam}
        onSuccess={handleTeamSuccess}
      />

      {/* Member Form Dialog */}
      {selectedTeam && (
        <TeamMemberDialog
          open={memberFormOpen}
          onOpenChange={setMemberFormOpen}
          teamId={selectedTeam.id}
          member={editMember}
          onSuccess={handleMemberSuccess}
        />
      )}

      {/* Confirm delete team */}
      <AlertDialog open={!!deleteTeamId} onOpenChange={(o) => !o && setDeleteTeamId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xóa đội bóng?</AlertDialogTitle>
            <AlertDialogDescription>
              Hành động này không thể hoàn tác. Toàn bộ thành viên trong đội cũng sẽ bị xóa.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteTeam} className="bg-destructive hover:bg-destructive/90">
              Xóa đội bóng
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Confirm delete member */}
      <AlertDialog open={!!deleteMemberId} onOpenChange={(o) => !o && setDeleteMemberId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xóa thành viên?</AlertDialogTitle>
            <AlertDialogDescription>
              Thành viên này sẽ bị xóa khỏi đội bóng.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteMember} className="bg-destructive hover:bg-destructive/90">
              Xóa thành viên
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default MyTeam;
