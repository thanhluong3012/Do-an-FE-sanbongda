import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tournament, tournamentService } from '@/services/tournamentService';
import { TournamentStatusBadge, TournamentFormatBadge } from '@/components/Tournament/TournamentStatusBadge';
import { useToast } from '@/hooks/use-toast';
import { Trophy, Plus, Loader2, AlertCircle, RefreshCw, Calendar, Users, MapPin, Megaphone } from 'lucide-react';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';

const MyTournaments = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [publishingId, setPublishingId] = useState<number | null>(null);

  useEffect(() => {
    loadMyTournaments();
  }, []);

  const loadMyTournaments = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await tournamentService.getMyTournaments();
      setTournaments(Array.isArray(data) ? data : []);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Không thể tải danh sách giải đấu. Vui lòng thử lại sau.');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePublish = async (tournament: Tournament) => {
    setPublishingId(tournament.id);
    try {
      await tournamentService.publish(tournament.id);
      toast({
        title: 'Thành công',
        description: `Giải đấu "${tournament.name}" đã mở đăng ký!`,
      });
      await loadMyTournaments();
    } catch (err: any) {
      toast({
        title: 'Lỗi',
        description: err.response?.data?.message || 'Không thể mở đăng ký giải đấu',
        variant: 'destructive',
      });
    } finally {
      setPublishingId(null);
    }
  };

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'dd/MM/yyyy', { locale: vi });
    } catch {
      return dateString;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8 mt-20">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-4xl font-bold mb-2">Giải đấu của tôi</h1>
            <p className="text-muted-foreground">Quản lý các giải đấu bạn đã tạo</p>
          </div>
          <Button asChild className="gap-2">
            <Link to="/tournament/create">
              <Plus className="w-4 h-4" />
              Tạo giải đấu mới
            </Link>
          </Button>
        </div>

        {/* Loading */}
        {isLoading && (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        )}

        {/* Error */}
        {!isLoading && error && (
          <Card className="p-12">
            <div className="text-center">
              <AlertCircle className="w-16 h-16 text-destructive mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Lỗi tải dữ liệu</h3>
              <p className="text-muted-foreground mb-4">{error}</p>
              <Button onClick={loadMyTournaments} variant="outline" className="gap-2">
                <RefreshCw className="w-4 h-4" />
                Thử lại
              </Button>
            </div>
          </Card>
        )}

        {/* Empty */}
        {!isLoading && !error && tournaments.length === 0 && (
          <Card className="p-12">
            <div className="text-center">
              <Trophy className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Chưa có giải đấu nào</h3>
              <p className="text-muted-foreground mb-4">Hãy tạo giải đấu đầu tiên của bạn!</p>
              <Button asChild>
                <Link to="/tournament/create">
                  <Plus className="w-4 h-4 mr-2" />
                  Tạo giải đấu mới
                </Link>
              </Button>
            </div>
          </Card>
        )}

        {/* Tournament list */}
        {!isLoading && !error && tournaments.length > 0 && (
          <div className="space-y-4">
            {tournaments.map((tournament) => (
              <Card key={tournament.id} className="hover:shadow-md transition-shadow">
                <CardContent className="pt-6">
                  <div className="flex flex-col md:flex-row justify-between gap-4">
                    {/* Left: Info */}
                    <div className="flex-1 space-y-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="text-xl font-bold">{tournament.name}</h2>
                        <TournamentStatusBadge status={tournament.status} />
                        <TournamentFormatBadge format={tournament.format} />
                      </div>

                      {tournament.description && (
                        <p className="text-muted-foreground text-sm line-clamp-2">
                          {tournament.description}
                        </p>
                      )}

                      <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                        {tournament.field_cluster && (
                          <span className="flex items-center gap-1">
                            <MapPin className="w-4 h-4" />
                            {tournament.field_cluster.name}
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <Users className="w-4 h-4" />
                          {tournament.registered_teams_count ?? 0} / {tournament.max_teams} đội
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          {formatDate(tournament.start_date)} – {formatDate(tournament.end_date)}
                        </span>
                      </div>

                      {tournament.status === 'draft' && (
                        <p className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded px-2 py-1 inline-block">
                          ⚠️ Giải đang ở trạng thái nháp, chưa hiển thị công khai
                        </p>
                      )}
                    </div>

                    {/* Right: Actions */}
                    <div className="flex flex-col gap-2 min-w-[160px]">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigate(`/tournament/${tournament.id}`)}
                        className="w-full"
                      >
                        Xem chi tiết
                      </Button>

                      {tournament.status === 'draft' && (
                        <Button
                          size="sm"
                          className="w-full gap-2"
                          onClick={() => handlePublish(tournament)}
                          disabled={publishingId === tournament.id}
                        >
                          {publishingId === tournament.id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Megaphone className="w-4 h-4" />
                          )}
                          Mở đăng ký
                        </Button>
                      )}

                      {tournament.status === 'open' && (
                        <Button
                          variant="secondary"
                          size="sm"
                          className="w-full"
                          onClick={() => navigate(`/tournament/${tournament.id}?tab=registrations`)}
                        >
                          <Users className="w-4 h-4 mr-2" />
                          Duyệt đăng ký ({tournament.registered_teams_count ?? 0})
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default MyTournaments;
