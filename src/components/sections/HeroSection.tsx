import { ArrowRight, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link, useNavigate } from "react-router-dom";
import heroImage from "@/assets/hero-field.jpg";

const HeroSection = () => {
  const navigate = useNavigate();

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background Image */}
      <div className="absolute inset-0 pointer-events-none">
        <img
          src={heroImage}
          alt="Sân bóng đá"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/50 to-background" />
        <div className="absolute inset-0 bg-gradient-to-r from-primary/30 to-transparent" />
        <div className="absolute inset-0 field-pattern opacity-20" />
      </div>

      {/* Content */}
      <div className="relative z-10 container mx-auto px-4 pt-24 pb-20">
        <div className="max-w-5xl mx-auto text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-5 py-3 bg-white/90 backdrop-blur-md rounded-full border border-white/30 mb-8 animate-fade-in shadow-lg">
            <span className="w-2 h-2 bg-primary rounded-full animate-pulse" />
            <span className="text-gray-800 text-sm font-semibold">
              Hơn 500+ sân bóng trên toàn quốc
            </span>
          </div>

          {/* Heading */}
          <h1 className="font-display text-4xl md:text-6xl lg:text-7xl font-extrabold text-white mb-6 animate-slide-up leading-tight">
            <span className="drop-shadow-2xl">Đặt sân bóng</span>
            <br />
            <span className="text-accent drop-shadow-2xl">chỉ trong vài giây</span>
          </h1>

          <p className="text-lg md:text-xl text-white/95 mb-10 max-w-2xl mx-auto animate-slide-up drop-shadow-lg">
            Tìm kiếm, đặt sân và theo dõi lịch thi đấu dễ dàng. Thanh toán nhanh
            chóng qua QR code.
          </p>

          {/* Field Owner CTA */}
          <div className="bg-white backdrop-blur-md rounded-3xl p-8 md:p-10 max-w-4xl mx-auto shadow-2xl animate-scale-in border border-white/20">
            <div className="flex flex-col lg:flex-row items-center gap-8">
              {/* Icon & Content */}
              <div className="flex-1 text-left">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-primary/80 shadow-lg mb-5">
                  <Building2 className="text-white" size={32} />
                </div>
                <h3 className="text-3xl md:text-4xl font-bold text-gray-950 mb-4 leading-tight">
                  Bạn là chủ sân bóng?
                </h3>
                <p className="text-gray-700 text-base md:text-lg mb-6 leading-relaxed font-medium">
                  Đăng ký ngay để quản lý sân bóng của bạn và tiếp cận hàng ngàn khách hàng tiềm năng
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-3">
                  {[
                    { text: "Quản lý đặt sân dễ dàng", icon: "📊" },
                    { text: "Tăng doanh thu hiệu quả", icon: "📈" },
                    { text: "Hỗ trợ 24/7", icon: "💬" }
                  ].map((benefit) => (
                    <div key={benefit.text} className="flex items-center gap-3 bg-primary/5 rounded-xl p-3">
                      <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary/10">
                        <span className="text-lg">{benefit.icon}</span>
                      </div>
                      <span className="text-gray-800 font-semibold text-sm">{benefit.text}</span>
                    </div>
                  ))}
                </div>
              </div>
              
              {/* CTA Button */}
              <div className="flex flex-col gap-4 lg:min-w-[240px] pointer-events-auto">
                <Button
                  size="lg"
                  type="button"
                  onClick={() => navigate("/register/field-owner")}
                  className="text-lg px-10 py-7 shadow-xl hover:shadow-2xl transition-all bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary text-white font-bold rounded-xl"
                >
                  Đăng ký ngay
                  <ArrowRight size={22} className="ml-2" />
                </Button>
                <div className="text-center space-y-2">
                  <div className="h-px bg-gray-300"></div>
                  <Link 
                    to="/fields"
                    className="inline-flex items-center justify-center gap-1 text-sm text-gray-700 hover:text-primary transition-colors font-semibold"
                  >
                    Hoặc tìm sân để đặt
                    <ArrowRight size={16} />
                  </Link>
                </div>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-6 max-w-3xl mx-auto mt-16 animate-fade-in">
            {[
              { value: "500+", label: "Sân bóng" },
              { value: "10K+", label: "Khách hàng" },
              { value: "50K+", label: "Lượt đặt" },
            ].map((stat) => (
              <div key={stat.label} className="text-center bg-white/95 backdrop-blur-md rounded-2xl p-5 border border-white/30 shadow-xl hover:shadow-2xl hover:bg-white transition-all">
                <div className="font-display text-3xl md:text-5xl font-bold text-gray-900 drop-shadow-sm">
                  {stat.value}
                </div>
                <div className="text-gray-700 text-sm md:text-base font-semibold mt-2">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
