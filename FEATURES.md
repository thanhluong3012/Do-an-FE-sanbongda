# 📋 DANH SÁCH CHỨC NĂNG HỆ THỐNG ĐẶT SÂN BÓNG

## 📑 MỤC LỤC
- [Tổng quan](#-tổng-quan)
- [Phân quyền người dùng](#-phân-quyền-người-dùng)
- [Module chính](#-module-chính)
- [Chi tiết chức năng theo vai trò](#-chi-tiết-chức-năng-theo-vai-trò)

---

## 🎯 TỔNG QUAN

Hệ thống quản lý đặt sân bóng đá với các chức năng:
- **Đặt sân bóng** theo giờ
- **Quản lý giải đấu** (Tournament)
- **Quản lý đội bóng** (Team)
- **Thanh toán** và xác nhận booking
- **Thống kê doanh thu**
- **Phân quyền 4 cấp**: Admin, Owner, Staff, User

---

## 👥 PHÂN QUYỀN NGƯỜI DÙNG

### 1. **Admin (Quản trị viên)**
- Quản lý toàn bộ hệ thống
- Duyệt đăng ký chủ sân
- Quản lý người dùng
- Quản lý giải đấu
- Dashboard tổng quan

### 2. **Owner (Chủ sân)**
- Quản lý cụm sân của mình
- Quản lý nhân viên (Staff)
- Xác nhận thanh toán booking
- Xem thống kê doanh thu
- Quản lý giá sân theo khung giờ

### 3. **Staff (Nhân viên)**
- Quản lý booking của sân được phân công
- Xem danh sách sân
- Xem doanh thu

### 4. **User (Người dùng thường)**
- Đặt sân bóng
- Quản lý booking của mình
- Tạo và quản lý đội bóng
- Đăng ký tham gia giải đấu
- Xem thông tin giải đấu

---

## 🧩 MODULE CHÍNH

### 📍 **1. MODULE XÁC THỰC (Authentication)**

#### **Trang: Auth**
- **Đăng ký tài khoản** (Sign Up)
  - Email + Password
  - Xác thực qua Supabase
  - Tự động tạo profile trong database
  
- **Đăng nhập** (Sign In)
  - Email + Password
  - JWT Token authentication
  - Session management
  
- **Đăng xuất** (Sign Out)
  - Clear session storage
  - Redirect về trang chủ

- **Quên mật khẩu** (Password Recovery)
  - Reset password qua email

**Service:** `userService.ts`, Supabase Auth

---

### 🏟️ **2. MODULE SÂN BÓNG (Field Management)**

#### **Trang: Fields, FieldDetail, FieldComplexDetail**

**A. Xem danh sách sân**
- Hiển thị tất cả cụm sân
- Filter theo khu vực, loại sân
- Search theo tên
- Hiển thị giá, hình ảnh

**B. Xem chi tiết cụm sân (Field Complex)**
- Thông tin cụm sân
- Danh sách sân con (fields)
- Địa chỉ, liên hệ
- Tiện ích, dịch vụ

**C. Xem chi tiết sân**
- Thông tin sân cụ thể
- Loại sân (5v5, 7v7, 11v11)
- Giá theo khung giờ
- Hình ảnh sân

**D. Quản lý giá sân (Owner)**
- Thiết lập giá theo session
- Giá sáng, chiều, tối
- Giá cuối tuần khác biệt

**Services:**
- `fieldService.ts` - CRUD operations cho sân
- `fieldComplexService.ts` - Quản lý cụm sân
- `tournamentSessionPriceService.ts` - Quản lý giá theo session

---

### 📅 **3. MODULE ĐẶT SÂN (Booking Management)**

#### **Trang: Booking, MyBookings**

**A. Đặt sân mới (User)**
- Chọn sân
- Chọn ngày đặt (date picker)
- Chọn khung giờ (time slots)
- Xem giá tự động tính toán
- Nhập thông tin khách hàng
  - Họ tên
  - Số điện thoại
  - Email
  - Ghi chú
- Chọn phương thức thanh toán
  - Chuyển khoản (Transfer)
  - Tiền mặt (Cash)
- Upload ảnh chuyển khoản (nếu transfer)

**B. Kiểm tra sân trống**
- Xem lịch sân theo ngày
- Hiển thị các khung giờ đã đặt
- Hiển thị khung giờ còn trống
- Real-time update

**C. Quản lý booking của tôi (MyBookings)**
- Xem danh sách booking
- Filter theo trạng thái
  - Pending (Chờ xác nhận)
  - Confirmed (Đã xác nhận)
  - Completed (Hoàn thành)
  - Cancelled (Đã hủy)
- Hủy booking
- Xem chi tiết booking

**D. Real-time sync**
- Tự động cập nhật khi có booking mới
- Thông báo khi booking thay đổi trạng thái
- Hook: `useBookingSync.ts`, `useRealtimeSync.ts`

**Services:**
- `bookingService.ts` - CRUD booking
- `paymentService.ts` - Xử lý thanh toán

---

### 🏆 **4. MODULE GIẢI ĐẤU (Tournament Management)**

#### **Trang: Tournaments, TournamentDetail, CreateTournament, MyTournaments**

**A. Xem danh sách giải đấu**
- Danh sách tất cả giải đấu
- Filter theo trạng thái
  - Upcoming (Sắp diễn ra)
  - Ongoing (Đang diễn ra)
  - Completed (Đã kết thúc)
- Search theo tên
- Xem thông tin cơ bản

**B. Xem chi tiết giải đấu**
- Thông tin giải đấu
  - Tên, mô tả
  - Thời gian đăng ký
  - Thời gian diễn ra
  - Số đội tối đa/tối thiểu
  - Lệ phí đăng ký
- Format giải đấu
  - Round Robin (Vòng tròn)
  - Knockout (Loại trực tiếp)
  - Group + Knockout (Bảng + Loại trực tiếp)
- Danh sách đội đã đăng ký
- Lịch thi đấu (Schedule)
- Bảng xếp hạng (Standings)
- Bracket (Nhánh đấu loại trực tiếp)
- Thể lệ giải đấu (Rules PDF)
- Thông tin thanh toán

**C. Tạo giải đấu mới**
- Nhập thông tin giải
- Chọn format
- Thiết lập thời gian
- Upload thể lệ (PDF)
- Thiết lập lệ phí
- Upload QR code thanh toán

**D. Đăng ký tham gia giải (User)**
- Chọn đội bóng của mình
- Điền thông tin đăng ký
- Upload ảnh chuyển khoản
- Chờ duyệt

**E. Quản lý giải đấu của tôi**
- Xem giải đấu đã đăng ký
- Trạng thái đăng ký
- Xem lịch thi đấu của đội
- Xem bảng xếp hạng

**F. Quản lý registration (Admin/Tournament Creator)**
- Duyệt đăng ký đội
- Từ chối đăng ký
- Xác nhận thanh toán

**G. Quản lý lịch thi đấu**
- Tạo lịch thi đấu tự động
- Chỉnh sửa lịch thủ công
- Phân công sân
- Cập nhật tỷ số
- Cập nhật trạng thái trận đấu

**H. Bảng xếp hạng (Standings)**
- Tự động tính điểm
- Hiển thị thống kê
  - Điểm (Points)
  - Thắng/Hòa/Thua (W/D/L)
  - Bàn thắng/bại (GF/GA)
  - Hiệu số (GD)

**Services:**
- `tournamentService.ts` - CRUD giải đấu
- `registrationService.ts` - Đăng ký giải đấu
- `matchService.ts` - Quản lý trận đấu
- `standingsService.ts` - Bảng xếp hạng

**Components:**
- `ScheduleBuilder.tsx` - Xây dựng lịch thi đấu
- `UpdateScoreDialog.tsx` - Cập nhật tỷ số
- `GroupStandingsTable.tsx` - Bảng xếp hạng
- `MatchCard.tsx` - Thông tin trận đấu
- `BracketSkeleton.tsx` - Nhánh đấu loại trực tiếp

---

### ⚽ **5. MODULE ĐỘI BÓNG (Team Management)**

#### **Trang: MyTeam**

**A. Tạo đội bóng**
- Nhập thông tin đội
  - Tên đội
  - Tên viết tắt
  - Mô tả
  - Logo (upload)
  - Liên hệ (phone, email)
- User tạo tự động là đội trưởng

**B. Quản lý thành viên**
- Thêm thành viên
  - Tên cầu thủ
  - Mã số (Code ID)
  - Số áo (Jersey number)
  - Vị trí (Position)
- Sửa thông tin thành viên
- Xóa thành viên
- Danh sách thành viên

**C. Xem thông tin đội**
- Thông tin chung
- Danh sách thành viên
- Lịch sử thi đấu
- Thống kê

**Services:**
- `teamService.ts` - CRUD đội bóng và thành viên

**Components:**
- `TeamFormDialog.tsx` - Form tạo/sửa đội
- `TeamMemberDialog.tsx` - Form thêm/sửa thành viên

---

### 💰 **6. MODULE THANH TOÁN (Payment Management)**

#### **Chức năng thanh toán**

**A. Phương thức thanh toán**
- Chuyển khoản ngân hàng (Transfer)
  - Upload ảnh chuyển khoản
  - Hiển thị QR code của Owner
- Tiền mặt (Cash)
  - Thanh toán trực tiếp tại sân

**B. Xác nhận thanh toán (Owner)**
- Xem danh sách booking chờ thanh toán
- Xem ảnh chuyển khoản
- Xác nhận thanh toán
- Từ chối thanh toán (kèm lý do)

**C. Trạng thái thanh toán**
- Pending (Chờ thanh toán)
- Paid (Đã thanh toán)
- Refunded (Đã hoàn tiền)

**Services:**
- `paymentService.ts` - Xử lý thanh toán

**Components:**
- `PaymentInfoCard.tsx` - Hiển thị thông tin thanh toán

---

### 🔔 **7. MODULE THÔNG BÁO (Notification System)**

#### **Trang: Notification Bell (Header)**

**A. Nhận thông báo real-time**
- Booking được xác nhận
- Thanh toán được xác nhận
- Đăng ký giải đấu được duyệt
- Cập nhật lịch thi đấu
- Kết quả trận đấu

**B. Quản lý thông báo**
- Xem danh sách thông báo
- Đánh dấu đã đọc
- Xóa thông báo
- Badge hiển thị số thông báo chưa đọc

**Services:**
- `notificationService.ts` - CRUD thông báo

**Components:**
- `NotificationBell.tsx` - Icon thông báo

---

### 👤 **8. MODULE PROFILE (User Profile)**

#### **Trang: Profile**

**A. Xem thông tin cá nhân**
- Tên
- Email
- Số điện thoại
- Vai trò (Role)
- Avatar

**B. Cập nhật profile**
- Sửa thông tin cá nhân
- Upload avatar
- Đổi mật khẩu

**Services:**
- `userService.ts` - CRUD user profile

---

## 🔐 CHI TIẾT CHỨC NĂNG THEO VAI TRÒ

### 👨‍💼 **ADMIN - QUẢN TRỊ VIÊN**

#### **Trang: AdminDashboard**

**A. Dashboard tổng quan**
- Thống kê tổng số:
  - Người dùng
  - Cụm sân
  - Booking
  - Giải đấu
- Biểu đồ doanh thu
- Hoạt động gần đây

**B. Quản lý người dùng (AdminUsers)**
- Xem danh sách tất cả users
- Filter theo role
- Search user
- Xem chi tiết user
- Vô hiệu hóa/Kích hoạt tài khoản
- Thay đổi vai trò

**C. Duyệt đăng ký chủ sân (AdminOwnerApprovals)**
- Xem danh sách đăng ký
- Xem thông tin chi tiết
  - Thông tin cá nhân
  - Thông tin doanh nghiệp
  - Giấy tờ pháp lý
- Duyệt đăng ký
  - Tự động tạo tài khoản Owner
  - Gửi email thông báo
- Từ chối đăng ký (kèm lý do)

**D. Quản lý giải đấu (AdminTournaments)**
- Xem tất cả giải đấu
- Duyệt giải đấu
- Xóa giải đấu vi phạm
- Thống kê giải đấu

**Services:**
- `roleService.ts` - Quản lý role
- `ownerRegistrationService.ts` - Duyệt owner

---

### 🏢 **OWNER - CHỦ SÂN**

#### **Trang: OwnerDashboard**

**A. Dashboard chủ sân**
- Thống kê cụm sân của mình
- Doanh thu hôm nay/tuần/tháng
- Số booking
- Tỷ lệ lấp đầy sân
- Booking gần đây

**B. Quản lý sân (OwnerFields)**
- Xem danh sách sân
- Thêm cụm sân mới
- Thêm sân con
- Sửa thông tin sân
- Upload hình ảnh sân
- Thiết lập giá theo session
- Bật/Tắt sân

**C. Quản lý booking (OwnerBookings)**
- Xem tất cả booking
- Filter theo:
  - Sân
  - Ngày
  - Trạng thái
- Xem chi tiết booking
- Xác nhận booking
- Hủy booking
- Calendar view

**D. Xác nhận thanh toán (OwnerPaymentConfirmation)**
- Danh sách booking chờ thanh toán
- Xem ảnh chuyển khoản
- Xác nhận thanh toán
- Từ chối thanh toán

**E. Quản lý thanh toán (OwnerPayments)**
- Lịch sử thanh toán
- Thống kê thanh toán
- Export báo cáo

**F. Quản lý nhân viên (OwnerStaff)**
- Thêm nhân viên
- Phân quyền Staff
- Phân công sân cho Staff
- Xóa/Sửa nhân viên
- Xem hoạt động của Staff

**G. Thống kê doanh thu (OwnerRevenue)**
- Doanh thu theo ngày/tuần/tháng/năm
- Biểu đồ doanh thu
- Doanh thu theo sân
- Export báo cáo Excel/PDF
- So sánh doanh thu

**H. Upload QR code thanh toán**
- Upload QR code ngân hàng
- Hiển thị khi khách đặt sân
- Quản lý thông tin tài khoản

**Services:**
- `ownerService.ts` - Quản lý owner
- `staffService.ts` - Quản lý staff

---

### 👷 **STAFF - NHÂN VIÊN**

#### **Trang: StaffDashboard**

**A. Dashboard nhân viên**
- Thống kê sân được phân công
- Booking hôm nay
- Nhiệm vụ cần làm

**B. Quản lý sân (StaffFields)**
- Xem danh sách sân được phân công
- Xem thông tin sân
- Không được sửa/xóa

**C. Quản lý booking (StaffBookings)**
- Xem booking của sân được phân công
- Xác nhận khách đến
- Cập nhật trạng thái booking
- Ghi chú

**D. Xem doanh thu (StaffRevenue)**
- Xem doanh thu của sân phụ trách
- Chỉ xem, không export

---

### 🙋 **USER - NGƯỜI DÙNG**

#### **Các chức năng đã nêu ở các module:**
1. Xem và đặt sân
2. Quản lý booking của mình
3. Tạo và quản lý đội bóng
4. Đăng ký tham gia giải đấu
5. Xem lịch thi đấu và kết quả
6. Quản lý profile

---

## 🎨 **GIAO DIỆN & TRẢI NGHIỆM**

### **A. Layout & Navigation**

**1. Header**
- Logo và tên ứng dụng
- Menu navigation
- Thông báo (Notification Bell)
- User menu (Avatar + Dropdown)
- Dark/Light mode toggle

**2. Footer**
- Thông tin liên hệ
- Social links
- Copyright

**3. Responsive Design**
- Mobile-first approach
- Adaptive cho tablet và desktop
- Hamburger menu trên mobile

### **B. UI Components (shadcn/ui)**
- Button, Input, Select
- Dialog, Sheet, Drawer
- Table, Card, Badge
- Toast, Sonner (Notifications)
- Calendar, Date Picker
- Form controls
- Tabs, Accordion
- Progress bars
- Skeleton loaders

### **C. Features nổi bật**
- **Real-time sync** - Cập nhật tự động
- **Optimistic updates** - UI update ngay lập tức
- **Error handling** - Error boundary
- **Loading states** - Skeleton và loading indicators
- **Dark mode** - Theme switching
- **Animations** - Smooth transitions

---

## 🔄 **REAL-TIME FEATURES**

### **Sử dụng Supabase Realtime**

**A. Real-time Booking Sync**
- Hook: `useBookingSync.ts`
- Tự động cập nhật khi có booking mới
- Cập nhật trạng thái booking
- Notify user khi booking thay đổi

**B. Real-time Notifications**
- Subscribe to notification channel
- Push notification khi có thông báo mới
- Update badge count

**C. Real-time Tournament Updates**
- Cập nhật tỷ số trực tiếp
- Cập nhật bảng xếp hạng
- Cập nhật lịch thi đấu

---

## 🗄️ **DATABASE SCHEMA (Supabase)**

### **Các bảng chính:**

1. **users** - Người dùng
2. **profiles** - Thông tin profile
3. **roles** - Vai trò người dùng
4. **field_complexes** - Cụm sân
5. **fields** - Sân con
6. **bookings** - Đặt sân
7. **payments** - Thanh toán
8. **tournaments** - Giải đấu
9. **teams** - Đội bóng
10. **team_members** - Thành viên đội
11. **tournament_registrations** - Đăng ký giải
12. **matches** - Trận đấu
13. **standings** - Bảng xếp hạng
14. **notifications** - Thông báo
15. **owner_registrations** - Đăng ký chủ sân
16. **staff_assignments** - Phân công nhân viên
17. **tournament_session_prices** - Giá theo session

### **Row Level Security (RLS)**
- Mọi bảng đều có RLS policies
- Phân quyền ở database level
- Bảo mật dữ liệu

---

## 📱 **RESPONSIVE & MOBILE SUPPORT**

- **Mobile-first design**
- **Touch-friendly UI**
- **Adaptive layouts**
- **Mobile navigation**
- Hook: `use-mobile.tsx` để detect mobile

---

## 🔒 **BẢO MẬT**

### **A. Authentication**
- Supabase Auth
- JWT Tokens
- Session management
- Password hashing

### **B. Authorization**
- Role-based access control (RBAC)
- Protected routes
- RLS policies
- API authorization

### **C. Data Security**
- Input validation (Zod schemas)
- XSS protection
- SQL injection prevention (Supabase)
- File upload validation

---

## 📊 **ANALYTICS & REPORTING**

### **A. Thống kê cho Owner**
- Doanh thu theo thời gian
- Tỷ lệ lấp đầy sân
- Khung giờ hot nhất
- Khách hàng thường xuyên

### **B. Biểu đồ (Recharts)**
- Line chart - Doanh thu theo thời gian
- Bar chart - So sánh doanh thu sân
- Pie chart - Phân bố phương thức thanh toán

### **C. Export báo cáo**
- Export Excel
- Export PDF
- Email reports

---

## 🚀 **PERFORMANCE OPTIMIZATION**

### **A. Code Splitting**
- Lazy loading routes
- Dynamic imports

### **B. Caching**
- TanStack Query caching
- Stale-while-revalidate
- Optimistic updates

### **C. Image Optimization**
- Lazy loading images
- Responsive images
- Compression

---

## 📝 **TÓM TẮT SỐ LIỆU**

### **Tổng số trang:** ~30 pages
- Public: 7 pages
- User: 5 pages  
- Owner: 7 pages
- Staff: 4 pages
- Admin: 4 pages

### **Tổng số Services:** 16 services
### **Tổng số Components:** 50+ components
### **Tổng số Hooks:** 5 custom hooks

---

## 🎓 **TECHNOLOGY HIGHLIGHTS**

✅ **Modern Stack:** React 18 + TypeScript + Vite  
✅ **Backend:** Supabase (Auth + DB + Storage + Realtime)  
✅ **UI Library:** shadcn/ui + Radix UI + Tailwind CSS  
✅ **State Management:** TanStack Query  
✅ **Form Handling:** React Hook Form + Zod  
✅ **Real-time:** Supabase Subscriptions  
✅ **Charts:** Recharts  
✅ **Routing:** React Router v6  

---

**Tài liệu này được tạo tự động dựa trên source code của dự án.**  
**Ngày tạo:** 5 tháng 5, 2026
