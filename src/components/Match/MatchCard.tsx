import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Match } from '@/services/matchService';
import { Calendar, MapPin, ChevronRight } from 'lucide-react';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';

interface MatchCardProps {
  match: Match;
  onClick?: (match: Match) => void;
}

export const MatchCard = ({ match, onClick }: MatchCardProps) => {
  const getInitials = (name: string) => {
    return name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || '??';
  };

  const getStatusBadge = (status: Match['status']) => {
    switch (status) {
      case 'scheduled':
        return <Badge variant="secondary" className="font-medium">Sắp đá</Badge>;
      case 'in_progress':
        return (
          <Badge className="bg-red-500 hover:bg-red-600 animate-pulse text-white border-none">
            Trực tiếp
          </Badge>
        );
      case 'completed':
        return <Badge variant="outline" className="bg-slate-100">Kết thúc</Badge>;
      case 'cancelled':
        return <Badge variant="destructive">Đã hủy</Badge>;
      default:
        return null;
    }
  };

  const isCompleted = match.status === 'completed';
  const isInProgress = match.status === 'in_progress';
  const showScore = isCompleted || isInProgress;

  return (
    <Card
      className={`group overflow-hidden transition-all duration-300 hover:border-primary/50 hover:shadow-md ${onClick ? 'cursor-pointer active:scale-[0.98]' : ''
        }`}
      onClick={() => onClick?.(match)}
    >
      <CardContent className="p-0">
        {/* Header: Giải đấu & Trạng thái */}
        <div className="flex items-center justify-between px-4 py-2 bg-muted/30 border-b">
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            {match.round?.name || 'Giao hữu'}
          </span>
          {getStatusBadge(match.status)}
        </div>

        {/* Main Content: Bố cục chiều ngang */}
        <div className="flex items-center justify-between p-4 md:p-6 gap-4">

          {/* Home Team */}
          <div className="flex flex-col items-center flex-1 text-center gap-2">
            <Avatar className="w-12 h-12 md:w-16 md:h-16 border-2 border-background shadow-sm">
              <AvatarImage src={match.home_team?.logo} alt={match.home_team?.name} />
              <AvatarFallback className="bg-blue-100 text-blue-700 font-bold text-lg">
                {getInitials(match.home_team?.name || '')}
              </AvatarFallback>
            </Avatar>
            <span className={`text-sm md:text-base font-semibold line-clamp-1 ${isCompleted && match.home_score! > match.away_score! ? 'text-primary' : 'text-foreground'
              }`}>
              {match.home_team?.name}
            </span>
          </div>

          {/* Score / VS Center Section */}
          <div className="flex flex-col items-center justify-center min-w-[80px] md:min-w-[120px]">
            {showScore ? (
              <div className="flex items-center gap-3">
                <span className={`text-2xl md:text-4xl font-black tabular-nums ${isCompleted && match.home_score! > match.away_score! ? 'text-foreground' : 'text-muted-foreground'
                  }`}>
                  {match.home_score}
                </span>
                <span className="text-muted-foreground font-light text-xl">-</span>
                <span className={`text-2xl md:text-4xl font-black tabular-nums ${isCompleted && match.away_score! > match.home_score! ? 'text-foreground' : 'text-muted-foreground'
                  }`}>
                  {match.away_score}
                </span>
              </div>
            ) : (
              <div className="px-3 py-1 rounded bg-secondary text-secondary-foreground font-bold text-sm">
                {match.match_time?.substring(0, 5) || 'VS'}
              </div>
            )}

            {isInProgress && (
              <span className="text-[10px] font-bold text-red-500 mt-1">PHÚT 80'</span>
            )}
          </div>

          {/* Away Team */}
          <div className="flex flex-col items-center flex-1 text-center gap-2">
            <Avatar className="w-12 h-12 md:w-16 md:h-16 border-2 border-background shadow-sm">
              <AvatarImage src={match.away_team?.logo} alt={match.away_team?.name} />
              <AvatarFallback className="bg-orange-100 text-orange-700 font-bold text-lg">
                {getInitials(match.away_team?.name || '')}
              </AvatarFallback>
            </Avatar>
            <span className={`text-sm md:text-base font-semibold line-clamp-1 ${isCompleted && match.away_score! > match.home_score! ? 'text-primary' : 'text-foreground'
              }`}>
              {match.away_team?.name}
            </span>
          </div>

          {/* Nút giả lập hoặc Icon chỉ dẫn */}
          {onClick && (
            <div className="hidden md:flex items-center justify-center pl-2">
              <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
            </div>
          )}
        </div>

        {/* Footer: Địa điểm & Thời gian */}
        <div className="px-4 py-3 bg-muted/10 border-t flex flex-wrap items-center justify-center gap-x-6 gap-y-1 text-xs text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5" />
            <span>
              {match.match_date ? format(new Date(match.match_date), 'EEEE, dd/MM/yyyy', { locale: vi }) : 'Chưa định ngày'}
            </span>
          </div>
          {match.field && (
            <div className="flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5" />
              <span className="max-w-[150px] truncate">{match.field.name}</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};