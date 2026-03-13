import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Match } from '@/services/matchService';
import { Calendar, MapPin, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';

interface MatchCardProps {
  match: Match;
  onClick?: (match: Match) => void;
}

export const MatchCard = ({ match, onClick }: MatchCardProps) => {
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getStatusBadge = (status: Match['status']) => {
    switch (status) {
      case 'scheduled':
        return <Badge variant="outline">Chưa đá</Badge>;
      case 'in_progress':
        return <Badge className="bg-green-500">Đang diễn ra</Badge>;
      case 'completed':
        return <Badge>Đã kết thúc</Badge>;
      case 'cancelled':
        return <Badge variant="destructive">Đã hủy</Badge>;
    }
  };

  const isCompleted = match.status === 'completed';
  const homeWin = isCompleted && match.home_score! > match.away_score!;
  const awayWin = isCompleted && match.away_score! > match.home_score!;

  return (
    <Card 
      className={`hover:shadow-lg transition-shadow ${onClick ? 'cursor-pointer' : ''}`}
      onClick={() => onClick?.(match)}
    >
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            {match.round?.name || 'N/A'}
          </div>
          {getStatusBadge(match.status)}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Teams and Score */}
        <div className="space-y-3">
          {/* Home Team */}
          <div className={`flex items-center justify-between p-3 rounded-lg ${homeWin ? 'bg-green-50' : 'bg-secondary/30'}`}>
            <div className="flex items-center gap-3 flex-1">
              <Avatar className="w-10 h-10">
                <AvatarImage src={match.home_team?.logo} alt={match.home_team?.name} />
                <AvatarFallback>
                  {match.home_team?.name ? getInitials(match.home_team.name) : 'H'}
                </AvatarFallback>
              </Avatar>
              <span className={`font-medium ${homeWin ? 'font-bold' : ''}`}>
                {match.home_team?.name || 'N/A'}
              </span>
            </div>
            {isCompleted && (
              <span className={`text-2xl font-bold ${homeWin ? 'text-green-700' : ''}`}>
                {match.home_score}
              </span>
            )}
          </div>

          {/* VS Divider */}
          <div className="text-center text-xs text-muted-foreground font-medium">
            VS
          </div>

          {/* Away Team */}
          <div className={`flex items-center justify-between p-3 rounded-lg ${awayWin ? 'bg-green-50' : 'bg-secondary/30'}`}>
            <div className="flex items-center gap-3 flex-1">
              <Avatar className="w-10 h-10">
                <AvatarImage src={match.away_team?.logo} alt={match.away_team?.name} />
                <AvatarFallback>
                  {match.away_team?.name ? getInitials(match.away_team.name) : 'A'}
                </AvatarFallback>
              </Avatar>
              <span className={`font-medium ${awayWin ? 'font-bold' : ''}`}>
                {match.away_team?.name || 'N/A'}
              </span>
            </div>
            {isCompleted && (
              <span className={`text-2xl font-bold ${awayWin ? 'text-green-700' : ''}`}>
                {match.away_score}
              </span>
            )}
          </div>
        </div>

        {/* Match Info */}
        <div className="space-y-2 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            <span>
              {format(new Date(match.scheduled_time), 'dd/MM/yyyy', { locale: vi })}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4" />
            <span>
              {format(new Date(match.scheduled_time), 'HH:mm', { locale: vi })}
            </span>
          </div>
          {match.field && (
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              <span>{match.field.name}</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
