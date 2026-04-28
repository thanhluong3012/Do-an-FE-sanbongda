# 🔐 Multi-Session Support - SessionStorage Mode

## ✅ Đã Thay Đổi

**Từ:** `localStorage` (shared giữa các tab)  
**Sang:** `sessionStorage` (mỗi tab độc lập)

## 🎯 Kết Quả

✅ **Mỗi tab có thể login tài khoản khác nhau**  
✅ **F5 KHÔNG mất session** (sessionStorage persist qua reload)  
✅ **Real-time sync vẫn hoạt động** (BroadcastChannel không liên quan storage)  
✅ **Chỉ mất session khi ĐÓNG tab**

---

## 🧪 Test Ngay (Cùng 1 Trình Duyệt, 2 Tab Thường)

### **Bước 1: Mở Tab 1 (User)**
```
1. http://localhost:5173
2. Login User (email: user@example.com)
3. Kiểm tra: Console log "sessionStorage (tab-isolated)"
4. Vào /fields → Chọn sân
```

### **Bước 2: Mở Tab 2 (Owner) - CỬA SỔ MỚI**
```
1. Ctrl + T (tab mới CÙNG trình duyệt)
2. http://localhost:5173
3. Login Owner (email: owner@example.com)
4. ✅ Tab 1 VẪN login User, Tab 2 login Owner
5. Vào /owner/bookings
```

### **Bước 3: Test Real-time Sync**
```
Tab 1 (User): Đặt sân → Click "Đặt sân"
Tab 2 (Owner): 🔔 Toast xuất hiện + Booking mới hiện ngay lập tức
```

### **Bước 4: Test Reload (F5)**
```
Tab 1: Nhấn F5 → ✅ VẪN login User (không bị đổi sang Owner)
Tab 2: Nhấn F5 → ✅ VẪN login Owner
```

---

## 📊 So Sánh

| Feature | localStorage (Cũ) | sessionStorage (Mới) |
|---------|-------------------|----------------------|
| **Share giữa tabs** | ✅ Có | ❌ Không |
| **Persist qua reload** | ✅ Có | ✅ Có |
| **Mỗi tab session riêng** | ❌ Không | ✅ Có |
| **Mất khi đóng tab** | ❌ Không | ✅ Có |
| **Test 2 accounts** | ❌ Cần incognito | ✅ Cùng trình duyệt |

---

## 🔍 Debug Console

Mở Console để xem logs:

**Khi login:**
```
✅ Auth token saved to sessionStorage
🔐 Auth Storage initialized: sessionStorage (tab-isolated)
```

**Check current auth:**
```javascript
window.authStorage.info()
// Output:
{
  hasToken: true,
  user: { email: "user@example.com", role_id: 4 },
  storageType: "sessionStorage"
}
```

**Clear auth manually:**
```javascript
window.authStorage.clear()
```

---

## 🛠️ Files Đã Update

✅ `src/lib/authStorage.ts` (NEW) - Storage wrapper  
✅ `src/lib/authUtils.ts` - Dùng authStorage  
✅ `src/hooks/useAuth.tsx` - Dùng authStorage  
✅ `src/lib/axios.ts` - Dùng sessionStorage  
✅ `src/services/tournamentService.ts` - Check sessionStorage  
✅ `src/pages/TournamentDetail.tsx` - Check sessionStorage

---

## 🎉 Lợi Ích

1. **Test dễ hơn**: Không cần incognito, không cần 2 browser
2. **UX tốt hơn**: Mỗi tab có session riêng, rõ ràng hơn
3. **Bảo mật**: Session tự động mất khi đóng tab
4. **Real-time sync vẫn hoạt động**: BroadcastChannel độc lập với storage

---

## ⚠️ Lưu Ý

- **Đóng tab = Mất session** → User cần login lại nếu đóng tab
- **Duplicate tab (Ctrl+Shift+T)** → Session KHÔNG copy sang tab mới
- **Nếu muốn session persistent** → Đổi `STORAGE` trong authStorage.ts về localStorage

---

**Giờ bạn có thể test 2 tài khoản khác nhau trên 2 tab thường của cùng 1 trình duyệt! 🚀**
