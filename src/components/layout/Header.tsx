import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth, ROLES } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { NotificationBell } from "@/components/Notification/NotificationBell";
import { Menu, X, MapPin, Calendar, Trophy, User, LogOut, Building2, LayoutDashboard, Clock, Users, Shield } from "lucide-react";import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { user, signOut, isAdmin, isOwner, isStaff } = useAuth();
  const navigate = useNavigate();

  const navLinks = [
    { name: "Đặt lịch", href: "/fields", icon: MapPin, isRoute: true },
    { name: "Giải đấu", href: "/tournaments", icon: Trophy, isRoute: true },
    { name: "Dành cho chủ sân", href: "/register/field-owner", icon: Building2, isRoute: true, highlight: true },
  ];

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  // Lấy link dashboard dựa trên role
  const getDashboardLink = () => {
    if (isAdmin()) return '/admin/dashboard';
    if (isOwner()) return '/owner/dashboard';
    if (isStaff()) return '/staff/dashboard';
    return null;
  };

  const dashboardLink = getDashboardLink();
  const roleName = isAdmin() ? 'Admin' : isOwner() ? 'Chủ sân' : isStaff() ? 'Nhân viên' : 'User';

  return (
    <header className="fixed top-0 left-0 right-0 z-50 glass border-b border-border/50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16 md:h-20">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 group">
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center shadow-md group-hover:shadow-lg transition-shadow">
              <span className="text-primary-foreground font-bold text-lg">⚽</span>
            </div>
            <span className="font-display font-bold text-xl text-foreground">
              <span className="text-primary">TM ARENA</span>
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((link) =>
              link.isRoute ? (
                <Link
                  key={link.name}
                  to={link.href}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-200 ${
                    link.highlight
                      ? "bg-primary/10 text-primary hover:bg-primary/20 border border-primary/20"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  }`}
                >
                  <link.icon size={18} />
                  <span className="font-medium">{link.name}</span>
                </Link>
              ) : (
                <a
                  key={link.name}
                  href={link.href}
                  className="flex items-center gap-2 px-4 py-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-all duration-200"
                >
                  <link.icon size={18} />
                  <span className="font-medium">{link.name}</span>
                </a>
              )
            )}
          </nav>

          {/* Desktop CTA */}
          <div className="hidden md:flex items-center gap-3">
            {user ? (
              <>
              <NotificationBell />
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="gap-2">
                    <User size={18} />
                    {user.name || user.email}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem className="text-muted-foreground">
                    {user.email}
                  </DropdownMenuItem>
                  <DropdownMenuItem className="text-xs text-muted-foreground">
                    Vai trò: {roleName}
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  {dashboardLink && (
                    <>
                      <DropdownMenuItem asChild>
                        <Link to={dashboardLink} className="cursor-pointer">
                          <LayoutDashboard className="w-4 h-4 mr-2" />
                          Dashboard
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                    </>
                  )}
                  {/* Thông tin cá nhân */}
                  <DropdownMenuItem asChild>
                    <Link to="/profile" className="cursor-pointer">
                      <User className="w-4 h-4 mr-2" />
                      Thông tin cá nhân
                    </Link>
                  </DropdownMenuItem>
                  {/* Quản lý giải đấu - hiện với mọi user đã đăng nhập */}
                  <DropdownMenuItem asChild>
                    <Link to="/my-tournaments" className="cursor-pointer">
                      <Trophy className="w-4 h-4 mr-2" />
                      Quản lý giải đấu
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/my-team" className="cursor-pointer">
                      <Shield className="w-4 h-4 mr-2" />
                      Quản lý đội bóng
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  {/* Chỉ hiển thị "Lịch sử đặt sân" cho member (không phải admin/owner/staff) */}
                  {!isAdmin() && !isOwner() && !isStaff() && (
                    <>
                      <DropdownMenuItem asChild>
                        <Link to="/my-bookings" className="cursor-pointer">
                          <Clock className="w-4 h-4 mr-2" />
                          Lịch sử đặt sân
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                    </>
                  )}
                  <DropdownMenuItem onClick={handleSignOut} className="text-destructive">
                    <LogOut className="w-4 h-4 mr-2" />
                    Đăng xuất
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              </>
            ) : (
              <>
                <Button variant="ghost" size="sm" asChild>
                  <Link to="/auth">
                    <User size={18} className="mr-2" />
                    Đăng nhập
                  </Link>
                </Button>
                <Button variant="default" size="sm" asChild>
                  <Link to="/auth?tab=register">Đăng ký</Link>
                </Button>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2 text-foreground"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            aria-label="Toggle menu"
          >
            {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden py-4 border-t border-border/50 animate-fade-in">
            <nav className="flex flex-col gap-2">
              {dashboardLink && user && (
                <Link
                  to={dashboardLink}
                  className="flex items-center gap-3 px-4 py-3 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 border border-primary/20 transition-colors"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <LayoutDashboard size={20} />
                  <span className="font-medium">Dashboard {roleName}</span>
                </Link>
              )}
              {navLinks.map((link) =>
                link.isRoute ? (
                  <Link
                    key={link.name}
                    to={link.href}
                    className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                      link.highlight
                        ? "bg-primary/10 text-primary hover:bg-primary/20 border border-primary/20"
                        : "text-foreground hover:bg-muted"
                    }`}
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <link.icon size={20} className={link.highlight ? "text-primary" : "text-primary"} />
                    <span className="font-medium">{link.name}</span>
                  </Link>
                ) : (
                  <a
                    key={link.name}
                    href={link.href}
                    className="flex items-center gap-3 px-4 py-3 text-foreground hover:bg-muted rounded-lg transition-colors"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <link.icon size={20} className="text-primary" />
                    <span className="font-medium">{link.name}</span>
                  </a>
                )
              )}
              <div className="flex gap-2 mt-4 px-4">
                {user ? (
                  <Button variant="destructive" className="flex-1" onClick={handleSignOut}>
                    <LogOut className="w-4 h-4 mr-2" />
                    Đăng xuất
                  </Button>
                ) : (
                  <>
                    <Button variant="outline" className="flex-1" asChild>
                      <Link to="/auth" onClick={() => setIsMenuOpen(false)}>
                        Đăng nhập
                      </Link>
                    </Button>
                    <Button className="flex-1" asChild>
                      <Link to="/auth?tab=register" onClick={() => setIsMenuOpen(false)}>
                        Đăng ký
                      </Link>
                    </Button>
                  </>
                )}
              </div>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
