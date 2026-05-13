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
import { TournamentBracketView } from '@/components/Tournament/TournamentBracketView';

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
  onScoreUpdated?: () => void;
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
  onScoreUpdated,
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

      {/* Empty State - Hiển thị khi chưa có lịch */}
      {matches.length === 0 && approvedTeams.length >= 2 && (
        <div className="space-y-6">
          {/* Thông tin thể thức giải đấu */}
          <Card className="border-primary/30 bg-gradient-to-r from-primary/5 to-primary/10">
            <CardContent className="pt-5">
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-lg bg-primary/20 flex items-center justify-center">
                    {format === 'round_robin' && <span className="text-2xl">🔄</span>}
                    {format === 'knockout' && <span className="text-2xl">🏆</span>}
                    {format === 'group_knockout' && <span className="text-2xl">📊</span>}
                  </div>
                  <div>
                    <h3 className="font-bold text-lg">
                      {format === 'round_robin' && 'Vòng tròn (Round Robin)'}
                      {format === 'knockout' && 'Loại trực tiếp (Knockout)'}
                      {format === 'group_knockout' && 'Vòng bảng + Loại trực tiếp'}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Thể thức giải đấu của bạn • {approvedTeams.length} đội tham gia
                    </p>
                  </div>
                </div>
                <Badge variant="default" className="bg-primary text-lg px-4 py-1.5">
                  {format === 'round_robin' && '🔄 Vòng tròn'}
                  {format === 'knockout' && '🏆 Knockout'}
                  {format === 'group_knockout' && '📊 Bảng + KO'}
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Danh sách đội tham gia */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                Danh sách đội tham gia ({approvedTeams.length} đội)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th className="text-left p-3 font-semibold">STT</th>
                      <th className="text-left p-3 font-semibold">Tên đội</th>
                      <th className="text-center p-3 font-semibold">Logo</th>
                      <th className="text-center p-3 font-semibold">Trạng thái</th>
                    </tr>
                  </thead>
                  <tbody>
                    {approvedTeams.map((team, index) => (
                      <tr key={team.id} className="border-b hover:bg-muted/30 transition-colors">
                        <td className="p-3 font-medium">{index + 1}</td>
                        <td className="p-3">
                          <span className="font-semibold">{team.name}</span>
                        </td>
                        <td className="p-3">
                          <div className="flex justify-center">
                            {team.logo ? (
                              <img
                                src={team.logo}
                                alt={team.name}
                                className="w-10 h-10 rounded-full object-cover border-2 border-primary/20"
                              />
                            ) : (
                              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                                <Users className="w-5 h-5 text-primary" />
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="p-3">
                          <div className="flex justify-center">
                            <Badge variant="default" className="bg-green-600">
                              <CheckCircle2 className="w-3 h-3 mr-1" />
                              Đã duyệt
                            </Badge>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* Hướng dẫn chức năng tự động sinh lịch */}
          <Card className="border-primary/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Wand2 className="w-5 h-5 text-primary" />
                Thể thức thi đấu và cơ chế sinh lịch tự động
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                Hệ thống sẽ tự động tạo lịch thi đấu theo thể thức <strong className="text-foreground">{
                  format === 'round_robin' ? 'Vòng tròn' :
                    format === 'knockout' ? 'Loại trực tiếp' :
                      'Vòng bảng + Loại trực tiếp'
                }</strong> với {approvedTeams.length} đội đã được duyệt:
              </p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className={`p-4 rounded-lg border-2 transition-all ${format === 'round_robin'
                  ? 'border-primary bg-primary/10 shadow-md ring-2 ring-primary/20'
                  : 'border-border bg-card'
                  }`}>
                  <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center mb-2">
                    <span className="text-xl">🔄</span>
                  </div>
                  <h4 className="font-semibold mb-1 flex items-center gap-2">
                    Vòng tròn (Round Robin)
                    {format === 'round_robin' && (
                      <Badge variant="default" className="text-xs">Đang dùng</Badge>
                    )}
                  </h4>
                  <p className="text-sm text-muted-foreground mb-2">
                    Đấu 1 bảng tính điểm. Mỗi đội đấu với tất cả các đội khác đúng 1 lần.
                  </p>
                  <ul className="text-xs text-muted-foreground space-y-1">
                    <li>• Đội thắng: +3 điểm</li>
                    <li>• Hòa: +1 điểm mỗi đội</li>
                    <li>• Đội có điểm cao nhất vô địch</li>
                  </ul>
                </div>

                <div className={`p-4 rounded-lg border-2 transition-all ${format === 'knockout'
                  ? 'border-primary bg-primary/10 shadow-md ring-2 ring-primary/20'
                  : 'border-border bg-card'
                  }`}>
                  <div className="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center mb-2">
                    <span className="text-xl">🏆</span>
                  </div>
                  <h4 className="font-semibold mb-1 flex items-center gap-2">
                    Loại trực tiếp (Knockout)
                    {format === 'knockout' && (
                      <Badge variant="default" className="text-xs">Đang dùng</Badge>
                    )}
                  </h4>
                  <p className="text-sm text-muted-foreground mb-2">
                    Chia cặp ngẫu nhiên, thua 1 trận là bị loại. Thắng thì vào vòng sau.
                  </p>
                  <ul className="text-xs text-muted-foreground space-y-1">
                    <li>• Nếu lẻ đội: 1 đội được vào vòng trong (bye)</li>
                    <li>• Vòng 1/8, 1/4, Bán kết, Chung kết</li>
                    <li>• Không có bảng xếp hạng</li>
                  </ul>
                </div>

                <div className={`p-4 rounded-lg border-2 transition-all ${format === 'group_knockout'
                  ? 'border-primary bg-primary/10 shadow-md ring-2 ring-primary/20'
                  : 'border-border bg-card'
                  }`}>
                  <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center mb-2">
                    <span className="text-xl">📊</span>
                  </div>
                  <h4 className="font-semibold mb-1 flex items-center gap-2">
                    Bảng + Knockout
                    {format === 'group_knockout' && (
                      <Badge variant="default" className="text-xs">Đang dùng</Badge>
                    )}
                  </h4>
                  <p className="text-sm text-muted-foreground mb-2">
                    Chia thành nhiều bảng, đấu vòng tròn trong bảng. Top 2 mỗi bảng vào knockout.
                  </p>
                  <ul className="text-xs text-muted-foreground space-y-1">
                    <li>• Vòng bảng: như Round Robin</li>
                    <li>• 2 đội đầu mỗi bảng vào knockout</li>
                    <li>• Knockout: như thể thức loại trực tiếp</li>
                  </ul>
                </div>
              </div>

              <div className="p-4 rounded-lg bg-primary/5 border border-primary/20">
                <h4 className="font-semibold mb-2 flex items-center gap-2">
                  <span className="text-primary">✨</span>
                  Tính năng thông minh khi sinh lịch:
                </h4>
                <ul className="space-y-1.5 text-sm text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-0.5">•</span>
                    Tự động phân bổ trận đấu vào các sân đã đặt (booking)
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-0.5">•</span>
                    Tránh đụng độ thời gian giữa các trận
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-0.5">•</span>
                    Phân bổ đều thời gian nghỉ giữa các trận của mỗi đội
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-0.5">•</span>
                    {format === 'round_robin' && 'Tạo bảng xếp hạng tự động tính điểm theo kết quả'}
                    {format === 'knockout' && 'Tự động ghép cặp cho vòng sau dựa trên kết quả'}
                    {format === 'group_knockout' && 'Tạo bảng xếp hạng cho vòng bảng, tự động ghép knockout'}
                  </li>
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* Quy trình tổ chức giải */}
          <Card className="border-green-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-green-600" />
                Quy trình tổ chức giải đấu
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  {
                    step: 1,
                    title: 'Duyệt đội tham gia',
                    description: 'Xem và duyệt các đội đăng ký tham gia giải (tab "Danh sách đội đăng ký")',
                    status: 'completed',
                    icon: '✅',
                  },
                  {
                    step: 2,
                    title: 'Sinh lịch thi đấu',
                    description: 'Nhấn nút "Tự động sinh lịch" - hệ thống sẽ tạo lịch dựa trên thể thức và sân đã đặt',
                    status: 'current',
                    icon: '🎯',
                  },
                  {
                    step: 3,
                    title: 'Kiểm tra và điều chỉnh',
                    description: 'Xem lại lịch thi đấu, có thể chỉnh sửa thời gian, sân thi đấu nếu cần',
                    status: 'pending',
                    icon: '⏳',
                  },
                  {
                    step: 4,
                    title: 'Công khai lịch đấu',
                    description: 'Nhấn "Công khai lịch đấu" để các đội và người xem có thể theo dõi',
                    status: 'pending',
                    icon: '🌐',
                  },
                  {
                    step: 5,
                    title: 'Cập nhật kết quả',
                    description: 'Sau mỗi trận, cập nhật tỷ số để bảng xếp hạng tự động tính',
                    status: 'pending',
                    icon: '⚽',
                  },
                ].map((item) => (
                  <div
                    key={item.step}
                    className={`flex gap-4 p-4 rounded-lg border-2 transition-all ${item.status === 'completed'
                      ? 'bg-green-50 border-green-200'
                      : item.status === 'current'
                        ? 'bg-primary/5 border-primary shadow-sm'
                        : 'bg-muted/30 border-muted'
                      }`}
                  >
                    <div className="flex-shrink-0">
                      <div
                        className={`w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold ${item.status === 'completed'
                          ? 'bg-green-600 text-white'
                          : item.status === 'current'
                            ? 'bg-primary text-white'
                            : 'bg-muted text-muted-foreground'
                          }`}
                      >
                        {item.icon}
                      </div>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-semibold">
                          Bước {item.step}: {item.title}
                        </h4>
                        {item.status === 'completed' && (
                          <Badge variant="default" className="bg-green-600">Hoàn thành</Badge>
                        )}
                        {item.status === 'current' && (
                          <Badge variant="default">Đang thực hiện</Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">{item.description}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-6 p-4 rounded-lg bg-yellow-50 border border-yellow-200">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5 shrink-0" />
                  <div className="text-sm">
                    <p className="font-semibold text-yellow-800 mb-1">Lưu ý quan trọng:</p>
                    <ul className="space-y-1 text-yellow-700">
                      <li>• Đảm bảo đã đặt đủ sân cho tất cả các trận đấu</li>
                      <li>• Kiểm tra kỹ thời gian trước khi công khai lịch</li>
                      <li>• Sau khi công khai, các đội sẽ nhận thông báo qua email</li>
                    </ul>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}


      {/* Tournament Bracket View - Hiển thị sau khi sinh lịch thành công */}
      {matches.length > 0 && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Globe className="w-5 h-5" />
              Xem lịch thi đấu (Chế độ xem công khai)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <TournamentBracketView
              tournamentId={tournamentId}
              format={format}
              canManage={true}
              onScoreUpdated={onScoreUpdated}
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
};
