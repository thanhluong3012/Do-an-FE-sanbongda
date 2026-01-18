import { MapPin, Phone, Mail, Facebook, Youtube, Instagram} from "lucide-react";

const Footer = () => {
  return (
    <footer className="bg-secondary text-secondary-foreground">
      <div className="container mx-auto px-4 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-lg">
                  ⚽
                </span>
              </div>
              <span className="font-display font-bold text-xl">
                TM ARENA<span className="text-primary"></span>
              </span>
            </div>
            <p className="text-secondary-foreground/70 mb-6">
              Nền tảng đặt sân bóng đá và quản lý lịch thi đấu hàng đầu Việt Nam.
            </p>
            <div className="flex gap-3">
              {[Facebook, Youtube, Instagram].map((Icon, index) => (
                <a
                  key={index}
                  href="#"
                  className="w-10 h-10 rounded-full bg-secondary-foreground/10 flex items-center justify-center hover:bg-primary hover:text-primary-foreground transition-colors"
                >
                  <Icon size={20} />
                </a>
              ))}
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-display font-bold text-lg mb-4">
              Liên kết nhanh
            </h3>
            <ul className="space-y-3">
              {["Trang chủ", "Tìm sân", "Lịch thi đấu", "Về chúng tôi", "Liên hệ"].map(
                (link) => (
                  <li key={link}>
                    <a
                      href="#"
                      className="text-secondary-foreground/70 hover:text-primary transition-colors"
                    >
                      {link}
                    </a>
                  </li>
                )
              )}
            </ul>
          </div>

          {/* For Owners */}
          <div>
            <h3 className="font-display font-bold text-lg mb-4">
              Dành cho chủ sân
            </h3>
            <ul className="space-y-3">
              {[
                "Đăng ký làm đối tác",
                "Quản lý sân bóng",
                "Báo cáo doanh thu",
                "Hỗ trợ kỹ thuật",
              ].map((link) => (
                <li key={link}>
                  <a
                    href="#"
                    className="text-secondary-foreground/70 hover:text-primary transition-colors"
                  >
                    {link}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="font-display font-bold text-lg mb-4">Liên hệ</h3>
            <ul className="space-y-4">
              <li className="flex items-start gap-3">
                <MapPin className="text-primary shrink-0 mt-1" size={18} />
                <span className="text-secondary-foreground/70">
                  123 Nguyễn Văn A, Quận 1, TP.HCM
                </span>
              </li>
              <li className="flex items-center gap-3">
                <Phone className="text-primary" size={18} />
                <span className="text-secondary-foreground/70">
                  1900 1234 56
                </span>
              </li>
              <li className="flex items-center gap-3">
                <Mail className="text-primary" size={18} />
                <span className="text-secondary-foreground/70">
                  support@tmarena.vn
                </span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-secondary-foreground/10 mt-12 pt-8 text-center">
          <p className="text-secondary-foreground/50 text-sm">
            © 2026 TM ARENA. Tất cả quyền được bảo lưu.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
