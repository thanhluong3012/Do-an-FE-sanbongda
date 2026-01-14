import { QrCode, Clock, Shield, Smartphone, BarChart3, Bell } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const features = [
  {
    icon: QrCode,
    title: "Thanh toán QR Code",
    description:
      "Thanh toán nhanh chóng, an toàn với mã QR. Không cần tiền mặt.",
  },
  {
    icon: Clock,
    title: "Đặt sân 24/7",
    description:
      "Đặt sân mọi lúc mọi nơi, ngay cả khi sân đã đóng cửa.",
  },
  {
    icon: Shield,
    title: "Cam kết hoàn tiền",
    description:
      "Hoàn tiền 100% nếu sân không đúng như mô tả hoặc bị hủy.",
  },
  {
    icon: Smartphone,
    title: "Quản lý dễ dàng",
    description:
      "Xem lịch sử đặt sân, theo dõi thanh toán trên một ứng dụng.",
  },
  {
    icon: BarChart3,
    title: "Báo cáo thống kê",
    description:
      "Chủ sân có thể xem báo cáo doanh thu, lượt đặt theo ngày/tuần.",
  },
  {
    icon: Bell,
    title: "Thông báo tức thời",
    description:
      "Nhận thông báo xác nhận đặt sân, nhắc nhở trước trận đấu.",
  },
];

const FeaturesSection = () => {
  return (
    <section className="py-20 bg-muted/30">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="text-center mb-12">
          <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-4">
            Tính năng <span className="text-primary">nổi bật</span>
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Trải nghiệm đặt sân hoàn toàn mới với những tính năng hiện đại và tiện lợi
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <Card
              key={feature.title}
              variant="interactive"
              className="group animate-fade-in"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <CardHeader>
                <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary group-hover:scale-110 transition-all duration-300">
                  <feature.icon
                    className="text-primary group-hover:text-primary-foreground transition-colors"
                    size={28}
                  />
                </div>
                <CardTitle className="text-lg">{feature.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">{feature.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
