import { useState, useEffect } from "react";
import { MapPin, Clock, Users, Loader2, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import { fieldComplexService, FieldComplex } from "@/services/fieldComplexService";

const getFieldTypes = (complex: FieldComplex): string => {
  if (!complex.fields || complex.fields.length === 0) return "Đa loại";
  const types = [...new Set(complex.fields.map((f) => f.field_type))];
  return types.map((t) => t.replace("v", "v")).join(", ");
};

const getMinPrice = (complex: FieldComplex): string => {
  if (!complex.hourly_prices || complex.hourly_prices.length === 0) return "Liên hệ";
  const prices = complex.hourly_prices.map((p: any) => Number(p.price_hour)).filter((p) => p > 0);
  if (prices.length === 0) return "Liên hệ";
  const min = Math.min(...prices);
  return new Intl.NumberFormat("vi-VN").format(min);
};

const FieldsSection = () => {
  const [complexes, setComplexes] = useState<FieldComplex[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fieldComplexService.getAll()
      .then((data) => setComplexes(Array.isArray(data) ? data.slice(0, 4) : []))
      .catch(() => setComplexes([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <section id="fields" className="py-20 bg-muted/30">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="text-center mb-12">
          <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-4">
            Cụm sân bóng <span className="text-primary">nổi bật</span>
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Khám phá những cụm sân bóng chất lượng cao với đầy đủ tiện nghi trên hệ thống
          </p>
        </div>

        {/* Fields Grid */}
        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="w-10 h-10 animate-spin text-primary" />
          </div>
        ) : complexes.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            <p>Chưa có cụm sân nào. Vui lòng quay lại sau.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {complexes.map((complex, index) => (
              <Link to={`/fields/${complex.id}`} key={complex.id}>
                <Card
                  variant="field"
                  className="group animate-fade-in cursor-pointer hover:shadow-xl transition-shadow h-full flex flex-col"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  {/* Image */}
                  <div className="relative h-48 overflow-hidden rounded-t-lg">
                    <img
                      src={complex.image || `https://placehold.co/600x400/1a1a2e/ffffff?text=${encodeURIComponent(complex.name)}`}
                      alt={complex.name}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = `https://placehold.co/600x400/1a1a2e/ffffff?text=${encodeURIComponent(complex.name)}`;
                      }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                    <div className="absolute top-3 left-3">
                      <Badge variant="secondary" className="bg-black/60 text-white backdrop-blur-sm">
                        {getFieldTypes(complex)}
                      </Badge>
                    </div>
                    {complex.fields && complex.fields.length > 0 && (
                      <div className="absolute top-3 right-3">
                        <Badge className="bg-green-600 text-white">
                          {complex.fields.length} sân
                        </Badge>
                      </div>
                    )}
                  </div>

                  <CardHeader className="pb-2 flex-1">
                    <CardTitle className="text-lg group-hover:text-primary transition-colors line-clamp-1">
                      {complex.name}
                    </CardTitle>
                    <div className="flex items-center gap-1 text-muted-foreground text-sm">
                      <MapPin size={13} className="shrink-0" />
                      <span className="line-clamp-1">{complex.address}</span>
                    </div>
                  </CardHeader>

                  <CardContent className="pb-3">
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Clock size={13} />
                        <span>{complex.open_time?.slice(0,5) || "06:00"} - {complex.close_time?.slice(0,5) || "22:00"}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Users size={13} />
                        <span>{complex.fields?.length || 0} sân</span>
                      </div>
                    </div>
                  </CardContent>

                  <CardFooter className="flex items-center justify-between border-t border-border pt-4">
                    <div>
                      <span className="text-primary font-bold text-base">
                        {getMinPrice(complex)}đ
                      </span>
                      <span className="text-muted-foreground text-xs">/giờ</span>
                    </div>
                    <Button size="sm">
                      Xem sân
                    </Button>
                  </CardFooter>
                </Card>
              </Link>
            ))}
          </div>
        )}

        {/* View All Button */}
        <div className="text-center mt-12">
          <Button variant="outline" size="lg" asChild>
            <Link to="/fields" className="gap-2">
              Xem tất cả cụm sân <ArrowRight size={16} />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
};

export default FieldsSection;
