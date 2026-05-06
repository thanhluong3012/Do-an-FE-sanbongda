import { Search, CalendarCheck, CreditCard, CheckCircle, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "react-router-dom";

const steps = [
  {
    icon: Search,
    step: "01",
    title: "Tìm sân phù hợp",
    description: "Tìm kiếm và lọc sân bóng theo khu vực, loại sân, thời gian",
  },
  {
    icon: CalendarCheck,
    step: "02",
    title: "Chọn khung giờ",
    description: "Xem lịch trống theo ngày, chọn giờ phù hợp với bạn",
  },
  {
    icon: CreditCard,
    step: "03",
    title: "Thanh toán QR",
    description: "Thanh toán nhanh qua QR code, nhận xác nhận tức thì",
  },
  {
    icon: CheckCircle,
    step: "04",
    title: "Ra sân thi đấu",
    description: "Nhận thông báo nhắc nhở và đến sân theo lịch đã đặt",
  },
];

const BookingSection = () => {
  return (
    <section id="booking" className="py-20 bg-background">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="text-center mb-12">
          <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-4">
            Đặt sân <span className="text-primary">dễ dàng</span> chỉ 4 bước
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Quy trình đặt sân đơn giản, nhanh chóng — từ tìm kiếm đến xác nhận chỉ trong vài phút
          </p>
        </div>

        {/* Steps */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-5xl mx-auto mb-12">
          {steps.map((s, index) => (
            <Card key={s.step} variant="interactive" className="group animate-fade-in text-center" style={{ animationDelay: `${index * 100}ms` }}>
              <CardContent className="pt-8 pb-6 flex flex-col items-center gap-3">
                <div className="relative">
                  <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center group-hover:bg-primary group-hover:scale-110 transition-all duration-300">
                    <s.icon className="text-primary group-hover:text-primary-foreground transition-colors" size={28} />
                  </div>
                  <span className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center">
                    {s.step}
                  </span>
                </div>
                <h3 className="font-semibold text-base">{s.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{s.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* CTA */}
        <div className="text-center">
          <Button size="lg" asChild className="gap-2 px-8">
            <Link to="/fields">
              Đặt sân ngay <ArrowRight size={18} />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
};

export default BookingSection;
