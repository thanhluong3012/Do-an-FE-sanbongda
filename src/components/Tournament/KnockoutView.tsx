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

const ROUND_LABELS: Record<string, { label: string; short: string }> = {
    round_of_32: { label: 'Vòng 1/16', short: 'R32' },
    round_of_16: { label: 'Vòng 1/8', short: 'R16' },
    quarter_final: { label: 'Tứ Kết', short: 'QF' },
    semi_final: { label: 'Bán Kết', short: 'SF' },
    final: { label: 'Chung Kết', short: 'FINAL' },
    third_place: { label: 'Tranh Hạng 3', short: '3RD' },
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
    if (!d) return 'Chưa xác định';
    try {
        return fmtDate(parseISO(d), 'dd/MM', { locale: vi });
    } catch {
        return d;
    }
};

const getTeamName = (
    team: Match['home_team'],
    fallback?: string | null,
) => {
    return team?.name || fallback || 'Chưa xác định';
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

// Component for displaying a single team in bracket
const BracketTeam = ({
    team,
    teamName,
    score,
    isWinner,
}: {
    team?: Match['home_team'];
    teamName: string;
    score?: number | null;
    isWinner: boolean;
}) => {
    return (
        <div
            className={`
                flex items-center justify-between px-3 py-1.5 border-b border-emerald-800/20
                ${isWinner ? 'bg-emerald-700/20 font-bold' : ''}
            `}
        >
            <div className="flex items-center gap-2 min-w-0 flex-1">
                <Avatar className="h-5 w-5 border border-white/30">
                    {team?.logo && <AvatarImage src={team.logo} />}
                    <AvatarFallback className="text-[8px] font-bold bg-white/90">
                        {initials(teamName)}
                    </AvatarFallback>
                </Avatar>
                <span className="text-xs text-white truncate font-medium">
                    {teamName}
                </span>
            </div>
            <span className="text-sm font-bold text-white ml-2 min-w-[20px] text-right">
                {score ?? '–'}
            </span>
        </div>
    );
};

// Component for a single bracket match
const BracketMatch = ({
    match,
    isFinal = false,
    isThirdPlace = false,
    canManage,
    onEditScore,
}: {
    match: Match;
    isFinal?: boolean;
    isThirdPlace?: boolean;
    canManage?: boolean;
    onEditScore?: (m: Match) => void;
}) => {
    const done = match.status === 'completed';
    const homeScore = match.home_score ?? null;
    const awayScore = match.away_score ?? null;
    const homeWin = done && homeScore !== null && awayScore !== null && homeScore > awayScore;
    const awayWin = done && homeScore !== null && awayScore !== null && awayScore > homeScore;
    const homeName = getTeamName(match.home_team, match.home_from_position);
    const awayName = getTeamName(match.away_team, match.away_from_position);

    const bgColor = isFinal 
        ? 'bg-gradient-to-br from-yellow-500 to-yellow-600' 
        : isThirdPlace 
        ? 'bg-gradient-to-br from-orange-500 to-orange-600'
        : 'bg-gradient-to-br from-emerald-700 to-emerald-800';

    return (
        <div className="relative group">
            <div
                className={`
                    ${bgColor}
                    rounded-lg shadow-lg overflow-hidden border-2 
                    ${isFinal ? 'border-yellow-400' : isThirdPlace ? 'border-orange-400' : 'border-emerald-600'}
                    min-w-[200px] transition-all hover:shadow-xl hover:scale-105
                `}
            >
                {/* Header */}
                <div className={`
                    px-3 py-1 text-center border-b 
                    ${isFinal ? 'border-yellow-400/30 bg-yellow-600/30' : isThirdPlace ? 'border-orange-400/30 bg-orange-600/30' : 'border-emerald-600/30 bg-emerald-800/30'}
                `}>
                    <div className="text-[10px] font-bold text-white/90 uppercase tracking-wide">
                        {match.match_date && fmtTime(match.match_time) && (
                            <span>{fmtTime(match.match_time)}, ngày {fmtMatchDate(match.match_date)}</span>
                        )}
                        {!match.match_date && 'Chưa xác định'}
                    </div>
                </div>

                {/* Teams */}
                <div>
                    <BracketTeam
                        team={match.home_team}
                        teamName={homeName}
                        score={homeScore}
                        isWinner={homeWin}
                    />
                    <BracketTeam
                        team={match.away_team}
                        teamName={awayName}
                        score={awayScore}
                        isWinner={awayWin}
                    />
                </div>

                {/* Status/Field */}
                {match.field?.name && (
                    <div className="px-3 py-1 text-center border-t border-emerald-800/20 bg-emerald-900/20">
                        <div className="text-[9px] text-white/70 truncate">
                            {match.field.name}
                        </div>
                    </div>
                )}
            </div>

            {/* Edit button on hover */}
            {canManage && match.status !== 'cancelled' && (
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
                    <Button
                        size="sm"
                        variant="secondary"
                        className="shadow-lg"
                        onClick={() => onEditScore?.(match)}
                    >
                        <Edit3 className="h-3 w-3 mr-1" />
                        {done ? 'Sửa' : 'Nhập'} tỷ số
                    </Button>
                </div>
            )}
        </div>
    );
};
// Component for connector lines between matches
const BracketConnector = ({ height = 100 }: { height?: number }) => (
    <div className="flex items-center justify-center px-4" style={{ height: `${height}px` }}>
        <svg width="60" height={height} className="overflow-visible">
            {/* Horizontal line from match */}
            <line x1="0" y1={height / 2} x2="30" y2={height / 2} stroke="#64748b" strokeWidth="2" />
            {/* Vertical line */}
            <line x1="30" y1="0" x2="30" y2={height} stroke="#64748b" strokeWidth="2" />
            {/* Horizontal line to next match */}
            <line x1="30" y1={height / 2} x2="60" y2={height / 2} stroke="#64748b" strokeWidth="2" />
        </svg>
    </div>
);

// Round column component
const RoundColumn = ({
    round,
    canManage,
    onEditScore,
    isLastRound = false,
}: {
    round: RoundData;
    canManage?: boolean;
    onEditScore?: (match: Match) => void;
    isLastRound?: boolean;
}) => {
    const isFinal = round.round_type === 'final';
    const isThirdPlace = round.round_type === 'third_place';
    const config = ROUND_LABELS[round.round_type] || { label: round.round_name, short: 'KO' };

    // Calculate spacing based on round
    const matchSpacing = {
        'round_of_16': 'gap-4',
        'quarter_final': 'gap-12',
        'semi_final': 'gap-24',
        'final': 'gap-12',
        'third_place': 'gap-0',
    }[round.round_type] || 'gap-4';

    return (
        <div className="flex flex-col items-center">
            {/* Round title */}
            <div className={`
                mb-6 px-6 py-2 rounded-full font-bold text-sm text-white shadow-lg
                ${isFinal ? 'bg-gradient-to-r from-yellow-500 to-yellow-600' : 
                  isThirdPlace ? 'bg-gradient-to-r from-orange-500 to-orange-600' : 
                  'bg-gradient-to-r from-slate-700 to-slate-800'}
            `}>
                {isFinal && <Crown className="inline h-4 w-4 mr-1 mb-0.5" />}
                {isThirdPlace && <Medal className="inline h-4 w-4 mr-1 mb-0.5" />}
                {config.label.toUpperCase()}
            </div>

            {/* Matches */}
            <div className={`flex flex-col ${matchSpacing} justify-center flex-1`}>
                {round.matches.map((match) => (
                    <BracketMatch
                        key={match.id}
                        match={match}
                        isFinal={isFinal}
                        isThirdPlace={isThirdPlace}
                        canManage={canManage}
                        onEditScore={onEditScore}
                    />
                ))}
            </div>
        </div>
    );
};

export const KnockoutView = ({
    rounds,
    canManage,
    onEditScore,
}: KnockoutViewProps) => {
    // Separate and sort rounds
    const thirdPlaceRound = rounds.find((r) => r.round_type === 'third_place');
    const finalRound = rounds.find((r) => r.round_type === 'final');
    
    const mainRounds = rounds
        .filter((r) => r.round_type !== 'third_place' && r.round_type !== 'final')
        .sort((a, b) => {
            const order: Record<string, number> = {
                'round_of_32': 1,
                'round_of_16': 2,
                'quarter_final': 3,
                'semi_final': 4,
            };
            return (order[a.round_type] || 0) - (order[b.round_type] || 0);
        });

    // Add final rounds at the end
    const orderedRounds = [...mainRounds];
    if (finalRound) orderedRounds.push(finalRound);

    return (
        <div className="w-full py-8">
            {/* Header */}
            <div className="mb-8 text-center">
                <div className="inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl shadow-xl">
                    <Trophy className="h-8 w-8 text-yellow-400" />
                    <h2 className="text-3xl font-black text-white uppercase tracking-wide">
                        Lịch Thi Đấu Vòng Knock-Out
                    </h2>
                    <Trophy className="h-8 w-8 text-yellow-400" />
                </div>
            </div>

            {/* Bracket Container */}
            <div className="relative overflow-x-auto pb-8">
                <div className="inline-flex min-w-max px-8 gap-2">
                    {/* Main rounds */}
                    {orderedRounds.map((round, index) => (
                        <React.Fragment key={round.id}>
                            <RoundColumn
                                round={round}
                                canManage={canManage}
                                onEditScore={onEditScore}
                                isLastRound={index === orderedRounds.length - 1}
                            />
                            {/* Add connector between rounds (except after last round) */}
                            {index < orderedRounds.length - 1 && (
                                <div className="flex items-center">
                                    <div className="w-12 h-0.5 bg-slate-300"></div>
                                </div>
                            )}
                        </React.Fragment>
                    ))}

                    {/* Third place match - positioned separately if exists */}
                    {thirdPlaceRound && (
                        <>
                            <div className="w-8"></div>
                            <RoundColumn
                                round={thirdPlaceRound}
                                canManage={canManage}
                                onEditScore={onEditScore}
                                isLastRound={true}
                            />
                        </>
                    )}
                </div>
            </div>

            {/* Legend */}
            <div className="mt-8 flex justify-center gap-6 text-sm">
                <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded bg-gradient-to-br from-emerald-700 to-emerald-800 border-2 border-emerald-600"></div>
                    <span className="text-slate-600">Trận đấu thường</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded bg-gradient-to-br from-yellow-500 to-yellow-600 border-2 border-yellow-400"></div>
                    <span className="text-slate-600">Chung kết</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded bg-gradient-to-br from-orange-500 to-orange-600 border-2 border-orange-400"></div>
                    <span className="text-slate-600">Tranh hạng 3</span>
                </div>
            </div>
        </div>
    );
};
