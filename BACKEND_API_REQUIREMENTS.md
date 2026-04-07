# Yêu cầu API Backend - Publish/Unpublish Schedule

## Tính năng: Công khai/Ẩn lịch thi đấu

Frontend đã implement tính năng cho phép ban tổ chức công khai hoặc ẩn lịch thi đấu:
- **Chưa public**: Chỉ organizer/admin xem được lịch
- **Đã public**: Tất cả user có thể xem lịch

## Bảng API Endpoints

| Tình huống | API | Method | Headers |
|-----------|-----|--------|---------|
| Sinh lịch | `/api/tournaments/{id}/generate-schedule` | POST | Auth |
| Công bố lịch | `/api/tournaments/{id}/publish-schedule` | POST | Auth |
| Ẩn lịch | `/api/tournaments/{id}/unpublish-schedule` | POST | Auth |
| Xem lịch (đã login) | `/api/tournaments/{id}/bracket` | GET | Auth |
| Xem lịch (public) | `/api/public/tournaments/{id}/bracket` | GET | None |

### API Endpoints cần implement

#### 1. POST `/api/tournaments/{id}/publish-schedule`

**Mô tả:** Công khai lịch thi đấu cho user xem

**Headers:**
```
Authorization: Bearer {token}
```

**Response Success (200):**
```json
{
  "success": true,
  "message": "Lịch thi đấu đã được công khai",
  "data": {
    "id": 1,
    "name": "Giải bóng đá ABC",
    "schedule_published": true,
    ...
  }
}
```

**Logic Backend:**
1. Kiểm tra quyền (chỉ organizer hoặc admin)
2. Kiểm tra giải đấu có tồn tại không
3. Kiểm tra đã có lịch thi đấu chưa (phải có matches)
4. Cập nhật field `schedule_published = true` trong bảng tournaments
5. Trả về tournament data đầy đủ

---

#### 2. POST `/api/tournaments/{id}/unpublish-schedule`

**Mô tả:** Ẩn lịch thi đấu khỏi public (chỉ organizer/admin xem được)

**Headers:**
```
Authorization: Bearer {token}
```

**Response Success (200):**
```json
{
  "success": true,
  "message": "Lịch thi đấu đã được ẩn",
  "data": {
    "id": 1,
    "name": "Giải bóng đá ABC",
    "schedule_published": false,
    ...
  }
}
```

**Logic Backend:**
1. Kiểm tra quyền (chỉ organizer hoặc admin)
2. Kiểm tra giải đấu có tồn tại không
3. Cập nhật field `schedule_published = false` trong bảng tournaments
4. Trả về tournament data đầy đủ

---

#### 3. GET `/api/tournaments/{id}/bracket` (Auth Required)

**Mô tả:** Xem bracket cho organizer/admin (xem cả lịch chưa publish)

**Headers:**
```
Authorization: Bearer {token}
```

**Response Success (200):**
```json
{
  "success": true,
  "data": {
    "tournament": { ... },
    "teams": [ ... ],
    "rounds": [ ... ],
    "groups": [ ... ]
  }
}
```

**Logic Backend:**
- Chỉ organizer hoặc admin của tournament mới truy cập được
- Trả về bracket dù `schedule_published = true/false`

---

#### 4. GET `/api/public/tournaments/{id}/bracket` (Public)

**Mô tả:** Xem bracket công khai (không cần auth)

**Headers:** Không cần Authorization

**Response Success (200):**
```json
{
  "success": true,
  "data": {
    "tournament": { ... },
    "teams": [ ... ],
    "rounds": [ ... ],
    "groups": [ ... ]
  }
}
```

**Response Forbidden (403):**
```json
{
  "success": false,
  "message": "Lịch thi đấu chưa được công bố"
}
```

**Logic Backend:**
- Kiểm tra `schedule_published = true` mới trả về bracket
- Nếu `schedule_published = false` → 403 Forbidden
- Không cần authentication

---

#### 5. Cập nhật Tournament API Response

Tất cả API trả về tournament data cần bao gồm field `schedule_published`:

- GET `/api/public/tournaments/{id}`
- GET `/api/tournaments/{id}`
- GET `/api/tournaments`
- POST `/api/tournaments/{id}/publish`
- POST `/api/tournaments/{id}/generate-schedule`
- POST `/api/tournaments/{id}/publish-schedule`
- POST `/api/tournaments/{id}/unpublish-schedule`

**Example Response:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "name": "Giải bóng đá ABC",
    "status": "open",
    "schedule_published": false,
    ...
  }
}
```

---

## Migration Database

**Thêm column vào table tournaments:**
```sql
ALTER TABLE tournaments ADD COLUMN schedule_published BOOLEAN DEFAULT FALSE;
```

---

## Frontend Implementation

### Files đã được cập nhật:

1. **`src/services/tournamentService.ts`**
   - Thêm field `schedule_published` vào Tournament interface
   - Thêm method `publishSchedule(id)`
   - Thêm method `unpublishSchedule(id)`
   - Update method `getBracket(id, isOrganizer)` để dùng public/auth endpoint

2. **`src/pages/TournamentDetail.tsx`**
   - State: `isPublishingSchedule`, `isUnpublishingSchedule`
   - Handler: `handlePublishSchedule()`, `handleUnpublishSchedule()`
   - Logic kiểm tra quyền trong `loadBracket()` để gọi đúng endpoint
   - Hiển thị message khi lịch chưa công khai (user thường)

3. **`src/components/Match/ScheduleBuilder.tsx`**
   - Nút "Công khai lịch đấu" (màu xanh lá)
   - Nút "Ẩn lịch đấu" (màu cam) - hiển thị khi đã publish
   - Badge "Đã công khai" ở header
   - Banner xanh dương: Lịch chưa công khai
   - Banner xanh lá: Lịch đã công khai

---

## Luồng hoạt động

1. **Ban tổ chức tạo giải đấu** → status = 'draft', schedule_published = false
2. **Mở đăng ký** → status = 'open' (nút "Mở đăng ký")
3. **Duyệt các đội đăng ký** → approved teams
4. **Sinh lịch thi đấu** → tạo matches (nút "Tự động sinh lịch")
5. **Công khai lịch** → schedule_published = true (nút "Công khai lịch đấu")
6. **User xem lịch** → GET `/api/public/tournaments/{id}/bracket` (nếu published = true)
7. **Ẩn lịch (nếu cần)** → schedule_published = false (nút "Ẩn lịch đấu")

---

## Testing

### Test Case 1: Organizer publish schedule
- Login as organizer
- Tạo giải đấu, sinh lịch
- Click "Công khai lịch đấu"
- Verify: `schedule_published = true`
- Verify: Badge "Đã công khai" hiển thị

### Test Case 2: Organizer unpublish schedule
- Login as organizer (giải đã public)
- Click "Ẩn lịch đấu"
- Verify: `schedule_published = false`
- Verify: User thường không xem được lịch

### Test Case 3: User không xem được lịch chưa public
- Login as member
- Vào tournament detail → tab "Lịch đấu"
- GET `/api/public/tournaments/{id}/bracket` → 403 Forbidden
- Verify: Hiển thị message "Lịch thi đấu chưa được công bố"

### Test Case 4: User xem được lịch đã public
- Organizer đã publish schedule
- Login as member (hoặc không login)
- Vào tournament detail → tab "Lịch đấu"
- GET `/api/public/tournaments/{id}/bracket` → 200 OK
- Verify: Hiển thị danh sách matches

### Test Case 5: Admin luôn xem được lịch
- Login as admin
- Vào tournament detail → tab "Lịch đấu"
- GET `/api/tournaments/{id}/bracket` (auth endpoint)
- Verify: Xem được lịch dù `schedule_published = false`

### Test Case 6: Organizer luôn xem được lịch của mình
- Login as organizer
- Vào tournament detail của giải mình tạo
- GET `/api/tournaments/{id}/bracket` (auth endpoint)
- Verify: Xem được lịch dù `schedule_published = false`

---

## API Routes Summary (PHP Laravel)

```php
// routes/api.php

Route::middleware('jwt.auth')->group(function () {
    
    // ===== SCHEDULE MANAGEMENT =====
    
    // Sinh lịch tự động
    Route::post('tournaments/{id}/generate-schedule', [TournamentController::class, 'generateSchedule']);
    
    // Công khai lịch
    Route::post('tournaments/{id}/publish-schedule', [TournamentController::class, 'publishSchedule']);
    
    // Ẩn lịch
    Route::post('tournaments/{id}/unpublish-schedule', [TournamentController::class, 'unpublishSchedule']);
    
    // Xem bracket (Auth - cho organizer/admin)
    Route::get('tournaments/{id}/bracket', [TournamentController::class, 'getBracket']);
    
    // Xóa lịch
    Route::delete('tournaments/{id}/schedule', [TournamentController::class, 'resetSchedule']);
});

// Public routes
Route::prefix('public')->group(function () {
    // Xem bracket công khai (chỉ khi schedule_published = true)
    Route::get('tournaments/{id}/bracket', [TournamentController::class, 'getPublicBracket']);
});
```

---

## Controller Methods (Example)

```php
// app/Http/Controllers/Api/TournamentController.php

public function publishSchedule($id)
{
    $tournament = Tournament::findOrFail($id);
    
    // Check permission
    if ($tournament->organizer_id !== auth()->id() && !auth()->user()->isAdmin()) {
        return response()->json([
            'success' => false,
            'message' => 'Unauthorized'
        ], 403);
    }
    
    // Check if schedule exists
    if ($tournament->matches()->count() === 0) {
        return response()->json([
            'success' => false,
            'message' => 'Chưa có lịch thi đấu để công khai'
        ], 400);
    }
    
    $tournament->update(['schedule_published' => true]);
    
    return response()->json([
        'success' => true,
        'message' => 'Lịch thi đấu đã được công khai',
        'data' => $tournament->load(['organizer', 'field_cluster'])
    ]);
}

public function unpublishSchedule($id)
{
    $tournament = Tournament::findOrFail($id);
    
    // Check permission
    if ($tournament->organizer_id !== auth()->id() && !auth()->user()->isAdmin()) {
        return response()->json([
            'success' => false,
            'message' => 'Unauthorized'
        ], 403);
    }
    
    $tournament->update(['schedule_published' => false]);
    
    return response()->json([
        'success' => true,
        'message' => 'Lịch thi đấu đã được ẩn',
        'data' => $tournament->load(['organizer', 'field_cluster'])
    ]);
}

public function getPublicBracket($id)
{
    $tournament = Tournament::findOrFail($id);
    
    // Check if schedule is published
    if (!$tournament->schedule_published) {
        return response()->json([
            'success' => false,
            'message' => 'Lịch thi đấu chưa được công bố'
        ], 403);
    }
    
    // Return bracket data (same structure as getBracket)
    return $this->buildBracketResponse($tournament);
}

public function getBracket($id)
{
    $tournament = Tournament::findOrFail($id);
    
    // Check permission - only organizer or admin
    if ($tournament->organizer_id !== auth()->id() && !auth()->user()->isAdmin()) {
        return response()->json([
            'success' => false,
            'message' => 'Unauthorized'
        ], 403);
    }
    
    // Return bracket data regardless of schedule_published status
    return $this->buildBracketResponse($tournament);
}

private function buildBracketResponse($tournament)
{
    // Build and return bracket structure
    $data = [
        'tournament' => $tournament,
        'teams' => $tournament->approvedTeams(),
        'rounds' => $tournament->rounds()->with('matches')->get(),
        'groups' => $tournament->groups()->with('matches')->get(),
    ];
    
    return response()->json([
        'success' => true,
        'data' => $data
    ]);
}
```

---

## Notes

- Field `schedule_published` độc lập với field `status` của tournament
- Có thể có tournament `status = 'open'` nhưng `schedule_published = false`
- Chỉ organizer và admin mới có quyền publish/unpublish
- Public endpoint không cần authentication (dùng cho guest users)
- Auth endpoint yêu cầu token và kiểm tra quyền organizer/admin
