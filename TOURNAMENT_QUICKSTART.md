# 🎯 Quick Start - Tournament System

## 🚀 Khởi động ứng dụng

```bash
# Install dependencies (nếu chưa)
npm install

# Start development server
npm run dev
```

## 📍 Các trang chính

### Public Pages
- **`/tournaments`** - Danh sách tất cả giải đấu
- **`/tournament/:id`** - Chi tiết giải đấu (với tabs: Info, Đăng ký, Lịch thi đấu, Bảng xếp hạng)
- **`/teams`** - Quản lý đội bóng

### Admin Pages  
- **`/admin/tournaments`** - Quản lý toàn bộ giải đấu (CRUD, Publish)

### Create Tournament
- **`/tournament/create`** - Tạo giải đấu mới (Admin/Owner only)

## 🎮 User Flows

### 1️⃣ **User thường xem và đăng ký giải**

```
1. Vào /tournaments → Xem danh sách giải
2. Click vào giải → Xem chi tiết
3. Nếu giải status = "open" → Click "Đăng ký tham gia"
4. Chọn đội của mình → Submit
5. Chờ admin duyệt
```

### 2️⃣ **Admin tạo và quản lý giải đấu**

```
1. Vào /admin/tournaments hoặc /tournament/create
2. Điền form:
   - Tên giải
   - Thể thức (Round Robin / Knockout / Group + Knockout)
   - Số đội min/max
   - Thời gian đăng ký & thi đấu
   - Chọn cụm sân
3. Submit → Giải tạo với status = "draft"
4. Kiểm tra lại → Click "Publish" → Chuyển status = "open"
5. User bắt đầu đăng ký
```

### 3️⃣ **Admin duyệt đăng ký**

```
1. Vào /tournament/:id
2. Tab "Đăng ký" → Xem danh sách pending
3. Click "Duyệt" hoặc "Từ chối"
4. Nếu từ chối → Nhập lý do
```

### 4️⃣ **Admin cập nhật tỷ số**

```
1. Vào /tournament/:id
2. Tab "Lịch thi đấu" → Click vào trận đấu
3. Nhập tỷ số home và away
4. Submit → Backend tự động:
   - Tính điểm
   - Cập nhật bảng xếp hạng
   - Tiến đội thắng vào vòng sau (nếu knockout)
5. Tab "Bảng xếp hạng" → Xem real-time update
```

## 🎨 Các thể thức giải đấu

### 🔄 **Round Robin (Vòng tròn)**
- Tất cả đội đấu với nhau
- Tính điểm: Thắng +3, Hòa +1, Thua 0
- Xếp hạng theo: Điểm → Hiệu số → Bàn thắng

### ⚔️ **Knockout (Loại trực tiếp)**  
- Thua là bị loại
- Backend tự động tiến đội thắng vào vòng sau
- Không có bảng xếp hạng

### 🏆 **Group + Knockout (World Cup style)**
- Giai đoạn 1: Chia bảng, đấu vòng tròn
- Top 2 mỗi bảng tiến vào knockout
- Giai đoạn 2: Loại trực tiếp

## 🔐 API Configuration

API base URL: `http://localhost:8000/api`

JWT token tự động thêm vào header bởi axios interceptor:
```typescript
// src/lib/axios.ts
Authorization: Bearer {token}
```

## 📦 Key Components

### Services
```
src/services/
├── teamService.ts          # CRUD đội bóng
├── tournamentService.ts    # CRUD giải đấu + publish
├── registrationService.ts  # Đăng ký + approve/reject
├── matchService.ts         # Matches + update score
└── standingsService.ts     # Bảng xếp hạng
```

### Components
```
src/components/
├── Team/
│   ├── TeamCard.tsx
│   ├── TeamFormDialog.tsx
│   └── TeamList.tsx
├── Tournament/
│   ├── TournamentCard.tsx
│   ├── TournamentFormDialog.tsx
│   └── TournamentStatusBadge.tsx
├── Registration/
│   ├── RegistrationList.tsx
│   └── RegistrationFormDialog.tsx
├── Match/
│   ├── MatchCard.tsx
│   └── UpdateScoreDialog.tsx
└── Standings/
    └── GroupStandingsTable.tsx
```

## 🐛 Troubleshooting

### API không kết nối được?
```bash
# Kiểm tra backend đã chạy chưa
# Backend phải chạy ở http://localhost:8000
```

### 401 Unauthorized?
```bash
# Token hết hạn hoặc chưa đăng nhập
# Login lại tại /auth
```

### Không thấy nút Approve/Reject?
```bash
# Chỉ admin mới thấy
# Kiểm tra role trong auth context
```

## 📚 More Info

Xem file [TOURNAMENT_IMPLEMENTATION.md](./TOURNAMENT_IMPLEMENTATION.md) để biết chi tiết đầy đủ về:
- Kiến trúc hệ thống
- Data flow
- Components structure
- API endpoints
- Features đầy đủ

---

**Happy Coding!** ⚽🎉
