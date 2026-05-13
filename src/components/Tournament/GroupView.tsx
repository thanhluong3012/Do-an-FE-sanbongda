import { Card, CardContent } from '@/components/ui/card';
import { Shield, BarChart3, Swords } from 'lucide-react';
import { Match } from '@/services/matchService';
import { StandingsTable } from './StandingsTable';
import { MatchCard } from './MatchCard';

interface GroupData {
    id: number;
    group_name: string;
    standings: Array<{
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
    }>;
    matches: Match[];
    teams: { id: number; name: string; logo?: string }[];
}

interface GroupViewProps {
    group: GroupData;
    highlightTeamId?: number;
    canManage?: boolean;
    onTeamClick?: (id: number, name: string) => void;
    onEditScore?: (match: Match) => void;
    onEditField?: (match: Match) => void;
    onEditSchedule?: (match: Match) => void;
}

export const GroupView = ({
    group,
    highlightTeamId,
    canManage,
    onTeamClick,
    onEditScore,
    onEditField,
    onEditSchedule,
}: GroupViewProps) => {
    return (
        <div className="space-y-6">
            {/* Group Header */}
            <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-primary to-primary/80 text-primary-foreground rounded-lg shadow-md">
                    <Shield className="w-5 h-5" />
                    <h2 className="font-bold text-lg">{group.group_name}</h2>
                </div>
                <div className="flex gap-2 text-sm text-muted-foreground">
                    <span>{group.standings?.length || 0} đội</span>
                    <span>•</span>
                    <span>{group.matches?.length || 0} trận</span>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-6">
                {/* Standings - 2/5 on large screens */}
                <div className="space-y-3">
                    <div className="flex items-center gap-2">
                        <BarChart3 className="w-5 h-5 text-primary" />
                        <h3 className="font-semibold text-base">Bảng xếp hạng</h3>
                    </div>

                    {group.standings?.length > 0 ? (
                        <>
                            <StandingsTable
                                standings={group.standings}
                                highlightTeamId={highlightTeamId}
                                onTeamClick={onTeamClick}
                            />
                            <p className="text-xs text-muted-foreground italic px-2">
                                💡 Nhấn vào tên đội để xem lịch thi đấu của đội đó
                            </p>
                        </>
                    ) : (
                        <Card>
                            <CardContent className="py-12 text-center text-sm text-muted-foreground">
                                Chưa có kết quả thi đấu
                            </CardContent>
                        </Card>
                    )}
                </div>

                {/* Matches - 3/5 on large screens */}
                <div className="space-y-3 ">
                    <div className="flex items-center gap-2">
                        <Swords className="w-5 h-5 text-primary" />
                        <h3 className="font-semibold text-base">Lịch thi đấu</h3>
                    </div>

                    {(group.matches?.length ?? 0) === 0 ? (
                        <Card>
                            <CardContent className="py-12 text-center text-sm text-muted-foreground">
                                Chưa có lịch thi đấu
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="space-y-3 grid grid-cols-3 gap-6">
                            {group.matches.map((match) => (
                                <MatchCard
                                    key={match.id}
                                    match={match}
                                    highlightTeamId={highlightTeamId}
                                    canManage={canManage}
                                    onEditScore={onEditScore}
                                    onEditField={onEditField}
                                    onEditSchedule={onEditSchedule}
                                />
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
