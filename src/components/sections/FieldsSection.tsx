import { Star, MapPin, Clock, Users } from "lucide-react";
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

const fields = [
  {
    id: 1,
    name: "Sân Thống Nhất",
    location: "Quận 10, TP.HCM",
    rating: 4.8,
    reviews: 128,
    price: "500.000",
    type: "Sân 11",
    available: true,
    image:
      "https://images.unsplash.com/photo-1529900748604-07564a03e7a6?w=600&h=400&fit=crop",
  },
  {
    id: 2,
    name: "Sân Phú Thọ",
    location: "Quận 11, TP.HCM",
    rating: 4.6,
    reviews: 95,
    price: "400.000",
    type: "Sân 7",
    available: true,
    image:
      "https://images.unsplash.com/photo-1556056504-5c7696c4c28d?w=600&h=400&fit=crop",
  },
  {
    id: 3,
    name: "Sân Tân Bình FC",
    location: "Quận Tân Bình",
    rating: 4.9,
    reviews: 210,
    price: "350.000",
    type: "Sân 5",
    available: false,
    image:
      "https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=600&h=400&fit=crop",
  },
  {
    id: 4,
    name: "Sân Mỹ Đình Mini",
    location: "Quận 7, TP.HCM",
    rating: 4.7,
    reviews: 156,
    price: "450.000",
    type: "Sân 7",
    available: true,
    image:
      "https://images.unsplash.com/photo-1459865264687-595d652de67e?w=600&h=400&fit=crop",
  },
];

const FieldsSection = () => {
  return (
    <section id="fields" className="py-20 bg-muted/30">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="text-center mb-12">
          <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-4">
            Sân bóng <span className="text-primary">nổi bật</span>
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Khám phá những sân bóng chất lượng cao với đầy đủ tiện nghi, được
            đánh giá cao bởi cộng đồng
          </p>
        </div>

        {/* Fields Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {fields.map((field, index) => (
            <Link to={`/field/${field.id}`} key={field.id}>
              <Card
                variant="field"
                className="group animate-fade-in cursor-pointer hover:shadow-xl transition-shadow"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                {/* Image */}
                <div className="relative h-48 overflow-hidden">
                  <img
                    src={field.image}
                    alt={field.name}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-secondary/80 to-transparent" />

                {/* Badges */}
                <div className="absolute top-3 left-3 flex gap-2">
                  <Badge
                    variant="secondary"
                    className="bg-secondary/90 backdrop-blur-sm"
                  >
                    {field.type}
                  </Badge>
                </div>
                <div className="absolute top-3 right-3">
                  {field.available ? (
                    <Badge className="bg-success text-success-foreground">
                      Còn trống
                    </Badge>
                  ) : (
                    <Badge variant="destructive">Hết chỗ</Badge>
                  )}
                </div>

                {/* Rating */}
                <div className="absolute bottom-3 left-3 flex items-center gap-1 text-primary-foreground">
                  <Star size={16} className="fill-accent text-accent" />
                  <span className="font-semibold">{field.rating}</span>
                  <span className="text-sm opacity-80">
                    ({field.reviews} đánh giá)
                  </span>
                </div>
              </div>

              <CardHeader className="pb-2">
                <CardTitle className="text-lg group-hover:text-primary transition-colors">
                  {field.name}
                </CardTitle>
                <div className="flex items-center gap-1 text-muted-foreground text-sm">
                  <MapPin size={14} />
                  <span>{field.location}</span>
                </div>
              </CardHeader>

              <CardContent className="pb-4">
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Clock size={14} />
                    <span>6:00 - 22:00</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Users size={14} />
                    <span>{field.type}</span>
                  </div>
                </div>
              </CardContent>

              <CardFooter className="flex items-center justify-between border-t border-border pt-4">
                <div>
                  <span className="text-primary font-bold text-lg">
                    {field.price}đ
                  </span>
                  <span className="text-muted-foreground text-sm">/giờ</span>
                </div>
                <Button 
                  size="sm" 
                  disabled={!field.available}
                  onClick={(e) => {
                    e.preventDefault();
                    window.location.href = `/booking?field=${field.id}`;
                  }}
                >
                  Đặt ngay
                </Button>
              </CardFooter>
            </Card>
            </Link>
          ))}
        </div>

        {/* View All Button */}
        <div className="text-center mt-12">
          <Button variant="outline" size="lg" asChild>
            <Link to="/fields">Xem tất cả sân bóng</Link>
          </Button>
        </div>
      </div>
    </section>
  );
};

export default FieldsSection;
