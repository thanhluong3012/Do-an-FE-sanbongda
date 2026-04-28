# 🚀 Real-time Cross-Tab Sync - Hướng Dẫn Sử Dụng

## 📋 Tổng Quan

Hệ thống real-time sync cho phép **tự động đồng bộ dữ liệu** giữa các tab/window trong cùng một trình duyệt mà **không cần refresh**. Sử dụng **BroadcastChannel API** (fallback localStorage events cho trình duyệt cũ).

---

## ✨ Tính Năng Đã Implement

### 1. 🏟️ **Booking Real-time Sync**

**Kịch bản:**
- **Tab 1 (User)**: Đặt sân tại `FieldComplexDetail`
- **Tab 2 (Owner)**: Xem danh sách bookings tại `/owner/bookings`
- **Kết quả**: Tab Owner tự động hiển thị booking mới + Toast notification

**Events:**
- `booking_created` - Khi user đặt sân thành công
- `booking_cancelled` - Khi user hủy booking
- `booking_confirmed` - Khi owner xác nhận booking
- `payment_uploaded` - Khi user upload chứng từ thanh toán

**Files liên quan:**
```
src/pages/FieldComplexDetail.tsx      → Broadcast booking_created
src/pages/MyBookings.tsx               → Broadcast payment_uploaded
src/pages/owner/OwnerBookings.tsx     → Listen tất cả booking events
```

---

### 2. 💰 **Tournament Payment Real-time Sync**

**Kịch bản:**
- **Tab 1 (User)**: Xem tournament detail tại `/tournaments/:id`
- **Tab 2 (Owner)**: Xác nhận/từ chối thanh toán tại `/owner/payment-confirmation`
- **Kết quả**: Tab User tự động cập nhật payment_status + Toast notification

**Events:**
- `payment_uploaded` - User upload bill thanh toán (CreateTournament)
- `payment_confirmed` - Owner xác nhận thanh toán
- `payment_rejected` - Owner từ chối thanh toán

**Files liên quan:**
```
src/pages/TournamentDetail.tsx               → Listen payment updates
src/pages/owner/OwnerPaymentConfirmation.tsx → Broadcast & Listen
```

---

### 3. 🔧 **Architecture**

```
┌─────────────────────────────────────────────────────────┐
│                  useRealtimeSync Hook                    │
│  (Tổng quát cho tất cả events)                          │
└───────────────┬────────────────────────────┬────────────┘
                │                            │
    ┌───────────▼────────┐       ┌───────────▼───────────┐
    │ useBookingRealtimeSync│       │useTournamentRealtimeSync│
    │  (Filter booking)   │       │  (Filter tournament)  │
    └────────┬────────────┘       └───────────┬───────────┘
             │                                 │
    ┌────────▼────────────┐       ┌───────────▼──────────┐
    │  FieldComplexDetail │       │  TournamentDetail    │
    │  OwnerBookings      │       │  OwnerPaymentConf.   │
    │  MyBookings         │       │                      │
    └─────────────────────┘       └──────────────────────┘
```

---

## 🧪 Cách Test

### Test 1: Booking Flow

1. **Mở 2 tabs cùng trình duyệt:**
   - **Tab 1**: Login User → Vào `/fields` → Chọn sân → Book
   - **Tab 2**: Ctrl+T (tab mới) → Login Owner → Vào `/owner/bookings`
   - ✅ **KHÔNG CẦN incognito** vì đã dùng sessionStorage (mỗi tab session riêng)

2. **Thực hiện booking ở Tab 1:**
   - Chọn ngày, giờ → Click "Đặt sân"
   - Đợi API response thành công

3. **Kiểm tra Tab 2:**
   - ✅ Toast notification xuất hiện: "🔔 Real-time Update - Có booking mới"
   - ✅ Danh sách bookings tự động reload
   - ✅ Booking mới hiển thị mà không cần F5

4. **Console logs để debug:**
   ```
   Tab 1: 📡 [Broadcast via BroadcastChannel] booking_created
   Tab 2: 📥 [Received via BroadcastChannel] booking_created
   Tab 2: 🔔 [Owner] Received booking update
   ```

### Test 2: Payment Upload Flow

1. **Mở 2 tabs:**
   - **Tab 1**: Login User → Vào `/my-bookings`
   - **Tab 2**: Login Owner → Vào `/owner/bookings`

2. **Upload payment proof ở Tab 1:**
   - Click "Upload chứng từ thanh toán"
   - Chọn ảnh → Upload

3. **Kiểm tra Tab 2:**
   - ✅ Toast: "💳 Có chứng từ thanh toán mới"
   - ✅ Booking list reload với payment_proof_url mới

### Test 3: Tournament Payment Confirmation

1. **Mở 2 tabs:**
   - **Tab 1**: Login User → Vào `/tournaments/:id` (tournament có payment pending)
   - **Tab 2**: Login Owner → Vào `/owner/payment-confirmation`

2. **Xác nhận payment ở Tab 2:**
   - Click "Xác nhận" → Confirm

3. **Kiểm tra Tab 1:**
   - ✅ Toast: "✅ Thanh toán đã được xác nhận"
   - ✅ Payment status đổi từ "Chờ thanh toán" → "Đã thanh toán"
   - ✅ Có thể publish tournament

---

## 📊 Message Structure

```typescript
interface SyncMessage {
  type: SyncEventType;           // Loại event
  entityId: number;              // ID của entity (booking_id, tournament_id...)
  entityType: string;            // 'booking' | 'tournament' | 'field'
  relatedIds?: {                 // IDs liên quan để filter chính xác
    fieldId?: number;
    tournamentId?: number;
    bookingDate?: string;
  };
  data?: any;                    // Dữ liệu bổ sung
  timestamp: number;             // Timestamp
  tabId?: string;                // ID tab gửi (tránh self-trigger)
}
```

**Example:**
```javascript
{
  type: 'booking_created',
  entityId: 123,
  entityType: 'booking',
  relatedIds: {
    fieldId: 5,
    bookingDate: '2026-04-28'
  },
  data: {
    startTime: '14:00',
    endTime: '16:00',
    totalPrice: 500000
  },
  timestamp: 1735660800000,
  tabId: 'tab_1735660795123_a9f4j2k1'
}
```

---

## 🔍 Debugging

### Chrome DevTools Console

Mở Console ở cả 2 tabs để xem logs:

**Tab gửi:**
```
📡 [Broadcast via BroadcastChannel] booking_created: {...}
```

**Tab nhận:**
```
📥 [Received via BroadcastChannel] booking_created: {...}
🔔 [Owner] Received booking update: {...}
```

### Kiểm tra BroadcastChannel

```javascript
// Paste vào Console để test thủ công
const channel = new BroadcastChannel('app_sync');
channel.onmessage = (e) => console.log('Received:', e.data);
channel.postMessage({ type: 'test', message: 'Hello from manual test' });
```

---

## 🛠️ Mở Rộng

### Thêm Event Mới

**Bước 1:** Thêm vào `SyncEventType` trong `useRealtimeSync.ts`:
```typescript
export type SyncEventType = 
  | 'booking_created'
  | 'your_new_event'   // ← Thêm ở đây
  // ...
```

**Bước 2:** Broadcast ở component gửi:
```typescript
const { broadcast } = useRealtimeSync(handler);

broadcast({
  type: 'your_new_event',
  entityId: 123,
  entityType: 'your_entity',
  data: { /* custom data */ }
});
```

**Bước 3:** Listen ở component nhận:
```typescript
const handleUpdate = useCallback((message: SyncMessage) => {
  if (message.type === 'your_new_event') {
    // Handle your event
  }
}, []);

useRealtimeSync(handleUpdate);
```

---

## ⚡ Performance

- **BroadcastChannel API**: Zero overhead, native browser API
- **Fallback localStorage**: ~1ms latency cho cross-tab communication
- **Filter hiệu quả**: Chỉ reload data liên quan, không reload toàn bộ page
- **Tránh self-trigger**: Mỗi tab có unique `tabId`, không nhận message từ chính mình

---

## 🐛 Troubleshooting

### Không nhận được message

1. **Kiểm tra Console logs**: Xem có log "Broadcast" và "Received" không?
2. **Kiểm tra filter**: Message có bị filter bởi `relatedIds` không?
3. **Kiểm tra tabId**: Có phải cùng tab gửi và nhận không? (sẽ bị skip)
4. **Thử clear localStorage**: `localStorage.clear()` và reload

### Toast không xuất hiện

- Kiểm tra `useToast` hook có hoạt động không
- Thử log message trước khi show toast

### Data không reload

- Kiểm tra `loadData()` function có được gọi không
- Xem Network tab có API call mới không

---

## 📚 Best Practices

1. ✅ **Luôn broadcast SAU KHI API thành công**, không broadcast trước
2. ✅ **Filter message chính xác** để tránh reload không cần thiết
3. ✅ **Show toast thông báo** cho user biết có update
4. ✅ **Log console** để dễ debug khi có vấn đề
5. ✅ **Handle loading state** khi reload data
6. ❌ **Không broadcast trong useEffect** nếu không cần thiết
7. ❌ **Không reload toàn bộ page**, chỉ reload data cần thiết

---

## 🎉 Kết Luận

Hệ thống real-time sync giúp:
- ✅ **Tăng trải nghiệm người dùng**: Không cần F5 thủ công
- ✅ **Giảm confusion**: Owner thấy booking ngay lập tức
- ✅ **Tăng tính professional**: App hoạt động như SaaS hiện đại
- ✅ **Dễ mở rộng**: Thêm event mới chỉ mất vài dòng code

---

**Created:** April 28, 2026  
**Version:** 1.0.0  
**Author:** AI Assistant
