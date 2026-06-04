import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { GroupStanding } from '@/services/standingsService';
import { Trophy } from 'lucide-react';

interface GroupStandingsTableProps {
  standings: GroupStanding[];
  groupName?: string;
}

export const GroupStandingsTable = ({ standings, groupName }: GroupStandingsTableProps) => {
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getRankBadge = (rank: number) => {
    if (rank === 1) {
      return <Badge className="bg-yellow-500">🥇 {rank}</Badge>;
    } else if (rank === 2) {
      return <Badge className="bg-gray-400">🥈 {rank}</Badge>;
    } else if (rank === 3) {
      return <Badge className="bg-orange-600">🥉 {rank}</Badge>;
    }
    return <Badge variant="outline">{rank}</Badge>;
  };

  if (standings.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-muted-foreground">Chưa có dữ liệu xếp hạng</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trophy className="w-5 h-5" />
          Bảng xếp hạng{groupName && ` - ${groupName}`}
        </CardTitle>
        <CardDescription>
          Theo thứ tự: Điểm → Hiệu số → Bàn thắng
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-16">Hạng</TableHead>
                <TableHead>Đội</TableHead>
                <TableHead className="text-center">Trận</TableHead>
                <TableHead className="text-center">Thắng</TableHead>
                <TableHead className="text-center">Hòa</TableHead>
                <TableHead className="text-center">Thua</TableHead>
                <TableHead className="text-center">BT</TableHead>
                <TableHead className="text-center">BB</TableHead>
                <TableHead className="text-center">HS</TableHead>
                <TableHead className="text-center">Fair-play</TableHead>
                <TableHead className="text-center font-bold">Điểm</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {standings.map((standing) => (
                <TableRow 
                  key={standing.id}
                  className={standing.rank <= 2 ? 'bg-green-50/50' : ''}
                >
                  <TableCell>{getRankBadge(standing.rank)}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Avatar className="w-8 h-8">
                        <AvatarImage src={standing.team?.logo} alt={standing.team?.name} />
                        <AvatarFallback>
                          {standing.team?.name ? getInitials(standing.team.name) : 'T'}
                        </AvatarFallback>
                      </Avatar>
                      <span className="font-medium">{standing.team?.name || 'N/A'}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-center">{standing.matches_played}</TableCell>
                  <TableCell className="text-center text-green-600 font-medium">
                    {standing.wins}
                  </TableCell>
                  <TableCell className="text-center text-gray-600">
                    {standing.draws}
                  </TableCell>
                  <TableCell className="text-center text-red-600 font-medium">
                    {standing.losses}
                  </TableCell>
                  <TableCell className="text-center">{standing.goals_for}</TableCell>
                  <TableCell className="text-center">{standing.goals_against}</TableCell>
                  <TableCell className="text-center">
                    <span className={standing.goal_difference >= 0 ? 'text-green-600' : 'text-red-600'}>
                      {standing.goal_difference >= 0 ? '+' : ''}{standing.goal_difference}
                    </span>
                  </TableCell>
                  <TableCell className="text-center">
                    {(() => {
                      const fairPlayValue = standing.fair_play ?? (standing as any).fair_play_points;
                      return (
                        <span className={
                          fairPlayValue === undefined ? 'text-muted-foreground' :
                          fairPlayValue <= 1 ? 'text-green-600' : fairPlayValue <= 3 ? 'text-amber-600' : 'text-red-600'
                        }>
                          {fairPlayValue === undefined ? '-' : fairPlayValue}
                        </span>
                      );
                    })()}
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge variant="default" className="font-bold">
                      {standing.points}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        <div className="mt-4 text-xs text-muted-foreground space-y-1">
          <p>BT = Bàn thắng, BB = Bàn bại, HS = Hiệu số</p>
          <p>Thắng: +3 điểm | Hòa: +1 điểm | Thua: 0 điểm</p>
          <p className="text-green-600">🟢 Top 2 được đi tiếp (nếu là vòng bảng)</p>
        </div>
      </CardContent>
    </Card>
  );
};
