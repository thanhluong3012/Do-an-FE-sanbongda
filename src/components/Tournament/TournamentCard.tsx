import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tournament } from '@/services/tournamentService';
import { TournamentStatusBadge, TournamentFormatBadge } from './TournamentStatusBadge';
import { Trophy, MapPin, Users, Calendar, Trash2, Edit, Eye } from 'lucide-react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';

interface TournamentCardProps {
  tournament: Tournament;
  onDelete?: (id: number) => void;
  onEdit?: (tournament: Tournament) => void;
  showActions?: boolean;
  isManager?: boolean;
}

export const TournamentCard = ({ tournament, onDelete, onEdit, showActions = false, isManager = false }: TournamentCardProps) => {
  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'dd/MM/yyyy', { locale: vi });
    } catch {
      return dateString;
    }
  };

  const getTeamsProgress = () => {
    const registered = tournament.registered_teams_count || 0;
    const max = tournament.max_teams;
    const percentage = (registered / max) * 100;

    return { registered, max, percentage };
  };

  const teamsProgress = getTeamsProgress();

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader>
        <div className="flex items-start justify-between mb-2">
          <Trophy className="w-8 h-8 text-primary" />
          <div className="flex flex-wrap gap-2 justify-end">
            <TournamentStatusBadge status={tournament.status} />
            <TournamentFormatBadge format={tournament.format} />
            {/* Badge phân loại tham gia */}
            {tournament.participation_type && (
              <Badge variant="outline" className={
                tournament.participation_type === 'organizer'
                  ? 'bg-blue-50 text-blue-700 border-blue-200'
                  : tournament.participation_type === 'participant'
                    ? 'bg-green-50 text-green-700 border-green-200'
                    : 'bg-purple-50 text-purple-700 border-purple-200'
              }>
                {tournament.participation_type === 'organizer' && '🎯 Tổ chức'}
                {tournament.participation_type === 'participant' && '⚽ Tham gia'}
                {tournament.participation_type === 'both' && '👑 Tổ chức & Tham gia'}
              </Badge>
            )}
          </div>
        </div>
        <CardTitle className="text-xl line-clamp-2">{tournament.name}</CardTitle>
        {tournament.description && (
          <CardDescription className="line-clamp-2">
            {tournament.description}
          </CardDescription>
        )}
      </CardHeader>
      <CardContent className="space-y-3">
        {tournament.field_cluster && (
          <div className="flex items-start gap-2 text-sm">
            <MapPin className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-medium">{tournament.field_cluster.name}</p>
              {tournament.field_cluster.address && (
                <p className="text-muted-foreground">{tournament.field_cluster.address}</p>
              )}
            </div>
          </div>
        )}

        <div className="flex items-center gap-2 text-sm">
          <Users className="w-4 h-4 text-muted-foreground" />
          <div className="flex-1">
            <div className="flex justify-between items-center mb-1">
              <span>
                {teamsProgress.registered}/{teamsProgress.max} đội
              </span>
              <span className="text-xs text-muted-foreground">
                {Math.round(teamsProgress.percentage)}%
              </span>
            </div>
            <div className="h-2 bg-secondary rounded-full overflow-hidden">
              <div
                className="h-full bg-primary transition-all"
                style={{ width: `${teamsProgress.percentage}%` }}
              />
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 text-sm">
          <Calendar className="w-4 h-4 text-muted-foreground" />
          <span>
            {formatDate(tournament.start_date)} - {formatDate(tournament.end_date)}
          </span>
        </div>

        {tournament.registration_start && tournament.registration_end && (
          <div className="text-xs text-green-500 text-muted-foreground bg-white p-2 rounded">
            Đăng ký: {formatDate(tournament.registration_start)} - {formatDate(tournament.registration_end)}
          </div>
        )}
      </CardContent>
      <CardFooter className="flex gap-2">
        <Button className="flex-1" asChild>
          <Link to={`/tournament/${tournament.id}`}>
            <Eye className="w-4 h-4 mr-2" />
            Xem chi tiết
          </Link>
        </Button>
        {showActions && isManager && (
          <>
            {onEdit && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onEdit(tournament)}
              >
                <Edit className="w-4 h-4" />
              </Button>
            )}
            {onDelete && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onDelete(tournament.id)}
              >
                <Trash2 className="w-4 h-4 text-destructive" />
              </Button>
            )}
          </>
        )}
      </CardFooter>
    </Card>
  );
};
