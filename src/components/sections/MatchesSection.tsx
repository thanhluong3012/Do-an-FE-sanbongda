import { useState, useEffect } from "react";
import { Calendar, MapPin, Trophy, ArrowRight, Loader2, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import { Tournament, tournamentService } from "@/services/tournamentService";
import { TournamentStatusBadge, TournamentFormatBadge } from "@/components/Tournament/TournamentStatusBadge";
import { format } from "date-fns";
import { vi } from "date-fns/locale";

const formatDate = (d: string) => {
  try { return format(new Date(d), "dd/MM/yyyy", { locale: vi }); }
  catch { return d; }
};

const MatchesSection = () => {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    tournamentService.getMyTournaments()
      .then((data) => {
        const list = Array.isArray(data) ? data : [];
        const visible = list
          .filter((t) => t.status !== "draft")
          .slice(0, 3);
        setTournaments(visible);
      })
      .catch(() => setTournaments([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <section id="matches" className="py-20 bg-secondary text-secondary-foreground">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-accent/20 rounded-full mb-4">
            <Trophy className="text-accent" size={18} />
            <span className="text-accent font-medium">Giải đấu</span>
          </div>
          <h2 className="font-display text-3xl md:text-4xl font-bold mb-4">
            Giải đấu <span className="text-accent">đang diễn ra</span>
          </h2>
          <p className="text-secondary-foreground/70 max-w-2xl mx-auto">
            Khám phá và đăng ký tham gia các giải đấu bóng đá hấp dẫn
          </p>
        </div>

        {/* List */}
        <div className="max-w-4xl mx-auto space-y-4">
          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-accent" />
            </div>
          ) : tournaments.length === 0 ? (
            <Card className="bg-secondary-foreground/5 border-secondary-foreground/10">
              <CardContent className="py-12 text-center text-secondary-foreground/60">
                <Trophy className="w-10 h-10 mx-auto mb-3 opacity-40" />
                <p>Hiện chưa có giải đấu nào. Vui lòng quay lại sau.</p>
              </CardContent>
            </Card>
          ) : (
            tournaments.map((tournament, index) => (
              <Link to={`/tournaments/${tournament.id}`} key={tournament.id}>
                <Card
                  variant="glass"
                  className="overflow-hidden animate-fade-in bg-secondary-foreground/5 border-secondary-foreground/10 hover:bg-secondary-foreground/10 transition-colors cursor-pointer"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <CardContent className="p-0">
                    <div className="flex flex-col md:flex-row md:items-center">
                      {/* Date Column */}
                      <div className="bg-accent/20 p-4 md:p-6 text-center md:w-36 shrink-0">
                        <div className="text-accent text-xs font-medium mb-1">Bắt đầu</div>
                        <div className="text-secondary-foreground font-bold text-base leading-tight">
                          {formatDate(tournament.start_date)}
                        </div>
                        <div className="text-secondary-foreground/60 text-xs mt-1">
                          → {formatDate(tournament.end_date)}
                        </div>
                      </div>

                      {/* Tournament Info */}
                      <div className="flex-1 p-4 md:p-6">
                        <div className="flex flex-col md:flex-row md:items-center gap-4">
                          <div className="flex-1">
                            <div className="flex flex-wrap items-center gap-2 mb-2">
                              <TournamentStatusBadge status={tournament.status} />
                              <TournamentFormatBadge format={tournament.format} />
                            </div>
                            <h3 className="font-bold text-lg text-secondary-foreground mb-2 line-clamp-1">
                              {tournament.name}
                            </h3>
                            <div className="flex flex-wrap items-center gap-4 text-sm text-secondary-foreground/70">
                              {tournament.field_cluster && (
                                <div className="flex items-center gap-1">
                                  <MapPin size={13} />
                                  <span>{tournament.field_cluster.name}</span>
                                </div>
                              )}
                              <div className="flex items-center gap-1">
                                <Users size={13} />
                                <span>
                                  {tournament.approved_teams_count ?? tournament.registered_teams_count ?? 0}/{tournament.max_teams} đội
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Action */}
                          <Button
                            variant="glass"
                            className="bg-secondary-foreground/10 hover:bg-secondary-foreground/20 text-secondary-foreground shrink-0"
                          >
                            Xem chi tiết
                            <ArrowRight size={16} />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))
          )}
        </div>

        {/* CTA */}
        <div className="text-center mt-12">
          <Button variant="hero" size="lg" asChild>
            <Link to="/tournaments" className="gap-2">
              <Calendar size={20} />
              Xem tất cả giải đấu
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
};

export default MatchesSection;
