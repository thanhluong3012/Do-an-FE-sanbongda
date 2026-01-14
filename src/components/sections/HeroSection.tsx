import { Search, MapPin, CalendarDays } from "lucide-react";
import { Button } from "@/components/ui/button";
import heroImage from "@/assets/hero-field.jpg";

const HeroSection = () => {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background Image */}
      <div className="absolute inset-0">
        <img
          src={heroImage}
          alt="Sân bóng đá"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-secondary/80 via-secondary/60 to-background" />
        <div className="absolute inset-0 field-pattern opacity-30" />
      </div>

      {/* Content */}
      <div className="relative container mx-auto px-4 pt-24 pb-16">
        <div className="max-w-4xl mx-auto text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/20 backdrop-blur-sm rounded-full border border-primary/30 mb-8 animate-fade-in">
            <span className="w-2 h-2 bg-primary rounded-full animate-pulse" />
            <span className="text-primary-foreground text-sm font-medium">
              Hơn 500+ sân bóng trên toàn quốc
            </span>
          </div>

          {/* Heading */}
          <h1 className="font-display text-4xl md:text-5xl lg:text-7xl font-bold text-primary-foreground mb-6 animate-slide-up">
            Đặt sân bóng
            <br />
            <span className="text-accent">chỉ trong vài giây</span>
          </h1>

          <p className="text-lg md:text-xl text-primary-foreground/80 mb-10 max-w-2xl mx-auto animate-slide-up">
            Tìm kiếm, đặt sân và theo dõi lịch thi đấu dễ dàng. Thanh toán nhanh
            chóng qua QR code.
          </p>

          {/* Search Box */}
          <div className="glass rounded-2xl p-4 md:p-6 max-w-3xl mx-auto shadow-lg animate-scale-in">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 flex items-center gap-3 bg-background rounded-xl px-4 py-3 border border-border">
                <MapPin className="text-primary shrink-0" size={20} />
                <input
                  type="text"
                  placeholder="Nhập địa điểm (Quận, Huyện...)"
                  className="flex-1 bg-transparent outline-none text-foreground placeholder:text-muted-foreground"
                />
              </div>
              <div className="flex items-center gap-3 bg-background rounded-xl px-4 py-3 border border-border md:w-48">
                <CalendarDays className="text-primary shrink-0" size={20} />
                <input
                  type="text"
                  placeholder="Chọn ngày"
                  className="flex-1 bg-transparent outline-none text-foreground placeholder:text-muted-foreground"
                />
              </div>
              <Button variant="hero" size="lg" className="md:w-auto">
                <Search size={20} />
                Tìm sân
              </Button>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-8 max-w-2xl mx-auto mt-16 animate-fade-in">
            {[
              { value: "500+", label: "Sân bóng" },
              { value: "10K+", label: "Khách hàng" },
              { value: "50K+", label: "Lượt đặt" },
            ].map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="font-display text-3xl md:text-4xl font-bold text-primary-foreground">
                  {stat.value}
                </div>
                <div className="text-primary-foreground/70 text-sm mt-1">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
        <div className="w-6 h-10 rounded-full border-2 border-primary-foreground/30 flex items-start justify-center p-2">
          <div className="w-1.5 h-3 bg-primary-foreground/50 rounded-full" />
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
