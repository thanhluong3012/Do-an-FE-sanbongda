import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
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
} from 'lucide-react';

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

  useEffect(() => {
    if (!user) { navigate('/auth'); return; }
    loadTeams();
  }, [user]);

  useEffect(() => {
    if (selectedTeam) loadMembers(selectedTeam.id);
    else setMembers([]);
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
                    className={`w-full text-left rounded-lg border p-3 transition-all hover:border-primary ${
                      selectedTeam?.id === team.id ? 'border-primary bg-primary/5 shadow-sm' : 'bg-card'
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

                  {/* Danh sách thành viên */}
                  <Card>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="flex items-center gap-2">
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
                          {/* Header */}
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
