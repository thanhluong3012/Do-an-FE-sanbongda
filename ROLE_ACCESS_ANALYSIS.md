# 🔐 PHÂN TÍCH PHÂN QUYỀN HỆ THỐNG

## 📊 CÁC VAI TRÒ (ROLES)

```typescript
ADMIN  = 1  // Quản trị viên
OWNER  = 2  // Chủ sân
STAFF  = 3  // Nhân viên của owner
MEMBER = 4  // Khách hàng/User thường
```

---

## ❌ VẤN ĐỀ HIỆN TẠI

### 1. **Pages KHÔNG có bảo vệ (ai cũng vào được)**
- ❌ `/booking` - Trang đặt sân (nên yêu cầu đăng nhập)
- ❌ `/my-bookings` - Lịch sử đặt sân (chỉ cho MEMBER, nhưng ai cũng vào được)
- ❌ `/register/field-owner` - Đăng ký chủ sân (ai cũng đăng ký được → RỦI RO BẢO MẬT)
- ❌ `/tournament/create` - Tạo giải đấu (không rõ ai được tạo)

### 2. **Logic menu trong Header**
- ✅ Có ẩn "Lịch sử đặt sân" cho admin/owner/staff
- ❌ Nhưng vẫn vào được bằng URL trực tiếp

### 3. **Confusion về chức năng**
- Owner có thể vào `/my-bookings` (sai logic - đây là lịch sử booking của khách)
- Owner nên vào `/owner/bookings` (quản lý booking trên sân của mình)

---

## ✅ LOGIC ĐÚNG NÊN LÀ

### 🎯 **MEMBER (role_id = 4)** - Khách hàng
**Mục đích**: Đặt sân và theo dõi lịch sử booking của mình

**Được phép truy cập**:
- ✅ `/` - Trang chủ
- ✅ `/fields` - Xem danh sách sân
- ✅ `/field/:id` - Xem chi tiết sân
- ✅ `/field-complex/:id` - Xem cụm sân + ĐẶT SÂN
- ✅ `/my-bookings` - **Lịch sử booking của chính mình**
- ✅ `/tournaments` - Xem giải đấu
- ✅ `/tournament/:id` - Chi tiết giải đấu

**KHÔNG được phép**:
- ❌ `/owner/*` - Trang quản lý owner
- ❌ `/staff/*` - Trang quản lý staff
- ❌ `/admin/*` - Trang quản trị
- ❌ `/register/field-owner` - Đăng ký owner (hoặc cần admin duyệt)
- ❌ `/tournament/create` - Tạo giải đấu (chỉ admin/owner?)

---

### 👔 **OWNER (role_id = 2)** - Chủ sân
**Mục đích**: Quản lý sân, nhân viên, doanh thu

**Được phép truy cập**:
- ✅ `/` - Trang chủ
- ✅ `/fields` - Xem danh sách sân (để tham khảo)
- ✅ `/owner/dashboard` - **Dashboard quản lý**
- ✅ `/owner/fields` - **Quản lý sân của mình**
- ✅ `/owner/staff` - **Quản lý nhân viên**
- ✅ `/owner/bookings` - **Xem booking trên sân của mình** (khác với `/my-bookings`)
- ✅ `/owner/payments` - Quản lý thanh toán
- ✅ `/owner/revenue` - Xem doanh thu

**KHÔNG được phép**:
- ❌ `/my-bookings` - **KHÔNG XEM LỊCH SỬ BOOKING KHÁCH HÀNG**
- ❌ `/booking` - Owner không đặt sân như khách
- ❌ `/staff/*` - Trang nhân viên khác
- ❌ `/admin/*` - Trang quản trị

---

### 👤 **STAFF (role_id = 3)** - Nhân viên
**Mục đích**: Hỗ trợ owner quản lý sân và booking

**Được phép truy cập**:
- ✅ `/` - Trang chủ
- ✅ `/fields` - Xem sân
- ✅ `/staff/dashboard` - **Dashboard nhân viên**
- ✅ `/staff/fields` - **Xem sân được phân công**
- ✅ `/staff/bookings` - **Xử lý booking**
- ✅ `/staff/revenue` - Xem doanh thu

**KHÔNG được phép**:
- ❌ `/my-bookings` - Không xem lịch sử booking khách
- ❌ `/owner/*` - Trang owner (trừ khi owner cho phép)
- ❌ `/admin/*` - Trang quản trị

---

### 👨‍💼 **ADMIN (role_id = 1)** - Quản trị viên
**Mục đích**: Quản lý toàn bộ hệ thống

**Được phép truy cập**:
- ✅ **TẤT CẢ TRANG**
- ✅ `/admin/dashboard` - Dashboard admin
- ✅ `/admin/users` - Quản lý users
- ✅ `/admin/owner-approvals` - Duyệt đăng ký owner
- ✅ Có thể xem tất cả booking, sân, doanh thu

---

## 🔧 HÀNH ĐỘNG CẦN THỰC HIỆN

### 1. **Bảo vệ các routes cần authentication**

```typescript
// App.tsx
// Cần thêm ProtectedRoute cho các trang sau:

// Chỉ cho MEMBER
<Route path="/my-bookings" element={
  <ProtectedRoute requiredRole={4}>
    <MyBookings />
  </ProtectedRoute>
} />

// Cần đăng nhập (không cần role cụ thể, nhưng phải auth)
<Route path="/booking" element={
  <ProtectedRoute>
    <Booking />
  </ProtectedRoute>
} />

// Có thể public hoặc cần admin duyệt
<Route path="/register/field-owner" element={
  <FieldOwnerRegistration />  // Giữ public hoặc cần admin duyệt sau
} />

// Chỉ admin/owner được tạo tournament
<Route path="/tournament/create" element={
  <ProtectedRoute requiredRole={1}>  // Hoặc cho phép owner
    <Tournament />
  </ProtectedRoute>
} />
```

### 2. **Cải thiện ProtectedRoute**
- Hỗ trợ multi-role (ví dụ: admin OR owner)
- Redirect thông minh dựa vào role

### 3. **Redirect logic thông minh**
- Member không vào `/my-bookings` → `/auth`
- Owner/Staff vào `/my-bookings` → redirect về dashboard của họ
- Admin có thể vào mọi nơi

### 4. **Navigation menu**
- ✅ Đã ẩn "Lịch sử đặt sân" cho owner/staff/admin (ĐÚNG)
- Cần đảm bảo route cũng block

---

## 📝 TÓM TẮT CẢI TIẾN

| Trang | Hiện tại | Nên sửa thành |
|-------|----------|---------------|
| `/my-bookings` | Ai cũng vào được | Chỉ MEMBER (role=4) |
| `/booking` | Public | Yêu cầu đăng nhập |
| `/register/field-owner` | Public | Cân nhắc yêu cầu admin duyệt |
| `/tournament/create` | Public | Chỉ admin/owner |
| Owner vào `/my-bookings` | Được phép | **CHẶN**, redirect về `/owner/dashboard` |
| Staff vào `/my-bookings` | Được phép | **CHẶN**, redirect về `/staff/dashboard` |

---

## 🎯 PHÂN BIỆT RÕ RÀNG

### `/my-bookings` vs `/owner/bookings`
- **`/my-bookings`** (MEMBER): "Tôi đã đặt sân nào?"
- **`/owner/bookings`** (OWNER): "Ai đã đặt sân của tôi?"

### Logic rõ ràng:
- **Member**: Khách hàng → đặt sân → xem lịch sử của mình
- **Owner**: Chủ sân → quản lý sân → xem ai đặt sân mình
- **Staff**: Nhân viên → hỗ trợ owner → xử lý booking
- **Admin**: Quản trị → toàn quyền → duyệt và giám sát

