# 🔧 Troubleshooting - Trang trắng khi vào Giải đấu / Đội bóng

## ⚠️ Vấn đề: Trang bị trắng (white screen)

Nếu bấm vào `/tournaments` hoặc `/teams` bị trang trắng, nguyên nhân có thể là:

### 1. ❌ Backend chưa chạy

**Triệu chứng:**
- Trang trắng hoàn toàn
- Console có lỗi: `ERR_CONNECTION_REFUSED` hoặc `Network Error`
- Toast hiện: "Lỗi kết nối API"

**Giải pháp:**
```bash
# Vào folder backend Laravel
cd path/to/backend

# Start Laravel server
php artisan serve

# Hoặc nếu dùng port khác:
php artisan serve --port=8000
```

**Kiểm tra:** Mở browser vào `http://localhost:8000` - phải thấy trang Laravel

---

### 2. ❌ API Routes chưa được tạo

**Triệu chứng:**
- Trang load nhưng trống, không có data
- Console có lỗi: `404 Not Found`
- API trả về HTML thay vì JSON

**Giải pháp:**

Backend phải có các routes sau trong `routes/api.php`:

```php
// Teams
Route::get('/teams', [TeamController::class, 'index']);
Route::get('/teams/{id}', [TeamController::class, 'show']);
Route::post('/teams', [TeamController::class, 'store']);
Route::put('/teams/{id}', [TeamController::class, 'update']);
Route::delete('/teams/{id}', [TeamController::class, 'destroy']);

// Tournaments
Route::get('/tournaments', [TournamentController::class, 'index']);
Route::get('/tournaments/{id}', [TournamentController::class, 'show']);
Route::post('/tournaments', [TournamentController::class, 'store']);
Route::put('/tournaments/{id}', [TournamentController::class, 'update']);
Route::put('/tournaments/{id}/publish', [TournamentController::class, 'publish']);
Route::delete('/tournaments/{id}', [TournamentController::class, 'destroy']);

// Tournament Registrations
Route::get('/tournament-registrations', [TournamentRegistrationController::class, 'index']);
Route::post('/tournament-registrations', [TournamentRegistrationController::class, 'store']);
Route::put('/tournament-registrations/{id}/approve', [TournamentRegistrationController::class, 'approve']);
Route::put('/tournament-registrations/{id}/reject', [TournamentRegistrationController::class, 'reject']);

// Matches
Route::get('/matches', [MatchController::class, 'index']);
Route::get('/matches/{id}', [MatchController::class, 'show']);
Route::post('/matches', [MatchController::class, 'store']);
Route::put('/matches/{id}/score', [MatchController::class, 'updateScore']);
Route::put('/matches/{id}', [MatchController::class, 'update']);
Route::delete('/matches/{id}', [MatchController::class, 'destroy']);

// Standings
Route::get('/standings', [StandingsController::class, 'index']);
```

**Kiểm tra routes:**
```bash
php artisan route:list | grep api
```

---

### 3. ❌ Database chưa có tables

**Triệu chứng:**
- Backend chạy nhưng trả về lỗi 500
- Console: "SQLSTATE[42S02]: Base table or view not found"

**Giải pháp:**
```bash
# Chạy migrations
php artisan migrate

# Nếu cần reset:
php artisan migrate:fresh

# Nếu có seeder:
php artisan db:seed
```

---

### 4. ❌ CORS bị block

**Triệu chứng:**
- Console: "CORS policy: No 'Access-Control-Allow-Origin' header"
- Màu đỏ trong Network tab

**Giải pháp:**

Trong backend Laravel, file `config/cors.php`:

```php
return [
    'paths' => ['api/*'],
    'allowed_methods' => ['*'],
    'allowed_origins' => ['http://localhost:5173', 'http://localhost:3000'], // Frontend URL
    'allowed_origins_patterns' => [],
    'allowed_headers' => ['*'],
    'exposed_headers' => [],
    'max_age' => 0,
    'supports_credentials' => true,
];
```

Và trong `app/Http/Middleware/Kernel.php`, đảm bảo có:
```php
protected $middleware = [
    \Illuminate\Http\Middleware\HandleCors::class,
    // ...
];
```

---

### 5. ❌ Base URL không đúng

**Triệu chứng:**
- API gọi sai địa chỉ
- Console: "Failed to fetch"

**Giải pháp:**

Kiểm tra file `src/lib/axios.ts`:

```typescript
const api = axios.create({
  baseURL: 'http://localhost:8000/api', // Đảm bảo đúng port backend
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: false,
});
```

Nếu backend chạy port khác (8080, 8888...), sửa lại cho đúng.

---

## 🛠️ Công cụ Debug

### Sử dụng API Debug Tool

Vào trang: **http://localhost:5173/api-debug**

Trang này sẽ kiểm tra kết nối tới tất cả endpoints và báo cáo:
- ✅ Endpoint nào hoạt động
- ❌ Endpoint nào lỗi
- ⏱️ Response time

### Xem Console Browser

Bấm `F12` → Tab **Console** → Xem lỗi gì:

```
❌ GET http://localhost:8000/api/tournaments net::ERR_CONNECTION_REFUSED
   → Backend chưa chạy

❌ GET http://localhost:8000/api/tournaments 404 (Not Found)
   → Route chưa có

❌ GET http://localhost:8000/api/tournaments 500 (Internal Server Error)
   → Lỗi backend code

❌ CORS policy error
   → CORS chưa config
```

### Xem Network Tab

`F12` → Tab **Network** → Xem request/response:

- **Status**: 200 OK ✅, 404 Not Found ❌, 500 Error ❌
- **Response**: Phải trả về JSON, không phải HTML
- **Headers**: Kiểm tra `Access-Control-Allow-Origin`

---

## 📝 Checklist Debug

Làm theo thứ tự:

- [ ] 1. Backend Laravel đã chạy? (`php artisan serve`)
- [ ] 2. Frontend đã chạy? (`npm run dev`)
- [ ] 3. Vào http://localhost:8000 thấy Laravel welcome page?
- [ ] 4. Vào http://localhost:8000/api/tournaments trả về JSON (hoặc error)?
- [ ] 5. Database đã migrate? (`php artisan migrate`)
- [ ] 6. Routes đã define? (`php artisan route:list | grep api`)
- [ ] 7. CORS đã config?
- [ ] 8. Base URL trong axios.ts đúng chưa?
- [ ] 9. Vào /api-debug xem status các endpoints

---

## 🎯 Quick Fixes

### Backend chưa có API?

**Nếu backend chưa có API Tournament System**, tạm thời disable:

**File: `src/pages/Tournaments.tsx`**
```typescript
// Comment dòng gọi API
// const data = await tournamentService.getAll();

// Dùng mock data tạm
const mockData = [
  {
    id: 1,
    name: 'Giải Test',
    format: 'round_robin',
    status: 'open',
    max_teams: 8,
    // ... thêm các field cần thiết
  }
];
setTournaments(mockData);
```

### Hoặc skip tournament features tạm thời

Comment import và routes trong `App.tsx` để trang không bị crash.

---

## 💡 Tips

1. **Luôn mở Browser Console** khi dev để thấy lỗi ngay
2. **Check Backend logs**: `tail -f storage/logs/laravel.log`
3. **Test API trước với Postman/Thunder Client** trước khi test trên UI
4. **Dùng /api-debug tool** để kiểm tra nhanh

---

## 🆘 Vẫn không được?

Thông tin cần cung cấp:
1. Screenshot console errors (F12 → Console tab)
2. Screenshot network errors (F12 → Network tab)
3. Backend logs (`storage/logs/laravel.log`)
4. Output của `php artisan route:list | grep api`
5. Backend đang chạy port nào?

---

**Tóm lại**: 99% trường hợp trang trắng là do **backend chưa chạy** hoặc **API routes chưa có**. Hãy kiểm tra 2 điều này trước tiên!
