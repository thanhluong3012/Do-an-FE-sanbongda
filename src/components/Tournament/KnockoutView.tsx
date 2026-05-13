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
                flex items-center justify-between px-2.5 py-1.5 border-b border-emerald-800/20 last:border-0
                ${isWinner ? 'bg-emerald-700/30 font-bold' : ''}
            `}
        >
            <div className="flex items-center gap-2 min-w-0 flex-1">
                <Avatar className="h-5 w-5 border border-white/30 flex-shrink-0">
                    {team?.logo && <AvatarImage src={team.logo} />}
                    <AvatarFallback className="text-[8px] font-bold bg-white/90 text-slate-800">
                        {initials(teamName)}
                    </AvatarFallback>
                </Avatar>
                <span className="text-xs text-white truncate font-medium">
                    {teamName}
                </span>
            </div>
            <span className="text-base font-bold text-white ml-2 min-w-[24px] text-right flex-shrink-0">
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
                    w-[220px] h-[120px] flex flex-col transition-all hover:shadow-xl hover:scale-[1.02]
                `}
                title={match.field?.name ? `Sân: ${match.field.name}` : undefined}
            >
                {/* Header with date/time */}
                <div className={`
                    px-3 py-1 text-center border-b flex-shrink-0
                    ${isFinal ? 'border-yellow-400/30 bg-yellow-600/30' : isThirdPlace ? 'border-orange-400/30 bg-orange-600/30' : 'border-emerald-600/30 bg-emerald-800/30'}
                `}>
                    <div className="text-[9px] font-bold text-white/90 uppercase tracking-wide leading-tight">
                        <div className="mb-0.5">Trận #{match.match_number}</div>
                        {match.match_date && fmtTime(match.match_time) ? (
                            <span>{fmtTime(match.match_time)}, {fmtMatchDate(match.match_date)}</span>
                        ) : (
                            'Chưa xác định'
                        )}
                        {match.field?.name && (
                            <div className="text-[8px] text-white/70 font-normal mt-0.5">
                                📍 {match.field.name}
                            </div>
                        )}
                    </div>
                </div>

                {/* Teams */}
                <div className="flex-1 flex flex-col justify-center">
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
            </div>

            {/* Edit button on hover */}
            {canManage && match.status !== 'cancelled' && (
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex flex-col items-center justify-center gap-1">
                    {match.field?.name && (
                        <div className="text-[10px] text-white/80 font-medium px-2 text-center">
                            📍 {match.field.name}
                        </div>
                    )}
                    <Button
                        size="sm"
                        variant="secondary"
                        className="shadow-lg text-xs h-7"
                        onClick={() => onEditScore?.(match)}
                    >
                        <Edit3 className="h-3 w-3 mr-1" />
                        {done ? 'Sửa' : 'Nhập'}
                    </Button>
                </div>
            )}
        </div>
    );
};

export const KnockoutView = ({
    rounds,
    canManage,
    onEditScore,
}: KnockoutViewProps) => {
    // Sort rounds by order
    const sortedRounds = [...rounds].sort((a, b) => {
        const order: Record<string, number> = {
            'round_of_16': 1,
            'quarter_final': 2,
            'semi_final': 3,
            'final': 4,
            'third_place': 5,
        };
        return (order[a.round_type] || 0) - (order[b.round_type] || 0);
    });

    // Separate third place
    const mainRounds = sortedRounds.filter(r => r.round_type !== 'third_place');
    const thirdPlace = sortedRounds.find(r => r.round_type === 'third_place');

    const getRoundLabel = (round: RoundData) => {
        // Nếu là tranh hạng 3, luôn trả về tên cố định
        if (round.round_type === 'third_place') {
            return 'TRANH HẠNG 3';
        }

        // Dựa vào số trận để xác định tên vòng
        const matchCount = round.matches.length;

        if (matchCount === 1) return 'CHUNG KẾT';
        if (matchCount === 2) return 'BÁN KẾT';
        if (matchCount === 4) return 'TỨ KẾT';
        if (matchCount === 8) return 'VÒNG 1/8';
        if (matchCount === 16) return 'VÒNG 1/16';
        if (matchCount === 32) return 'VÒNG 1/32';

        // Fallback
        return round.round_name?.toUpperCase() || 'KNOCKOUT';
    };

    // --- LOGIC CĂN CHỈNH KÍCH THƯỚC ĐỘNG ---
    const MATCH_HEIGHT = 120; // Chiều cao cố định của 1 thẻ trận đấu
    const BASE_GAP = 40;      // Khoảng cách giữa 2 thẻ ở vòng đầu tiên

    const getMetrics = (colIndex: number) => {
        let offset = 0;
        let space = MATCH_HEIGHT + BASE_GAP;
        for (let i = 0; i < colIndex; i++) {
            offset += space / 2;
            space *= 2;
        }
        return { offset, space, gap: space - MATCH_HEIGHT };
    };

    return (
        <div className="w-full py-8 bg-gradient-to-br from-slate-50 via-white to-slate-100 rounded-3xl">
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
            <div className="relative overflow-auto pb-12 pt-4">
                <div className="inline-flex items-start px-8 min-w-max">
                    {mainRounds.map((round, colIndex) => {
                        const isFinal = round.round_type === 'final';
                        const isLastRound = colIndex === mainRounds.length - 1;

                        // Lấy thông số căn chỉnh khoảng cách dựa trên vòng hiện tại
                        const { offset, space, gap } = getMetrics(colIndex);

                        return (
                            <React.Fragment key={round.id}>
                                {/* Round Column */}
                                <div className="flex flex-col w-[220px]">
                                    {/* Round Title */}
                                    <div className={`
                                        mb-6 px-5 py-2 rounded-full text-xs font-bold text-white text-center shadow-md whitespace-nowrap
                                        ${isFinal ? 'bg-gradient-to-r from-yellow-500 to-yellow-600' : 'bg-slate-700'}
                                    `}>
                                        {isFinal && <Crown className="inline h-3.5 w-3.5 mr-1 mb-0.5" />}
                                        {getRoundLabel(round)}
                                    </div>

                                    {/* Matches */}
                                    <div style={{ marginTop: `${offset}px` }}>
                                        {round.matches.map((match, matchIndex) => (
                                            <div
                                                key={match.id}
                                                style={{ marginBottom: matchIndex < round.matches.length - 1 ? `${gap}px` : 0 }}
                                            >
                                                <BracketMatch
                                                    match={match}
                                                    isFinal={isFinal}
                                                    canManage={canManage}
                                                    onEditScore={onEditScore}
                                                />
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Connector Lines */}
                                {!isLastRound && round.matches.length > 0 && (
                                    <div className="flex flex-col w-[48px]">
                                        {/* Spacer tàng hình để đẩy đường nối xuống bằng với Title */}
                                        <div className="mb-6 py-2 opacity-0 text-xs text-center">|</div>

                                        <div style={{ marginTop: `${offset}px`, paddingTop: `${MATCH_HEIGHT / 2}px` }}>
                                            {Array.from({ length: Math.floor(round.matches.length / 2) }).map((_, pairIndex) => (
                                                <div
                                                    key={pairIndex}
                                                    style={{ height: `${space}px`, marginBottom: `${space}px` }}
                                                >
                                                    <svg width="48" height={space} className="overflow-visible">
                                                        <line x1="0" y1="0" x2="24" y2="0" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                                        <line x1="0" y1={space} x2="24" y2={space} stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                                        <line x1="24" y1="0" x2="24" y2={space} stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                                        <line x1="24" y1={space / 2} x2="48" y2={space / 2} stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                                    </svg>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </React.Fragment>
                        );
                    })}

                    {/* Third Place */}
                    {thirdPlace && thirdPlace.matches.length > 0 && (
                        <div className="ml-8 w-[220px]">
                            <div className="mb-6 px-5 py-2 rounded-full text-xs font-bold text-white text-center shadow-md whitespace-nowrap bg-gradient-to-r from-orange-500 to-orange-600">
                                <Medal className="inline h-3.5 w-3.5 mr-1 mb-0.5" />
                                {getRoundLabel(thirdPlace)}
                            </div>
                            <div style={{ marginTop: `${getMetrics(mainRounds.length - 1).offset}px` }}>
                                <BracketMatch
                                    match={thirdPlace.matches[0]}
                                    isThirdPlace={true}
                                    canManage={canManage}
                                    onEditScore={onEditScore}
                                />
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Legend */}
            <div className="mt-8 flex justify-center gap-6 text-sm flex-wrap px-4">
                <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded bg-gradient-to-br from-emerald-700 to-emerald-800 border-2 border-emerald-600"></div>
                    <span className="text-slate-700 font-medium">Trận đấu thường</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded bg-gradient-to-br from-yellow-500 to-yellow-600 border-2 border-yellow-400"></div>
                    <span className="text-slate-700 font-medium">Chung kết</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded bg-gradient-to-br from-orange-500 to-orange-600 border-2 border-orange-400"></div>
                    <span className="text-slate-700 font-medium">Tranh hạng 3</span>
                </div>
            </div>
        </div>
    );
};