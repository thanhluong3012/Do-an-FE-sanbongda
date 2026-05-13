import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Calendar, Clock, MapPin, Edit3 } from 'lucide-react';
import { format as fmtDate, parseISO } from 'date-fns';
import { vi } from 'date-fns/locale';
import { Match } from '@/services/matchService';

const STATUS_CONFIG: Record<
    string,
    {
        label: string;
        shortLabel: string;
        cardCls: string;
        badgeCls: string;
        dotCls: string;
    }
> = {
    scheduled: {
        label: 'Chưa thi đấu',
        shortLabel: 'Sắp diễn ra',
        cardCls: 'border-slate-200 bg-white',
        badgeCls: 'bg-slate-100 text-slate-600 border-slate-200',
        dotCls: 'bg-slate-400',
    },
    in_progress: {
        label: 'Đang thi đấu',
        shortLabel: 'LIVE',
        cardCls: 'border-emerald-300 bg-gradient-to-br from-emerald-50 via-white to-white shadow-sm',
        badgeCls: 'bg-red-500 text-white border-red-500',
        dotCls: 'bg-red-500 animate-pulse',
    },
    completed: {
        label: 'Kết thúc',
        shortLabel: 'FT',
        cardCls: 'border-blue-200 bg-white',
        badgeCls: 'bg-blue-50 text-blue-700 border-blue-200',
        dotCls: 'bg-blue-500',
    },
    cancelled: {
        label: 'Đã hủy',
        shortLabel: 'Hủy',
        cardCls: 'border-red-200 bg-red-50/40 opacity-70',
        badgeCls: 'bg-red-50 text-red-600 border-red-200',
        dotCls: 'bg-red-400',
    },
};

const initials = (name: string) =>
    name
        .split(' ')
        .filter(Boolean)
        .map((w) => w[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);

const fmtMatchDate = (d: string | null | undefined) => {
    if (!d) return 'Chưa định ngày';

    try {
        return fmtDate(parseISO(d), 'EEE, dd/MM/yyyy', { locale: vi });
    } catch {
        return d;
    }
};

const fmtTime = (t: string | null | undefined) => {
    if (!t) return 'Chưa có giờ';
    return t.length > 5 ? t.slice(0, 5) : t;
};

interface MatchCardProps {
    match: Match;
    highlightTeamId?: number;
    onEditScore?: (m: Match) => void;
    onEditField?: (m: Match) => void;
    onEditSchedule?: (m: Match) => void;
    canManage?: boolean;
    compact?: boolean;
}

export const MatchCard = ({
    match,
    highlightTeamId,
    onEditScore,
    onEditField,
    onEditSchedule,
    canManage,
    compact = false,
}: MatchCardProps) => {
    const status = STATUS_CONFIG[match.status] ?? STATUS_CONFIG.scheduled;

    const done = match.status === 'completed';
    const live = match.status === 'in_progress';

    const homeId = match.home_team_id ?? match.home_team?.id;
    const awayId = match.away_team_id ?? match.away_team?.id;

    const homeName = match.home_team?.name || match.home_from_position || 'Đội nhà';
    const awayName = match.away_team?.name || match.away_from_position || 'Đội khách';

    const homeLogo = match.home_team?.logo;
    const awayLogo = match.away_team?.logo;

    const homeScore = match.home_score ?? null;
    const awayScore = match.away_score ?? null;

    const homeWin = done && (homeScore ?? 0) > (awayScore ?? 0);
    const awayWin = done && (awayScore ?? 0) > (homeScore ?? 0);

    const isDraw = done && homeScore === awayScore;

    const isMyMatch =
        !!highlightTeamId && (homeId === highlightTeamId || awayId === highlightTeamId);

    const fieldName = match.field?.name;
    const clusterName = match.field?.field_cluster?.name;
    const address = match.field?.field_cluster?.address;

    return (
        <div
            className={`
                group overflow-hidden rounded-2xl border transition-all duration-200
                hover:-translate-y-0.5 hover:shadow-lg
                ${isMyMatch ? 'border-primary bg-primary/5 ring-2 ring-primary/15' : status.cardCls}
            `}
        >
            {/* Top status */}
            <div className="flex items-center justify-between border-b bg-slate-50/70 px-4 py-2.5">
                <div className="flex min-w-0 items-center gap-2">
                    <span className={`h-2 w-2 rounded-full ${status.dotCls}`} />

                    <span className="truncate text-xs font-semibold uppercase tracking-wide text-slate-600">
                        {status.label}
                    </span>

                    {match.match_number && (
                        <Badge
                            variant="outline"
                            className="h-5 rounded-full px-2 text-[11px] font-semibold"
                        >
                            Trận #{match.match_number}
                        </Badge>
                    )}
                </div>

                <Badge
                    variant="outline"
                    className={`
                        h-6 rounded-full px-2.5 text-[11px] font-bold uppercase tracking-wide
                        ${status.badgeCls}
                        ${live ? 'animate-pulse' : ''}
                    `}
                >
                    {status.shortLabel}
                </Badge>
            </div>

            {/* Main scoreboard */}
            <div className={`${compact ? 'px-3 py-4' : 'px-4 py-5'}`}>
                <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
                    {/* Home team */}
                    <div
                        className={`
                            flex min-w-0 flex-col items-center rounded-xl px-2 py-3 text-center
                            ${homeWin ? 'bg-emerald-50 ring-1 ring-emerald-200' : ''}
                            ${highlightTeamId === homeId ? 'bg-primary/10 ring-1 ring-primary/20' : ''}
                        `}
                    >
                        <Avatar
                            className={`
                                mb-2 h-12 w-12 border bg-white shadow-sm
                                ${homeWin ? 'ring-2 ring-emerald-400' : ''}
                            `}
                        >
                            {homeLogo ? <AvatarImage src={homeLogo} /> : null}
                            <AvatarFallback className="text-sm font-bold">
                                {initials(homeName)}
                            </AvatarFallback>
                        </Avatar>

                        <div
                            className={`
                                max-w-full truncate text-sm font-bold leading-5
                                ${homeWin ? 'text-emerald-700' : 'text-slate-800'}
                            `}
                        >
                            {homeName}
                        </div>

                        <div className="mt-1 h-5">
                            {highlightTeamId === homeId && (
                                <Badge className="h-5 rounded-full px-2 text-[10px]">
                                    Đội của tôi
                                </Badge>
                            )}

                            {homeWin && (
                                <Badge className="h-5 rounded-full bg-emerald-600 px-2 text-[10px] text-white">
                                    Thắng
                                </Badge>
                            )}
                        </div>
                    </div>

                    {/* Score center */}
                    <div className="flex flex-col items-center justify-center">
                        <div className="flex items-center gap-2">
                            <div
                                className={`
                                    min-w-[42px] text-center text-4xl font-black tabular-nums leading-none
                                    ${homeWin ? 'text-emerald-600' : 'text-slate-900'}
                                    ${done && !homeWin && !isDraw ? 'text-slate-400' : ''}
                                `}
                            >
                                {homeScore ?? '–'}
                            </div>

                            <div className="mb-1 text-2xl font-bold text-slate-300">-</div>

                            <div
                                className={`
                                    min-w-[42px] text-center text-4xl font-black tabular-nums leading-none
                                    ${awayWin ? 'text-emerald-600' : 'text-slate-900'}
                                    ${done && !awayWin && !isDraw ? 'text-slate-400' : ''}
                                `}
                            >
                                {awayScore ?? '–'}
                            </div>
                        </div>

                        <div className="mt-2 rounded-full bg-slate-100 px-3 py-1 text-[11px] font-semibold text-slate-500">
                            {live ? 'Đang diễn ra' : done ? 'Tỉ số chính thức' : 'Chưa có tỉ số'}
                        </div>
                    </div>

                    {/* Away team */}
                    <div
                        className={`
                            flex min-w-0 flex-col items-center rounded-xl px-2 py-3 text-center
                            ${awayWin ? 'bg-emerald-50 ring-1 ring-emerald-200' : ''}
                            ${highlightTeamId === awayId ? 'bg-primary/10 ring-1 ring-primary/20' : ''}
                        `}
                    >
                        <Avatar
                            className={`
                                mb-2 h-12 w-12 border bg-white shadow-sm
                                ${awayWin ? 'ring-2 ring-emerald-400' : ''}
                            `}
                        >
                            {awayLogo ? <AvatarImage src={awayLogo} /> : null}
                            <AvatarFallback className="text-sm font-bold">
                                {initials(awayName)}
                            </AvatarFallback>
                        </Avatar>

                        <div
                            className={`
                                max-w-full truncate text-sm font-bold leading-5
                                ${awayWin ? 'text-emerald-700' : 'text-slate-800'}
                            `}
                        >
                            {awayName}
                        </div>

                        <div className="mt-1 h-5">
                            {highlightTeamId === awayId && (
                                <Badge className="h-5 rounded-full px-2 text-[10px]">
                                    Đội của tôi
                                </Badge>
                            )}

                            {awayWin && (
                                <Badge className="h-5 rounded-full bg-emerald-600 px-2 text-[10px] text-white">
                                    Thắng
                                </Badge>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Match meta */}
            <div className="border-t bg-slate-50/60 px-4 py-3">
                <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-xs font-medium text-slate-600">
                    <div className="flex items-center gap-1.5">
                        <Calendar className="h-3.5 w-3.5 text-primary" />
                        <span>{fmtMatchDate(match.match_date)}</span>
                    </div>

                    <div className="flex items-center gap-1.5">
                        <Clock className="h-3.5 w-3.5 text-primary" />
                        <span>{fmtTime(match.match_time)}</span>
                    </div>

                    {(fieldName || clusterName) && (
                        <div className="flex items-center gap-1.5">
                            <MapPin className="h-3.5 w-3.5 text-red-500" />
                            <span className="max-w-[220px] truncate">
                                {clusterName || 'Cụm sân'} {fieldName ? `- ${fieldName}` : ''}
                            </span>
                        </div>
                    )}
                </div>

                {address && (
                    <div className="mt-2 line-clamp-1 text-center text-[11px] text-slate-400">
                        {address}
                    </div>
                )}
            </div>

            {/* Actions */}
            {canManage && match.status !== 'cancelled' && (
                <div className="flex flex-wrap items-center justify-center gap-2 border-t bg-white px-4 py-3">
                    <Button
                        variant="outline"
                        size="sm"
                        className="h-8 rounded-full px-3 text-xs font-semibold"
                        onClick={(e) => {
                            e.stopPropagation();
                            onEditScore?.(match);
                        }}
                    >
                        <Edit3 className="mr-1.5 h-3.5 w-3.5" />
                        {match.status === 'completed' ? 'Sửa tỷ số' : 'Nhập tỷ số'}
                    </Button>

                    {match.status !== 'completed' && (
                        <>
                            <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 rounded-full px-3 text-xs font-semibold text-slate-600 hover:text-blue-600"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onEditField?.(match);
                                }}
                            >
                                <MapPin className="mr-1.5 h-3.5 w-3.5" />
                                Đổi sân
                            </Button>

                            <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 rounded-full px-3 text-xs font-semibold text-slate-600 hover:text-orange-600"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onEditSchedule?.(match);
                                }}
                            >
                                <Clock className="mr-1.5 h-3.5 w-3.5" />
                                Đổi giờ
                            </Button>
                        </>
                    )}
                </div>
            )}
        </div>
    );
};