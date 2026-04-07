import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Calendar,
  Clock,
  Wand2,
  Trash2,
  Loader2,
  AlertCircle,
  Users,
  CheckCircle2,
  MapPin,
  Globe,
} from 'lucide-react';
import { format as formatDate } from 'date-fns';
import { vi } from 'date-fns/locale';
import { Match } from '@/services/matchService';
import { TournamentRegistration } from '@/services/registrationService';
import { BracketSkeleton } from './BracketSkeleton';

interface TeamInfo {
  id: number;
  name: string;
  logo?: string;
}

interface ScheduleBuilderProps {
  tournamentId: number;
  format: 'round_robin' | 'knockout' | 'group_knockout';
  maxTeams: number;
  registrations: TournamentRegistration[];
  teams: TeamInfo[]; // Teams from bracket API
  matches: Match[];
  onGenerateSchedule: () => Promise<void>;
  onDeleteSchedule: () => Promise<void>;
  onPublishSchedule: () => Promise<void>;
  onUnpublishSchedule: () => Promise<void>;
  onAssignTeam: (matchId: number, data: { home_team_id?: number; away_team_id?: number }) => Promise<void>;
  onUpdateMatch: (matchId: number, data: { match_date?: string; match_time?: string; field_id?: number }) => Promise<void>;
  isGenerating: boolean;
  isDeleting: boolean;
  isPublishing: boolean;
  isUnpublishing: boolean;
  schedulePublished: boolean;
}

export const ScheduleBuilder = ({
  tournamentId,
  format,
  maxTeams,
  registrations,
  teams,
  matches,
  onGenerateSchedule,
  onDeleteSchedule,
  onPublishSchedule,
  onUnpublishSchedule,
  onAssignTeam,
  onUpdateMatch,
  isGenerating,
  isDeleting,
  isPublishing,
  isUnpublishing,
  schedulePublished,
}: ScheduleBuilderProps) => {
  const [draggedTeam, setDraggedTeam] = useState<number | null>(null);
  const [editingMatch, setEditingMatch] = useState<number | null>(null);
  const [editTime, setEditTime] = useState('');
  const [dropTarget, setDropTarget] = useState<string | null>(null); // format: "matchId-position"

  // Ưu tiên dùng teams từ bracket API, fallback sang registrations
  const approvedTeams = teams.length > 0 
    ? teams 
    : registrations.filter((r) => r.status === 'approved').map(r => ({
        id: r.team_id,
        name: r.team?.name || 'Team',
        logo: r.team?.logo,
      }));

  const handleDragStart = (e: React.DragEvent, teamId: number) => {
    console.log('🎯 Drag started:', teamId);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', teamId.toString());
    setDraggedTeam(teamId);
    // Add dragging effect
    if (e.currentTarget instanceof HTMLElement) {
      e.currentTarget.style.opacity = '0.5';
    }
  };

  const handleDragEnd = (e: React.DragEvent) => {
    console.log('✅ Drag ended');
    e.dataTransfer.clearData();
    setDraggedTeam(null);
    setDropTarget(null);
    // Reset opacity
    if (e.currentTarget instanceof HTMLElement) {
      e.currentTarget.style.opacity = '1';
    }
  };

  const handleDrop = async (e: React.DragEvent, matchId: number, position: 'home' | 'away') => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!draggedTeam) {
      console.warn('⚠️ No dragged team');
      return;
    }

    console.log(`🏀 Dropping team ${draggedTeam} to match ${matchId} as ${position}`);

    // Kiểm tra không cho kéo cùng đội vào cả 2 vị trí
    const match = matches.find((m) => m.id === matchId);
    if (match) {
      const otherTeamId = position === 'home' ? match.away_team_id : match.home_team_id;
      if (otherTeamId === draggedTeam) {
        console.warn('⚠️ Cannot assign same team to both positions');
        setDraggedTeam(null);
        setDropTarget(null);
        return;
      }
    }

    const data = position === 'home' ? { home_team_id: draggedTeam } : { away_team_id: draggedTeam };
    
    try {
      await onAssignTeam(matchId, data);
      console.log('✅ Team assigned successfully');
    } catch (error) {
      console.error('❌ Failed to assign team:', error);
    }
    
    setDraggedTeam(null);
    setDropTarget(null);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDragEnter = (e: React.DragEvent, matchId: number, position: 'home' | 'away') => {
    e.preventDefault();
    console.log(`🎯 Drag enter: match ${matchId}, position ${position}`);
    setDropTarget(`${matchId}-${position}`);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDropTarget(null);
  };

  const formatMatchTime = (match: Match) => {
    if (!match.match_date || !match.match_time) {
      return 'Chưa xếp lịch';
    }
    try {
      // Extract date part only (backend may return full ISO timestamp)
      let dateOnly: string;
      if (match.match_date.includes('T')) {
        // If match_date is ISO format like '2026-03-29T00:00:00.000000Z'
        dateOnly = match.match_date.split('T')[0];
      } else {
        // If match_date is already 'YYYY-MM-DD'
        dateOnly = match.match_date;
      }
      
      // Extract time part (HH:MM or HH:MM:SS)
      const timeOnly = match.match_time.substring(0, 5); // Get HH:MM only
      
      // Combine and parse
      const dateTimeString = `${dateOnly}T${timeOnly}`;
      const date = new Date(dateTimeString);
      
      return formatDate(date, 'dd/MM/yyyy • HH:mm', { locale: vi });
    } catch (error) {
      console.error('Error formatting match time:', error, match);
      return 'Lỗi định dạng';
    }
  };

  // Group matches by round or group
  const groupedMatches = () => {
    const groups: Record<string, Match[]> = {};
    
    matches.forEach((match) => {
      let key = 'Tất cả các trận';
      
      if (match.round?.name) {
        key = match.round.name;
      } else if (match.group?.name) {
        key = match.group.name;
      }
      
      if (!groups[key]) {
        groups[key] = [];
      }
      groups[key].push(match);
    });
    
    return groups;
  };

  const matchGroups = groupedMatches();

  // Render a single match card
  const renderMatchCard = (match: Match) => (
    <Card key={match.id} className="border-2 hover:shadow-md transition-shadow">
      <CardContent className="pt-5">
        <div className="grid grid-cols-3 gap-3 items-center">
          {/* Home Team - Droppable */}
          <div
            onDragOver={handleDragOver}
            onDragEnter={(e) => handleDragEnter(e, match.id, 'home')}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, match.id, 'home')}
            className={`p-3 rounded-lg border-2 transition-all min-h-[80px] flex items-center justify-center ${
              dropTarget === `${match.id}-home`
                ? 'border-primary bg-primary/20 scale-105 ring-2 ring-primary ring-offset-2'
                : !match.home_team
                ? 'border-dashed bg-muted/50 border-muted-foreground/30 hover:border-primary/50 hover:bg-primary/5'
                : 'border-transparent bg-card shadow-sm'
            }`}
          >
            {match.home_team ? (
              <div className="flex flex-col items-center gap-2 text-center w-full pointer-events-none">
                {match.home_team.logo ? (
                  <img
                    src={match.home_team.logo}
                    alt={match.home_team.name}
                    className="w-10 h-10 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                    <Users className="w-5 h-5 text-blue-600" />
                  </div>
                )}
                <p className="font-semibold text-sm truncate w-full px-1">{match.home_team.name}</p>
                {match.home_score !== undefined && (
                  <span className="text-xl font-bold">{match.home_score}</span>
                )}
              </div>
            ) : (
              <div className="text-center py-2 pointer-events-none">
                <p className="text-xs text-muted-foreground">Đội A</p>
              </div>
            )}
          </div>

          {/* VS */}
          <div className="text-center">
            <Badge variant="outline" className="text-xs font-bold">VS</Badge>
          </div>

          {/* Away Team - Droppable */}
          <div
            onDragOver={handleDragOver}
            onDragEnter={(e) => handleDragEnter(e, match.id, 'away')}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, match.id, 'away')}
            className={`p-3 rounded-lg border-2 transition-all min-h-[80px] flex items-center justify-center ${
              dropTarget === `${match.id}-away`
                ? 'border-primary bg-primary/20 scale-105 ring-2 ring-primary ring-offset-2'
                : !match.away_team
                ? 'border-dashed bg-muted/50 border-muted-foreground/30 hover:border-primary/50 hover:bg-primary/5'
                : 'border-transparent bg-card shadow-sm'
            }`}
          >
            {match.away_team ? (
              <div className="flex flex-col items-center gap-2 text-center w-full pointer-events-none">
                {match.away_team.logo ? (
                  <img
                    src={match.away_team.logo}
                    alt={match.away_team.name}
                    className="w-10 h-10 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                    <Users className="w-5 h-5 text-red-600" />
                  </div>
                )}
                <p className="font-semibold text-sm truncate w-full px-1">{match.away_team.name}</p>
                {match.away_score !== undefined && (
                  <span className="text-xl font-bold">{match.away_score}</span>
                )}
              </div>
            ) : (
              <div className="text-center py-2 pointer-events-none">
                <p className="text-xs text-muted-foreground">Đội B</p>
              </div>
            )}
          </div>
        </div>

        {/* Match Info */}
        <div className="mt-3 flex items-center justify-center gap-2 text-xs text-muted-foreground">
          <Calendar className="w-3 h-3" />
          {editingMatch === match.id ? (
            <div className="flex items-center gap-2">
              <Input
                type="datetime-local"
                value={editTime}
                onChange={(e) => setEditTime(e.target.value)}
                className="h-7 text-xs"
              />
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleSaveTime(match.id)}
                className="h-7 px-2 text-xs"
              >
                Lưu
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  setEditingMatch(null);
                  setEditTime('');
                }}
                className="h-7 px-2 text-xs"
              >
                Hủy
              </Button>
            </div>
          ) : (
            <button
              onClick={() => handleEditTime(match)}
              className="hover:text-foreground transition-colors"
            >
              {formatMatchTime(match)}
            </button>
          )}
        </div>
        {match.field && (
          <div className="mt-1 flex items-center justify-center gap-2 text-xs text-muted-foreground">
            <MapPin className="w-3 h-3" />
            <span>{match.field.name}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );

  const handleEditTime = (match: Match) => {
    setEditingMatch(match.id);
    if (match.match_date && match.match_time) {
      // Extract date part only
      let dateOnly: string;
      if (match.match_date.includes('T')) {
        dateOnly = match.match_date.split('T')[0];
      } else {
        dateOnly = match.match_date;
      }
      
      // Extract time part (HH:MM)
      const timeOnly = match.match_time.substring(0, 5);
      
      // Combine for datetime-local input format
      setEditTime(`${dateOnly}T${timeOnly}`);
    }
  };

  const handleSaveTime = async (matchId: number) => {
    if (editTime) {
      // Split datetime-local format back to date and time
      const [match_date, match_time] = editTime.split('T');
      await onUpdateMatch(matchId, { match_date, match_time });
      setEditingMatch(null);
      setEditTime('');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Actions */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Users className="w-5 h-5 text-primary" />
          <h3 className="text-lg font-semibold">
            {approvedTeams.length} đội đã xác nhận
          </h3>
          {schedulePublished && (
            <Badge variant="default" className="ml-2 bg-green-600">
              <Globe className="w-3 h-3 mr-1" />
              Đã công khai
            </Badge>
          )}
        </div>

        <div className="flex flex-wrap gap-2">
          {matches.length > 0 && (
            <>
              {schedulePublished ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onUnpublishSchedule}
                  disabled={isUnpublishing}
                  className="gap-2 border-orange-600 text-orange-600 hover:bg-orange-50"
                >
                  {isUnpublishing ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Globe className="w-4 h-4" />
                  )}
                  Ẩn lịch đấu
                </Button>
              ) : (
                <Button
                  variant="default"
                  size="sm"
                  onClick={onPublishSchedule}
                  disabled={isPublishing}
                  className="gap-2 bg-green-600 hover:bg-green-700"
                >
                  {isPublishing ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Globe className="w-4 h-4" />
                  )}
                  Công khai lịch đấu
                </Button>
              )}
              <Button
                variant="destructive"
                size="sm"
                onClick={onDeleteSchedule}
                disabled={isDeleting}
                className="gap-2"
              >
                {isDeleting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Trash2 className="w-4 h-4" />
                )}
                Xóa lịch
              </Button>
            </>
          )}
          <Button
            onClick={onGenerateSchedule}
            disabled={isGenerating || approvedTeams.length < 2}
            className="gap-2"
          >
            {isGenerating ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Wand2 className="w-4 h-4" />
            )}
            Tự động sinh lịch
          </Button>
        </div>
      </div>

      {/* Info Banner */}
      {approvedTeams.length < 2 && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardContent className="pt-5">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5 shrink-0" />
              <div>
                <p className="font-medium text-yellow-800">
                  Cần ít nhất 2 đội để tạo lịch thi đấu
                </p>
                <p className="text-sm text-yellow-700 mt-1">
                  Hiện có {approvedTeams.length} đội đã được duyệt.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {!schedulePublished && matches.length > 0 && (
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="pt-5">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5 shrink-0" />
              <div>
                <p className="font-medium text-blue-800">
                  Lịch thi đấu chưa được công khai
                </p>
                <p className="text-sm text-blue-700 mt-1">
                  Chỉ có bạn (ban tổ chức) mới có thể xem và chỉnh sửa lịch. Nhấn nút "Công khai lịch đấu" để người dùng có thể xem.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {schedulePublished && matches.length > 0 && (
        <Card className="border-green-200 bg-green-50">
          <CardContent className="pt-5">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5 shrink-0" />
              <div>
                <p className="font-medium text-green-800">
                  Lịch thi đấu đã được công khai
                </p>
                <p className="text-sm text-green-700 mt-1">
                  Người dùng có thể xem lịch thi đấu công khai. Nhấn "Ẩn lịch đấu" nếu muốn chỉnh sửa và ẩn khỏi công khai.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Danh sách đội - Draggable */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Users className="w-4 h-4" />
              Danh sách đội
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {approvedTeams.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                Chưa có đội nào được duyệt
              </p>
            ) : (
              approvedTeams.map((team) => (
                <div
                  key={team.id}
                  draggable={true}
                  onDragStart={(e) => handleDragStart(e, team.id)}
                  onDragEnd={handleDragEnd}
                  className={`flex items-center gap-3 p-3 rounded-lg border bg-card hover:bg-accent cursor-move transition-colors select-none ${
                    draggedTeam === team.id ? 'opacity-50 scale-95' : ''
                  }`}
                  style={{ cursor: 'grab', userSelect: 'none' }}
                  onMouseDown={(e) => { e.currentTarget.style.cursor = 'grabbing'; }}
                  onMouseUp={(e) => { e.currentTarget.style.cursor = 'grab'; }}
                >
                  {team.logo ? (
                    <img
                      src={team.logo}
                      alt={team.name}
                      className="w-8 h-8 rounded-full object-cover pointer-events-none"
                      draggable={false}
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center pointer-events-none">
                      <Users className="w-4 h-4 text-primary" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{team.name}</p>
                  </div>
                  <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0" />
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Lịch thi đấu - Droppable */}
        <div className="lg:col-span-3 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Lịch thi đấu ({matches.length} trận)
              </CardTitle>
            </CardHeader>
            <CardContent>
              {matches.length === 0 ? (
                <BracketSkeleton 
                  format={format}
                  teamCount={approvedTeams.length}
                  maxTeams={maxTeams}
                />
              ) : (
                <div className="space-y-6">
                  {Object.entries(matchGroups).map(([groupName, groupMatches]) => (
                    <div key={groupName} className="space-y-3">
                      {/* Group/Round Header */}
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="font-semibold">
                          {groupName}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {groupMatches.length} trận
                        </span>
                      </div>
                      
                      {/* Matches Grid */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {groupMatches.map((match) => renderMatchCard(match))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};
