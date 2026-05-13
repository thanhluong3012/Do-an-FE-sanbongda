import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
    Trophy,
    Calendar,
    Clock,
    MapPin,
    Edit3,
    Crown,
    Medal,
} from 'lucide-react';
import { format as fmtDate, parseISO } from 'date-fns';
import { vi } from 'date-fns/locale';
import { Match } from '@/services/matchService';

const ROUND_LABELS: Record<string, { label: string; icon: string; color: string }> = {
    round_of_32: {
        label: 'Vòng 32',
        icon: 'R32',
        color: 'from-blue-100 via-blue-50 to-white border-blue-300',
    },
    round_of_16: {
        label: 'Vòng 16',
        icon: 'R16',
        color: 'from-indigo-100 via-indigo-50 to-white border-indigo-300',
    },
    quarter_final: {
        label: 'Tứ kết',
        icon: 'QF',
        color: 'from-purple-100 via-purple-50 to-white border-purple-300',
    },
    semi_final: {
        label: 'Bán kết',
        icon: 'SF',
        color: 'from-orange-100 via-orange-50 to-white border-orange-300',
    },
    final: {
        label: 'Chung kết',
        icon: 'FINAL',
        color: 'from-yellow-100 via-yellow-50 to-white border-yellow-400',
    },
    third_place: {
        label: 'Tranh hạng 3',
        icon: '3RD',
        color: 'from-orange-100 via-orange-50 to-white border-orange-400',
    },
};

const ROUND_ORDER: Record<string, number> = {
    round_of_32: 1,
    round_of_16: 2,
    quarter_final: 3,
    semi_final: 4,
    final: 5,
    third_place: 6,
};

const initials = (name: string) =>
    name
        .split(' ')
        .map((w) => w[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);

const fmtTime = (t: string | null | undefined) => {
    if (!t) return '';
    return t.length > 5 ? t.slice(0, 5) : t;
};

const fmtMatchDate = (d: string | null | undefined) => {
    if (!d) return '—';

    try {
        return fmtDate(parseISO(d), 'EEE, dd/MM', { locale: vi });
    } catch {
        return d;
    }
};

// Helper function to group matches by date
const groupMatchesByDate = (matches: Match[]): Record<string, Match[]> => {
    const grouped: Record<string, Match[]> = {};

    matches.forEach((match) => {
        const date = match.match_date || 'Chưa xác định';
        if (!grouped[date]) {
            grouped[date] = [];
        }
        grouped[date].push(match);
    });

    return grouped;
};

// Helper function to format date group header
const formatDateHeader = (dateStr: string): string => {
    if (dateStr === 'Chưa xác định') return dateStr;

    try {
        return fmtDate(parseISO(dateStr), 'EEEE, dd/MM/yyyy', { locale: vi });
    } catch {
        return dateStr;
    }
};

const getRoundColor = (roundType: string): string => {
    const colors: Record<string, string> = {
        round_of_32: 'blue',
        round_of_16: 'indigo',
        quarter_final: 'purple',
        semi_final: 'orange',
        final: 'yellow',
    };
    return colors[roundType] || 'slate';
};

interface RoundData {
    id: number;
    round_name: string;
    round_type: string;
    round_order: number;
    matches: Match[];
}

interface KnockoutViewProps {
    rounds: RoundData[];
    canManage?: boolean;
    onEditScore?: (match: Match) => void;
}

const getTeamName = (
    team: Match['home_team'],
    fallback?: string | null,
) => {
    return team?.name || fallback || 'Chưa xác định';
};

const getMatchStatusLabel = (status?: string) => {
    switch (status) {
        case 'completed':
            return 'Đã kết thúc';
        case 'in_progress':
            return 'Đang đá';
        case 'cancelled':
            return 'Đã hủy';
        default:
            return 'Chưa đá';
    }
};

const TeamRow = ({
    team,
    teamName,
    score,
    isWinner,
    isLoser,
}: {
    team?: Match['home_team'];
    teamName: string;
    score?: number | null;
    isWinner: boolean;
    isLoser: boolean;
}) => {
    return (
        <div
            className={`
                flex items-center justify-between gap-2 rounded-xl px-2.5 py-2 transition-all
                ${isWinner
                    ? 'bg-emerald-50 border border-emerald-300 shadow-sm'
                    : 'bg-slate-50 border border-slate-100'
                }
                ${isLoser ? 'opacity-60' : ''}
            `}
        >
            <div className="flex min-w-0 flex-1 items-center gap-2">
                <Avatar className="h-7 w-7 border bg-white">
                    {team?.logo && <AvatarImage src={team.logo} />}
                    <AvatarFallback className="text-[10px] font-bold">
                        {initials(teamName)}
                    </AvatarFallback>
                </Avatar>

                <span
                    className={`
                        truncate text-sm
                        ${isWinner ? 'font-bold text-emerald-700' : 'font-medium text-slate-700'}
                    `}
                >
                    {teamName}
                </span>
            </div>

            <div
                className={`
                    min-w-7 text-right text-xl font-black tabular-nums
                    ${isWinner ? 'text-emerald-700' : 'text-slate-500'}
                `}
            >
                {score ?? '–'}
            </div>
        </div>
    );
};

const KnockoutMatchCard = ({
    match,
    canManage,
    onEditScore,
    isFinal = false,
    isThirdPlace = false,
    roundColor = 'slate',
}: {
    match: Match;
    canManage?: boolean;
    onEditScore?: (m: Match) => void;
    isFinal?: boolean;
    isThirdPlace?: boolean;
    roundColor?: string;
}) => {
    const done = match.status === 'completed';
    const live = match.status === 'in_progress';

    const homeScore = match.home_score ?? null;
    const awayScore = match.away_score ?? null;

    const homeWin =
        done &&
        homeScore !== null &&
        awayScore !== null &&
        homeScore > awayScore;

    const awayWin =
        done &&
        homeScore !== null &&
        awayScore !== null &&
        awayScore > homeScore;

    const homeLose = done && awayWin;
    const awayLose = done && homeWin;

    const homeName = getTeamName(match.home_team, match.home_from_position);
    const awayName = getTeamName(match.away_team, match.away_from_position);

    // Border color based on round
    const borderColorClass = {
        blue: 'border-blue-200 hover:border-blue-300',
        indigo: 'border-indigo-200 hover:border-indigo-300',
        purple: 'border-purple-200 hover:border-purple-300',
        orange: 'border-orange-200 hover:border-orange-300',
        yellow: 'border-yellow-300 hover:border-yellow-400',
        slate: 'border-slate-200 hover:border-slate-300',
    }[roundColor] || 'border-slate-200';

    return (
        <div
            className={`
                relative overflow-hidden rounded-2xl border-2 bg-white shadow-sm transition-all
                hover:-translate-y-0.5 hover:shadow-lg
                ${live ? 'border-emerald-400 ring-2 ring-emerald-200' : ''}
                ${isFinal ? 'border-yellow-400 bg-gradient-to-b from-yellow-50 to-white shadow-md ring-2 ring-yellow-200' : ''}
                ${isThirdPlace ? 'border-orange-400 bg-gradient-to-b from-orange-50 to-white ring-2 ring-orange-200' : ''}
                ${!isFinal && !isThirdPlace && !live ? borderColorClass : ''}
            `}
        >
            <div
                className={`
                    flex items-center justify-between border-b px-3 py-2
                    ${isFinal ? 'border-yellow-200 bg-yellow-100/70' : ''}
                    ${isThirdPlace ? 'border-orange-200 bg-orange-100/70' : ''}
                    ${!isFinal && !isThirdPlace ? 'border-slate-100 bg-slate-50' : ''}
                `}
            >
                <div className="flex items-center gap-2">
                    {isFinal ? (
                        <Crown className="h-4 w-4 text-yellow-600" />
                    ) : isThirdPlace ? (
                        <Medal className="h-4 w-4 text-orange-600" />
                    ) : (
                        <Trophy className="h-4 w-4 text-slate-500" />
                    )}

                    <span className="text-xs font-bold uppercase tracking-wide text-slate-600">
                        {match.match_number ? `Trận #${match.match_number}` : 'Knockout'}
                    </span>
                </div>

                {live ? (
                    <Badge className="animate-pulse bg-red-500 text-white">
                        LIVE
                    </Badge>
                ) : (
                    <Badge variant={done ? 'default' : 'outline'} className="text-[10px]">
                        {getMatchStatusLabel(match.status)}
                    </Badge>
                )}
            </div>

            <div className="space-y-2 p-3">
                <TeamRow
                    team={match.home_team}
                    teamName={homeName}
                    score={homeScore}
                    isWinner={homeWin}
                    isLoser={homeLose}
                />

                <TeamRow
                    team={match.away_team}
                    teamName={awayName}
                    score={awayScore}
                    isWinner={awayWin}
                    isLoser={awayLose}
                />
            </div>

            <div className="space-y-2 border-t border-slate-100 px-3 pb-3 pt-2">
                <div className="grid grid-cols-1 gap-1 text-xs text-slate-500">
                    {match.match_date && (
                        <div className="flex items-center gap-1.5">
                            <Calendar className="h-3.5 w-3.5" />
                            <span>{fmtMatchDate(match.match_date)}</span>
                        </div>
                    )}

                    {match.match_time && (
                        <div className="flex items-center gap-1.5">
                            <Clock className="h-3.5 w-3.5" />
                            <span>{fmtTime(match.match_time)}</span>
                        </div>
                    )}

                    {match.field?.name && (
                        <div className="flex items-center gap-1.5">
                            <MapPin className="h-3.5 w-3.5" />
                            <span className="truncate">{match.field.name}</span>
                        </div>
                    )}
                </div>

                {canManage && match.status !== 'cancelled' && (
                    <Button
                        size="sm"
                        variant="outline"
                        className="h-8 w-full rounded-xl text-xs"
                        onClick={() => onEditScore?.(match)}
                    >
                        <Edit3 className="mr-1 h-3.5 w-3.5" />
                        {done ? 'Sửa tỷ số' : 'Nhập tỷ số'}
                    </Button>
                )}
            </div>
        </div>
    );
};

export const KnockoutView = ({
    rounds,
    canManage,
    onEditScore,
}: KnockoutViewProps) => {
    // Separate main rounds and third place
    const thirdPlaceRound = rounds.find((r) => r.round_type === 'third_place');

    const mainRounds = rounds
        .filter((round) => round.round_type !== 'third_place')
        .sort((a, b) => {
            const orderA = ROUND_ORDER[a.round_type] ?? a.round_order;
            const orderB = ROUND_ORDER[b.round_type] ?? b.round_order;
            return orderA - orderB;
        });

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="overflow-hidden rounded-3xl border border-slate-200 bg-gradient-to-br from-slate-50 via-white to-slate-100 shadow-sm">
                <div className="border-b border-slate-100 bg-white/50 p-4 backdrop-blur-md md:p-6">
                    <div className="flex items-center gap-3">
                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-900 text-white shadow-md">
                            <Trophy className="h-6 w-6" />
                        </div>
                        <div>
                            <h2 className="text-xl font-black text-slate-900 md:text-2xl">
                                Vòng Knockout
                            </h2>
                            <p className="text-sm font-medium text-slate-500">
                                {mainRounds.length} vòng đấu loại trực tiếp
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Rounds Grid */}
            {mainRounds.map((round) => {
                const config = ROUND_LABELS[round.round_type] ?? {
                    label: round.round_name,
                    icon: 'KO',
                    color: 'from-slate-50 to-white border-slate-200',
                };

                const isFinal = round.round_type === 'final';
                const roundColor = getRoundColor(round.round_type);

                // If this is final round and we have third place, combine them
                const showThirdPlace = isFinal && thirdPlaceRound;
                let allMatches = [...round.matches];

                if (showThirdPlace && thirdPlaceRound) {
                    // Add third place matches with a flag
                    allMatches = [
                        ...thirdPlaceRound.matches.map(m => ({ ...m, _isThirdPlace: true })),
                        ...allMatches
                    ];
                }

                const matchesByDate = groupMatchesByDate(allMatches);
                const sortedDates = Object.keys(matchesByDate).sort();

                return (
                    <div
                        key={round.id}
                        className={`
                            overflow-hidden rounded-3xl border bg-white shadow-sm
                            ${config.color}
                        `}
                    >
                        {/* Round Header */}
                        <div className={`border-b bg-gradient-to-br px-4 py-4 md:px-6 ${config.color}`}>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className={`
                                        flex h-10 w-10 items-center justify-center rounded-xl
                                        ${isFinal ? 'bg-yellow-500' : 'bg-slate-700'}
                                        text-white shadow-md
                                    `}>
                                        {isFinal ? <Crown className="h-5 w-5" /> : <Trophy className="h-5 w-5" />}
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                                            {config.icon}
                                        </p>
                                        <h3 className="text-lg font-black text-slate-900">
                                            {config.label}
                                        </h3>
                                    </div>
                                </div>

                                <Badge variant="outline" className="bg-white">
                                    {allMatches.length} trận
                                </Badge>
                            </div>
                        </div>

                        {/* Matches by Date */}
                        <div className="space-y-6 p-4 md:p-6">
                            {sortedDates.length === 0 ? (
                                <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50/50 p-8 text-center text-sm font-medium text-slate-400">
                                    Chưa có trận đấu
                                </div>
                            ) : (
                                sortedDates.map((date) => {
                                    const dayMatches = matchesByDate[date];

                                    return (
                                        <div key={date} className="space-y-3">
                                            {/* Date Header */}
                                            <div className="flex items-center gap-2">
                                                <Calendar className="h-4 w-4 text-slate-400" />
                                                <h4 className="text-sm font-bold text-slate-700">
                                                    {formatDateHeader(date)}
                                                </h4>
                                                <div className="h-px flex-1 bg-slate-200" />
                                                <span className="text-xs font-medium text-slate-500">
                                                    {dayMatches.length} trận
                                                </span>
                                            </div>

                                            {/* Matches Grid */}
                                            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                                                {dayMatches.map((match) => {
                                                    const isThirdPlace = (match as any)._isThirdPlace;
                                                    return (
                                                        <KnockoutMatchCard
                                                            key={match.id}
                                                            match={match}
                                                            canManage={canManage}
                                                            onEditScore={onEditScore}
                                                            isFinal={!isThirdPlace && isFinal}
                                                            isThirdPlace={isThirdPlace}
                                                            roundColor={roundColor}
                                                        />
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </div>
                );
            })}
        </div>
    );
};
