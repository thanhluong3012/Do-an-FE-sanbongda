import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Users, Calendar, Swords, Info } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface BracketSkeletonProps {
  format: 'round_robin' | 'knockout' | 'group_knockout';
  teamCount: number;
  maxTeams: number;
}

export const BracketSkeleton = ({ format, teamCount, maxTeams }: BracketSkeletonProps) => {
  // Tính số trận dựa vào format
  const calculateMatches = () => {
    if (format === 'round_robin') {
      // Vòng tròn: n(n-1)/2 trận
      return teamCount >= 2 ? (teamCount * (teamCount - 1)) / 2 : 0;
    } else if (format === 'knockout') {
      // Knockout: 2^n teams → n-1 trận
      const nearestPowerOf2 = Math.pow(2, Math.ceil(Math.log2(Math.max(teamCount, 2))));
      return nearestPowerOf2 - 1;
    } else {
      // Group + Knockout: ước lượng
      const groupMatches = Math.max(1, Math.floor(teamCount / 2)) * 3;
      const knockoutMatches = Math.max(1, Math.ceil(teamCount / 2)) - 1;
      return groupMatches + knockoutMatches;
    }
  };

  const totalMatches = calculateMatches();

  // Render Knockout tree structure
  const renderKnockoutTree = () => {
    const rounds = [
      { name: 'Vòng 1/8', matches: 8 },
      { name: 'Tứ kết', matches: 4 },
      { name: 'Bán kết', matches: 2 },
      { name: 'Chung kết', matches: 1 },
    ];

    // Tính số vòng cần thiết dựa vào số đội
    const neededRounds = Math.ceil(Math.log2(teamCount));
    const activeRounds = rounds.slice(-neededRounds);

    return (
      <div className="space-y-6">
        {activeRounds.map((round, roundIdx) => (
          <div key={roundIdx} className="space-y-3">
            <div className="flex items-center gap-2 mb-3">
              <Badge variant="secondary" className="font-semibold">
                {round.name}
              </Badge>
              <span className="text-xs text-muted-foreground">
                {round.matches} trận
              </span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {Array.from({ length: round.matches }).map((_, matchIdx) => (
                <Card key={matchIdx} className="border-2 border-dashed border-muted">
                  <CardContent className="pt-5">
                    <div className="grid grid-cols-3 gap-3 items-center">
                      <div className="p-3 rounded-lg bg-muted/50 border-2 border-dashed text-center min-h-[60px] flex items-center justify-center">
                        <span className="text-xs text-muted-foreground">Đội A</span>
                      </div>
                      <div className="text-center">
                        <Badge variant="outline" className="text-xs">VS</Badge>
                      </div>
                      <div className="p-3 rounded-lg bg-muted/50 border-2 border-dashed text-center min-h-[60px] flex items-center justify-center">
                        <span className="text-xs text-muted-foreground">Đội B</span>
                      </div>
                    </div>
                    <div className="mt-3 flex items-center justify-center gap-2 text-xs text-muted-foreground">
                      <Calendar className="w-3 h-3" />
                      <span>Chưa xếp lịch</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  };

  // Render Round Robin structure
  const renderRoundRobin = () => {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2 mb-4">
          <Badge variant="secondary" className="font-semibold">
            Vòng đấu duy nhất
          </Badge>
          <span className="text-xs text-muted-foreground">
            Tất cả {totalMatches} trận
          </span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {Array.from({ length: totalMatches }).map((_, idx) => (
            <Card key={idx} className="border-2 border-dashed border-muted">
              <CardContent className="pt-5">
                <div className="grid grid-cols-3 gap-3 items-center">
                  <div className="p-3 rounded-lg bg-muted/50 border-2 border-dashed text-center min-h-[60px] flex items-center justify-center">
                    <span className="text-xs text-muted-foreground">Đội A</span>
                  </div>
                  <div className="text-center">
                    <Badge variant="outline" className="text-xs">VS</Badge>
                  </div>
                  <div className="p-3 rounded-lg bg-muted/50 border-2 border-dashed text-center min-h-[60px] flex items-center justify-center">
                    <span className="text-xs text-muted-foreground">Đội B</span>
                  </div>
                </div>
                <div className="mt-3 flex items-center justify-center gap-2 text-xs text-muted-foreground">
                  <Calendar className="w-3 h-3" />
                  <span>Chưa xếp lịch</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  };

  // Render Group + Knockout structure
  const renderGroupKnockout = () => {
    const groupCount = Math.ceil(teamCount / 4); // Mỗi bảng 4 đội
    const teamsPerGroup = Math.ceil(teamCount / groupCount);

    return (
      <div className="space-y-8">
        {/* Groups */}
        <div className="space-y-6">
          <div className="flex items-center gap-2">
            <Badge className="font-semibold">Vòng bảng</Badge>
            <span className="text-xs text-muted-foreground">
              {groupCount} bảng đấu
            </span>
          </div>
          {Array.from({ length: groupCount }).map((_, groupIdx) => (
            <div key={groupIdx} className="space-y-3">
              <h4 className="font-semibold text-sm flex items-center gap-2">
                <Users className="w-4 h-4" />
                Bảng {String.fromCharCode(65 + groupIdx)} ({teamsPerGroup} đội)
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {Array.from({ length: 3 }).map((_, matchIdx) => (
                  <Card key={matchIdx} className="border-2 border-dashed border-muted">
                    <CardContent className="pt-5">
                      <div className="grid grid-cols-3 gap-3 items-center">
                        <div className="p-3 rounded-lg bg-muted/50 border-2 border-dashed text-center min-h-[60px] flex items-center justify-center">
                          <span className="text-xs text-muted-foreground">Đội A</span>
                        </div>
                        <div className="text-center">
                          <Badge variant="outline" className="text-xs">VS</Badge>
                        </div>
                        <div className="p-3 rounded-lg bg-muted/50 border-2 border-dashed text-center min-h-[60px] flex items-center justify-center">
                          <span className="text-xs text-muted-foreground">Đội B</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Knockout */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Badge className="font-semibold bg-orange-600">Vòng loại trực tiếp</Badge>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {['Tứ kết 1', 'Tứ kết 2', 'Bán kết', 'Chung kết'].map((round, idx) => (
              <Card key={idx} className="border-2 border-dashed border-orange-200">
                <CardContent className="pt-5">
                  <div className="mb-2">
                    <Badge variant="secondary" className="text-xs">{round}</Badge>
                  </div>
                  <div className="grid grid-cols-3 gap-3 items-center">
                    <div className="p-3 rounded-lg bg-muted/50 border-2 border-dashed text-center min-h-[60px] flex items-center justify-center">
                      <span className="text-xs text-muted-foreground">Nhất bảng</span>
                    </div>
                    <div className="text-center">
                      <Badge variant="outline" className="text-xs">VS</Badge>
                    </div>
                    <div className="p-3 rounded-lg bg-muted/50 border-2 border-dashed text-center min-h-[60px] flex items-center justify-center">
                      <span className="text-xs text-muted-foreground">Nhì bảng</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Info Banner */}
      <Alert className="border-blue-200 bg-blue-50">
        <Info className="h-4 w-4 text-blue-600" />
        <AlertDescription className="text-sm text-blue-800">
          Đây là khung lịch thi đấu dự kiến. Nhấn nút <strong>"Tự động sinh lịch"</strong> để hệ thống tự động tạo lịch và xếp đội vào các trận đấu.
          Sau khi đã có lịch, bạn có thể kéo thả để thay đổi đội trong từng trận.
        </AlertDescription>
      </Alert>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Swords className="w-5 h-5 text-primary" />
          <div>
            <h3 className="font-semibold">Khung lịch thi đấu</h3>
            <p className="text-xs text-muted-foreground">
              {teamCount}/{maxTeams} đội • ~{totalMatches} trận
            </p>
          </div>
        </div>
        <Badge variant="outline">
          {format === 'round_robin' ? 'Vòng tròn' : format === 'knockout' ? 'Loại trực tiếp' : 'Bảng + Knockout'}
        </Badge>
      </div>

      {/* Structure */}
      {format === 'knockout' && renderKnockoutTree()}
      {format === 'round_robin' && renderRoundRobin()}
      {format === 'group_knockout' && renderGroupKnockout()}
    </div>
  );
};
