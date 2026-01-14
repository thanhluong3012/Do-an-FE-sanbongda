import { Calendar, MapPin, Users, Trophy, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const matches = [
  {
    id: 1,
    teamA: "FC Thống Nhất",
    teamB: "Phú Thọ Warriors",
    date: "10/01/2026",
    time: "18:00",
    location: "Sân Thống Nhất",
    status: "upcoming",
    type: "Giao hữu",
  },
  {
    id: 2,
    teamA: "Tân Bình FC",
    teamB: "Quận 7 United",
    date: "11/01/2026",
    time: "19:30",
    location: "Sân Mỹ Đình Mini",
    status: "upcoming",
    type: "Giải đấu",
  },
  {
    id: 3,
    teamA: "Saigon Stars",
    teamB: "District 3 FC",
    date: "12/01/2026",
    time: "17:00",
    location: "Sân Phú Thọ",
    status: "upcoming",
    type: "Giao hữu",
  },
];

const MatchesSection = () => {
  return (
    <section id="matches" className="py-20 bg-secondary text-secondary-foreground">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-accent/20 rounded-full mb-4">
            <Trophy className="text-accent" size={18} />
            <span className="text-accent font-medium">Lịch thi đấu</span>
          </div>
          <h2 className="font-display text-3xl md:text-4xl font-bold mb-4">
            Các trận đấu <span className="text-accent">sắp diễn ra</span>
          </h2>
          <p className="text-secondary-foreground/70 max-w-2xl mx-auto">
            Theo dõi lịch thi đấu và không bỏ lỡ những trận cầu hấp dẫn
          </p>
        </div>

        {/* Matches List */}
        <div className="max-w-4xl mx-auto space-y-4">
          {matches.map((match, index) => (
            <Card
              key={match.id}
              variant="glass"
              className="overflow-hidden animate-fade-in bg-secondary-foreground/5 border-secondary-foreground/10"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <CardContent className="p-0">
                <div className="flex flex-col md:flex-row md:items-center">
                  {/* Date Column */}
                  <div className="bg-accent/20 p-4 md:p-6 text-center md:w-32">
                    <div className="text-accent text-sm font-medium">
                      {match.time}
                    </div>
                    <div className="text-secondary-foreground font-bold text-lg">
                      {match.date}
                    </div>
                  </div>

                  {/* Match Info */}
                  <div className="flex-1 p-4 md:p-6">
                    <div className="flex flex-col md:flex-row md:items-center gap-4">
                      {/* Teams */}
                      <div className="flex-1">
                        <div className="flex items-center gap-4 justify-center md:justify-start">
                          <div className="text-right flex-1">
                            <span className="font-bold text-lg">
                              {match.teamA}
                            </span>
                          </div>
                          <div className="w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center">
                            <span className="font-bold text-accent">VS</span>
                          </div>
                          <div className="text-left flex-1">
                            <span className="font-bold text-lg">
                              {match.teamB}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-4 mt-3 justify-center md:justify-start text-sm text-secondary-foreground/70">
                          <div className="flex items-center gap-1">
                            <MapPin size={14} />
                            <span>{match.location}</span>
                          </div>
                          <Badge
                            variant="outline"
                            className="border-accent/30 text-accent"
                          >
                            {match.type}
                          </Badge>
                        </div>
                      </div>

                      {/* Action */}
                      <Button
                        variant="glass"
                        className="bg-secondary-foreground/10 hover:bg-secondary-foreground/20 text-secondary-foreground"
                      >
                        Chi tiết
                        <ArrowRight size={16} />
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* CTA */}
        <div className="text-center mt-12">
          <Button variant="hero" size="lg">
            <Calendar size={20} />
            Xem toàn bộ lịch thi đấu
          </Button>
        </div>
      </div>
    </section>
  );
};

export default MatchesSection;
