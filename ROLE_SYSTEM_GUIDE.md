# Hệ Thống Phân Quyền Theo Role

## Tổng Quan

Dự án đã được thiết kế lại với hệ thống phân quyền theo 4 cấp độ role, mỗi role có giao diện và chức năng riêng biệt.

## Các Role và Quyền Hạn

### 1. Admin (role_id = 1)
**Quyền cao nhất trong hệ thống**
- Quản lý tất cả users (phân loại member, owner, staff)
- Duyệt đăng ký tài khoản chủ sân
- Xem tất cả sân bóng trong hệ thống
- Xem tất cả booking
- Cài đặt hệ thống

**Routes:**
- `/admin/dashboard` - Dashboard tổng quan
- `/admin/users` - Quản lý users
- `/admin/owner-approvals` - Duyệt đăng ký chủ sân
- `/admin/all-fields` - Tất cả sân bóng
- `/admin/all-bookings` - Tất cả booking
- `/admin/system-settings` - Cài đặt hệ thống

### 2. Owner (role_id = 2)
**Chủ sân bóng**
- Quản lý nhân viên (thêm, sửa, xóa staff)
- Quản lý sân bóng của mình
- Quản lý booking
- Quản lý thanh toán
- Xem báo cáo doanh thu
- Cài đặt tài khoản

**Routes:**
- `/owner/dashboard` - Dashboard chủ sân
- `/owner/staff` - Quản lý nhân viên
- `/owner/fields` - Quản lý sân bóng
- `/owner/bookings` - Quản lý booking
- `/owner/payments` - Thanh toán
- `/owner/revenue` - Báo cáo doanh thu
- `/owner/settings` - Cài đặt

### 3. Staff (role_id = 3)
**Nhân viên của chủ sân**
- Quản lý sân bóng (giống owner)
- Quản lý booking (giống owner)
- Quản lý thanh toán (giống owner)
- Xem báo cáo doanh thu (giống owner)
- Quản lý công việc được giao
- **KHÔNG có quyền quản lý nhân viên**

**Routes:**
- `/staff/dashboard` - Dashboard nhân viên
- `/staff/fields` - Quản lý sân bóng
- `/staff/bookings` - Quản lý booking
- `/staff/payments` - Thanh toán
- `/staff/revenue` - Báo cáo doanh thu
- `/staff/tasks` - Công việc được giao

### 4. Member (role_id = 4)
**Người dùng thông thường**
- Tìm kiếm sân bóng
- Đặt lịch
- Tham gia giải đấu
- **KHÔNG có quyền truy cập admin panel**

## Cấu Trúc File

### Components

1. **RoleBasedLayout** (`src/components/layout/RoleBasedLayout.tsx`)
   - Layout chung cho tất cả các role có admin panel
   - Tự động hiển thị menu phù hợp với role
   - Xử lý authorization và redirect

2. **ProtectedRoute** (`src/components/ProtectedRoute.tsx`)
   - Bảo vệ routes theo role
   - Kiểm tra quyền truy cập
   - Redirect về trang chủ nếu không có quyền

3. **RoleBasedRedirect** (`src/components/RoleBasedRedirect.tsx`)
   - Tự động redirect user đến dashboard phù hợp sau khi login

### Pages

#### Admin Pages (`src/pages/admin/`)
- `AdminDashboardNew.tsx` - Dashboard admin
- `AdminOwnerApprovals.tsx` - Trang duyệt chủ sân
- `AdminUsers.tsx` - Quản lý users
- `AdminBookings.tsx` - Quản lý bookings
- `AdminFields.tsx` - Quản lý sân
- `AdminSettings.tsx` - Cài đặt

#### Owner Pages (`src/pages/owner/`)
- `OwnerDashboard.tsx` - Dashboard chủ sân
- `OwnerStaff.tsx` - Quản lý nhân viên
- `OwnerRevenue.tsx` - Báo cáo doanh thu

#### Staff Pages (`src/pages/staff/`)
- `StaffDashboard.tsx` - Dashboard nhân viên
- `StaffTasks.tsx` - Quản lý công việc

### Hooks

**useAuth** (`src/hooks/useAuth.tsx`)
Đã được cập nhật với các helper functions:
- `isAdmin()` - Kiểm tra role admin
- `isOwner()` - Kiểm tra role owner
- `isStaff()` - Kiểm tra role staff
- `isMember()` - Kiểm tra role member
- `hasRole(roleId)` - Kiểm tra role cụ thể

### Constants

```typescript
export const ROLES = {
  ADMIN: 1,
  OWNER: 2,
  STAFF: 3,
  MEMBER: 4,
} as const;
```

## Routing

Routes được bảo vệ bằng `ProtectedRoute` component với `requiredRole` prop:

```tsx
<Route 
  path="/admin/dashboard" 
  element={
    <ProtectedRoute requiredRole={1}>
      <AdminDashboardNew />
    </ProtectedRoute>
  } 
/>
```

## Cách Sử Dụng

### 1. Đăng Nhập
Sau khi đăng nhập thành công, backend sẽ trả về thông tin user bao gồm `role_id` hoặc object `role`.

### 2. Tự Động Redirect
- Admin → `/admin/dashboard`
- Owner → `/owner/dashboard`
- Staff → `/staff/dashboard`
- Member → Ở lại trang hiện tại

### 3. Truy Cập Routes
Mỗi role chỉ có thể truy cập các routes của mình. Nếu cố gắng truy cập route không có quyền:
- Hiển thị toast "Không có quyền truy cập"
- Redirect về trang chủ sau 1.5 giây

### 4. Header Navigation
Header tự động hiển thị:
- Link đến dashboard tương ứng (nếu user có role cao hơn member)
- Tên role hiện tại
- Menu dropdown với thông tin user

## Flow Đăng Ký Chủ Sân

1. User đăng ký qua trang `/register/field-owner`
2. Thông tin được gửi lên backend (bao gồm giấy phép kinh doanh)
3. Admin xem danh sách yêu cầu tại `/admin/owner-approvals`
4. Admin duyệt hoặc từ chối
5. Sau khi duyệt, user được cập nhật role từ `member` (4) lên `owner` (2)
6. Owner có thể đăng nhập và truy cập dashboard chủ sân

## API Integration

Các pages hiện tại đang sử dụng demo data. Cần tích hợp với API backend:

### Admin APIs
- `GET /admin/stats` - Thống kê tổng quan
- `GET /admin/owner-requests` - Danh sách yêu cầu đăng ký chủ sân
- `POST /admin/owner-requests/:id/approve` - Duyệt yêu cầu
- `POST /admin/owner-requests/:id/reject` - Từ chối yêu cầu
- `GET /admin/users` - Danh sách users
- `GET /admin/bookings` - Danh sách bookings
- `GET /admin/fields` - Danh sách sân

### Owner APIs
- `GET /owner/stats` - Thống kê của chủ sân
- `GET /owner/staff` - Danh sách nhân viên
- `POST /owner/staff` - Thêm nhân viên
- `PUT /owner/staff/:id` - Cập nhật nhân viên
- `DELETE /owner/staff/:id` - Xóa nhân viên
- `GET /owner/fields` - Sân của chủ sân
- `GET /owner/bookings` - Booking
- `GET /owner/revenue` - Doanh thu

### Staff APIs
- `GET /staff/stats` - Thống kê nhân viên
- `GET /staff/tasks` - Danh sách công việc
- `PUT /staff/tasks/:id` - Cập nhật trạng thái công việc
- `GET /staff/fields` - Sân được giao
- `GET /staff/bookings` - Booking cần xử lý

## Testing

Để test hệ thống role-based:

1. **Test Admin:**
   - Login với tài khoản có `role_id = 1`
   - Kiểm tra truy cập `/admin/dashboard`
   - Kiểm tra không thể truy cập `/owner/dashboard`, `/staff/dashboard`

2. **Test Owner:**
   - Login với tài khoản có `role_id = 2`
   - Kiểm tra truy cập `/owner/dashboard`
   - Kiểm tra có thể thêm/sửa/xóa staff
   - Kiểm tra không thể truy cập `/admin/dashboard`

3. **Test Staff:**
   - Login với tài khoản có `role_id = 3`
   - Kiểm tra truy cập `/staff/dashboard`
   - Kiểm tra KHÔNG có menu "Quản lý nhân viên"
   - Kiểm tra không thể truy cập `/owner/staff`

4. **Test Member:**
   - Login với tài khoản có `role_id = 4`
   - Kiểm tra không có link dashboard
   - Kiểm tra không thể truy cập bất kỳ admin panel nào

## Next Steps

1. **Tích hợp API Backend**
   - Thay thế demo data bằng API calls thực
   - Xử lý loading states và errors

2. **Thêm Chức Năng**
   - Owner: Thêm pages quản lý sân, booking, payments
   - Staff: Hoàn thiện task management
   - Admin: Thêm user management chi tiết

3. **Cải Thiện UX**
   - Thêm loading skeletons
   - Xử lý error boundaries
   - Thêm notifications real-time

4. **Security**
   - Implement CSRF protection
   - Add rate limiting
   - Validate permissions on backend

## Troubleshooting

### User không redirect đến dashboard sau login
- Kiểm tra backend có trả về `role_id` hoặc `role` object không
- Xem console log trong `useAuth.tsx` line ~103

### "Không có quyền truy cập" mặc dù có role đúng
- Kiểm tra `role_id` trong localStorage
- Verify `ROLES` constants khớp với database

### Menu không hiển thị đúng
- Kiểm tra `RoleBasedLayout.tsx` line ~47-103
- Xem log trong console để debug role detection

## Liên Hệ

Nếu có thắc mắc về hệ thống role-based, vui lòng liên hệ team dev.
