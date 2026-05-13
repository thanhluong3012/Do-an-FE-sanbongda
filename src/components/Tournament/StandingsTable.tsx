import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Trophy, TrendingUp, TrendingDown } from 'lucide-react';

interface StandingRow {
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
}

interface StandingsTableProps {
    standings: StandingRow[];
    highlightTeamId?: number;
    onTeamClick?: (id: number, name: string) => void;
}

const initials = (name: string) => name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);

export const StandingsTable = ({ standings, highlightTeamId, onTeamClick }: StandingsTableProps) => {
    return (
        <div className="rounded-lg border overflow-hidden bg-card">
            <Table>
                <TableHeader>
                    <TableRow className="bg-muted/50">
                        <TableHead className="w-12 text-center">#</TableHead>
                        <TableHead>Đội</TableHead>
                        <TableHead className="text-center w-14">Trận</TableHead>
                        <TableHead className="text-center w-14">T</TableHead>
                        <TableHead className="text-center w-14">H</TableHead>
                        <TableHead className="text-center w-14">B</TableHead>
                        <TableHead className="text-center w-16">Hiệu số</TableHead>
                        <TableHead className="text-center w-16 font-bold">Điểm</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {standings.map((s) => {
                        const isMyTeam = highlightTeamId && s.team_id === highlightTeamId;
                        const isTop2 = s.ranking <= 2;

                        return (
                            <TableRow
                                key={s.id}
                                className={`
                  transition-colors cursor-pointer
                  ${isMyTeam ? 'bg-primary/10 hover:bg-primary/15 font-medium' : 'hover:bg-muted/50'}
                  ${isTop2 ? 'border-l-4 border-l-yellow-400' : ''}
                `}
                                onClick={() => s.team && onTeamClick?.(s.team.id, s.team.name)}
                            >
                                {/* Ranking */}
                                <TableCell className="text-center font-bold">
                                    <div className="flex items-center justify-center">
                                        {s.ranking === 1 && <Trophy className="w-4 h-4 text-yellow-500 mr-1" />}
                                        {s.ranking === 2 && <Trophy className="w-4 h-4 text-slate-400 mr-1" />}
                                        {s.ranking === 3 && <Trophy className="w-4 h-4 text-amber-600 mr-1" />}
                                        <span className={isTop2 ? 'text-primary' : ''}>{s.ranking}</span>
                                    </div>
                                </TableCell>

                                {/* Team */}
                                <TableCell>
                                    <div className="flex items-center gap-2">
                                        <Avatar className="w-7 h-7 border">
                                            {s.team?.logo && <AvatarImage src={s.team.logo} />}
                                            <AvatarFallback className="text-xs">
                                                {s.team?.name ? initials(s.team.name) : '?'}
                                            </AvatarFallback>
                                        </Avatar>
                                        <span className="truncate">{s.team?.name || `Team ${s.team_id}`}</span>
                                        {isMyTeam && <Badge className="text-xs h-5">Tôi</Badge>}
                                        {isTop2 && <TrendingUp className="w-3 h-3 text-green-500 ml-auto" />}
                                    </div>
                                </TableCell>

                                {/* Stats */}
                                <TableCell className="text-center tabular-nums">{s.matches_played}</TableCell>
                                <TableCell className="text-center tabular-nums text-green-600 font-medium">{s.wins}</TableCell>
                                <TableCell className="text-center tabular-nums text-slate-600">{s.draws}</TableCell>
                                <TableCell className="text-center tabular-nums text-red-600">{s.losses}</TableCell>

                                {/* Goal Difference */}
                                <TableCell className="text-center tabular-nums">
                                    <div className="flex items-center justify-center gap-1">
                                        {s.goal_difference > 0 && <TrendingUp className="w-3 h-3 text-green-500" />}
                                        {s.goal_difference < 0 && <TrendingDown className="w-3 h-3 text-red-500" />}
                                        <span className={
                                            s.goal_difference > 0 ? 'text-green-600 font-medium' :
                                                s.goal_difference < 0 ? 'text-red-600' : ''
                                        }>
                                            {s.goal_difference > 0 ? '+' : ''}{s.goal_difference}
                                        </span>
                                    </div>
                                </TableCell>

                                {/* Points */}
                                <TableCell className="text-center">
                                    <Badge variant={isTop2 ? 'default' : 'secondary'} className="font-bold tabular-nums">
                                        {s.points}
                                    </Badge>
                                </TableCell>
                            </TableRow>
                        );
                    })}
                </TableBody>
            </Table>

            {/* Legend */}
            <div className="px-4 py-2 bg-muted/30 border-t text-xs text-muted-foreground flex items-center gap-4">
                <div className="flex items-center gap-1">
                    <Trophy className="w-3 h-3 text-yellow-500" />
                    <span>Top 2 lên vòng đấu loại</span>
                </div>
                <div className="flex items-center gap-1">
                    <span className="font-semibold">T:</span> Thắng
                </div>
                <div className="flex items-center gap-1">
                    <span className="font-semibold">H:</span> Hòa
                </div>
                <div className="flex items-center gap-1">
                    <span className="font-semibold">B:</span> Bại
                </div>
            </div>
        </div>
    );
};
