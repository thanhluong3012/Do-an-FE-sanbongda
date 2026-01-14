# Dự án Đặt Sân Bóng

Ứng dụng web đặt sân bóng đá được xây dựng với React, TypeScript, Vite, Supabase và Tailwind CSS.

## 📋 Mục lục

- [Yêu cầu hệ thống](#yêu-cầu-hệ-thống)
- [Công nghệ sử dụng](#công-nghệ-sử-dụng)
- [Cài đặt](#cài-đặt)
- [Cấu hình](#cấu-hình)
- [Chạy dự án](#chạy-dự-án)
- [Build dự án](#build-dự-án)
- [Cấu trúc thư mục](#cấu-trúc-thư-mục)

## 🔧 Bước 1: Cài đặt môi trường phát triển

### 1.1. Cài đặt Node.js

**Phiên bản khuyến nghị: Node.js 20.x LTS (Long Term Support)**

#### Windows:

1. Truy cập [https://nodejs.org/](https://nodejs.org/)
2. Tải phiên bản **20.x LTS** (nút màu xanh lá)
3. Chạy file `.msi` vừa tải về
4. Làm theo hướng dẫn cài đặt (Next → Next → Install)
5. Khởi động lại máy tính sau khi cài đặt

#### macOS:

```bash
# Sử dụng Homebrew (khuyến nghị)
brew install node@20

# Hoặc tải trực tiếp từ nodejs.org
```

#### Linux (Ubuntu/Debian):

```bash
# Sử dụng NodeSource
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs
```

### 1.2. Kiểm tra cài đặt thành công

Mở **Command Prompt** (Windows) hoặc **Terminal** (macOS/Linux) và chạy:

```bash
node --version
```
Kết quả phải hiển thị: `v20.x.x` (ví dụ: v20.11.0)

```bash
npm --version
```
Kết quả phải hiển thị: `10.x.x` (npm đi kèm với Node.js)

> **Lưu ý:** Nếu lệnh không hoạt động, khởi động lại terminal hoặc máy tính.

### 1.3. Cài đặt Bun (Tùy chọn - Khuyến nghị)

Bun nhanh hơn npm rất nhiều. Dự án này đã sử dụng Bun.

#### Windows:

```powershell
# Mở PowerShell với quyền Administrator và chạy:
powershell -c "irm bun.sh/install.ps1 | iex"
```

#### macOS/Linux:

```bash
curl -fsSL https://bun.sh/install | bash
```

Kiểm tra:
```bash
bun --version
```

### 1.4. Cài đặt Git

#### Windows:
1. Tải Git từ [https://git-scm.com/download/win](https://git-scm.com/download/win)
2. Cài đặt với các tùy chọn mặc định

#### macOS:
```bash
brew install git
```

#### Linux:
```bash
sudo apt-get install git
```

Kiểm tra:
```bash
git --version
```

## 🚀 Công nghệ sử dụng

Dự án được xây dựng với các công nghệ hiện đại:

### Core
- **React 18.3.1** - Thư viện UI
- **TypeScript 5.8.3** - Typed JavaScript
- **Vite 5.4.19** - Build tool & dev server
- **React Router Dom 6.30.1** - Routing

### Backend & Database
- **Supabase** - Backend as a Service (Authentication, Database, Storage)
- **@tanstack/react-query** - Server state management

### UI & Styling
- **Tailwind CSS 3.4.17** - Utility-first CSS
- **shadcn/ui** - Component library
- **Radix UI** - Accessible component primitives
- **Lucide React** - Icon library

### Form & Validation
- **React Hook Form** - Form handling
- **Zod** - Schema validation
- **@hookform/resolvers** - Form validation integration

## 📦 Bước 2: Tải và cài đặt dự án

### 2.1. Clone repository về máy

Mở **Terminal** (hoặc Command Prompt/PowerShell trên Windows):

```bash
# Di chuyển đến thư mục bạn muốn lưu dự án (ví dụ: D:/)
cd D:/

# Clone dự án về
git clone <URL_REPOSITORY_CỦA_BẠN> Do-an-FE

# Di chuyển vào thư mục dự án
cd Do-an-FE
```

> **Thay thế** `<URL_REPOSITORY_CỦA_BẠN>` bằng URL git thực tế của bạn.

### 2.2. Cài đặt các thư viện cần thiết

Dự án này sử dụng **Bun** làm package manager. Bạn có thể chọn **Bun** (nhanh hơn) hoặc **npm**.

#### Phương án A: Sử dụng Bun (Khuyến nghị - nhanh hơn 10-20 lần)

```bash
bun install
```

Quá trình này sẽ:
- Tải tất cả các thư viện cần thiết (React, TypeScript, Supabase, v.v.)
- Tạo thư mục `node_modules` chứa các thư viện
- Mất khoảng 30-60 giây

#### Phương án B: Sử dụng npm (Mặc định đi kèm Node.js)
Bước 3: Cấu hình kết nối Backend (Supabase)

### 3.1. Tạo tài khoản Supabase (Miễn phí)

1. Truy cập [https://supabase.com/](https://supabase.com/)
2. Click **Start your project** → **Sign Up**
3. Đăng ký bằng GitHub hoặc email
4. Xác nhận email

### 3.2. Tạo Project mới

1. Sau khi đăng nhập, click **New Project**
2. Điền thông tin:
   - **Name**: `do-an-fe` (hoặc tên bạn thích)
   - **Database Password**: Tạo mật khẩu mạnh (lưu lại để sau này sử dụng)
   - **Region**: Chọn **Southeast Asia (Singapore)** (gần VN nhất)
3. Click **Create new project**
4. Đợi 1-2 phút để Supabase khởi tạo

### 3.3. Lấy API Keys

1. Vào project vừa tạo
2. Click biểu tượng **Settings** (bánh răng) ở sidebar bên trái
3. Chọn **API** trong menu Settings
4. Bạn sẽ thấy 2 thông tin quan trọng:
   - **Project URL**: Dạng `https://xxxxx.supabase.co`
   - **anon/public key**: Chuỗi dài bắt đầu bằng `eyJ...`
5. **LƯU LẠI** 2 thông tin này

### 3.4. Tạo file cấu hình .env

Quay lại terminal, đang ở thư mục dự án `Do-an-FE`:

#### Windows (PowerShell):
```powershell
New-Item .env -ItemType File
```

#### macOS/Linux:
```basBước 4: Chạy dự án

### 4.1. Khởi động Development Server

Trong terminal, tại thư mục dự án `Do-an-FE`, chạy lệnh:

#### Nếu dùng Bun:
```bash
bun run dev
```

#### Nếu dùng npm:
```bash
npm run dev
```

### 4.2. Kết quả mong đợi

Terminal sẽ hiển thị:

```
VITE v5.4.19  ready in 500 ms

  ➜  Local:   http://localhost:8080/
  ➜  Network: http://192.168.x.x:8080/
  ➜  press h + enter to show help
```

### 4.3. Mở trình duyệt

1. Mở trình duyệt (Chrome, Edge, Firefox)
2. Truy cập: **http://localhost:8080**
3. Bạn sẽ thấy trang web đặt sân bóng

### 4.4. Kiểm tra hoạt động

- Trang chủ hiển thị các section: Hero, Features, Fields, Matches, Booking
- Click vào các menu để di chuyển
- Thử đăng nhập/đăng ký (nếu đã setup Supabase đúng)

### 4.5. Dừng server

Để dừng server, trong terminal nhấn:
```
Ctrl + C
```

Sau đó chọn `Y` (Yes) để xác nhận.

## 🔄 Các lần chạy tiếp theo

Sau lần đầu cài đặt, mỗi lần muốn chạy dự án:

```bash
# 1. Mở terminal
# 2. Di chuyển đến thư mục dự án
cd D:/Do-an-FE

# 3. Chạy dev server
bun run dev
# hoặc
npm run dev

# 4. Mở trình duyệt tại http://localhost:8080
```

**Chỉ mất 30 giây!** Không cần cài đặt lại. 3.6. Setup Database Schema (Optional)

Nếu database chưa có bảng:

1. Vào Supabase Dashboard → **SQL Editor** (thanh bên trái)
2. Click **New query**
3. Mở file `supabase/migrations/20260109061142_b19a3694-e619-4908-b50a-cc5190235041.sql` trong dự án
4. Copy toàn bộ nội dung và paste vào SQL Editor
5. Click **Run** để tạo các bảng cần thiết

1. Truy cập [Supabase Dashboard](https://app.supabase.com/)
2. Chọn project của bạn (hoặc tạo project mới)
3. Vào **Settings** → **API**
4. Copy:
   - **Project URL** → `VITE_SUPABASE_URL`
   - **anon/public key** → `VITE_SUPABASE_PUBLISHABLE_KEY`

### Bước 3: Cấu hình Database (Optional)

Nếu cần setup database từ đầu:

1. Vào Supabase Dashboard → **SQL Editor**
2. Chạy migration từ file `supabase/migrations/20260109061142_b19a3694-e619-4908-b50a-cc5190235041.sql`

## 🏃 Chạy dự án

### Development Mode

Khởi động server phát triển với hot-reload:

**Sử dụng Bun:**
```bash
bun run dev
```

**Sử dụng npm:**
```bash
npm run dev
```

Ứng dụng sẽ chạy tại: **http://localhost:8080**

### Preview Production Build

Để xem trước bản build production:

```bash
# Build trước
bun run build  # hoặc npm run build

# Sau đó preview
bun run preview  # hoặc npm run preview
```

## 🏗️ Build dự án

### Production Build

Tạo bản build tối ưu cho production:

```bash
bun run build
# hoặc
npm run build
```

Build output sẽ được tạo trong thư mục `dist/`.

### Development Build

Build ở chế độ development (với source maps):

```bash
bun run build:dev
# hoặc
npm run build:dev
```

## 📁 Cấu trúc thư mục

```
Do-an-FE/
├── public/              # Static assets
│   └── robots.txt
├── src/
│   ├── assets/          # Images, fonts, etc.
│   ├── components/      # React components
│   │   ├── layout/      # Layout components (Header, Footer)
│   │   ├── sections/    # Page sections (Hero, Features, etc.)
│   │   ├── ui/          # shadcn/ui components
│   │   └── NavLink.tsx  # Navigation component
│   ├── hooks/           # Custom React hooks
│   │   ├── useAuth.tsx  # Authentication hook
│   │   └── use-toast.ts # Toast notifications
│   ├── integrations/    # External services
│   │   └── supabase/    # Supabase client & types
│   ├── lib/             # Utility functions
│   │   └── utils.ts
│   ├── pages/           # Page components
│   │   ├── Index.tsx    # Home page
│   │   ├── Auth.tsx     # Authentication page
│   │   ├── Booking.tsx  # Booking page
│   │   └── NotFound.tsx # 404 page
│   ├── App.tsx          # Main App component
│   ├── main.tsx         # Entry point
│   └── index.css        # Global styles
├── supabase/
│   ├── config.toml      # Supabase config
│   └── migrations/      # Database migrations
├── .env                 # Environment variables (create this)
├── package.json         # Dependencies & scripts
├── vite.config.ts       # Vite configuration
├── tailwind.config.ts   # Tailwind CSS config
└── tsconfig.json        # TypeScript config
```

## 🔍 Scripts có sẵn

```bash
# Chạy development server
bun run dev              # hoặc npm run dev

# Build cho production
bun run build            # hoặc npm run build

# Build cho development
bun run build:dev        # hoặc npm run build:dev

# Lint code
bun run lint             # hoặc npm run lint

# Preview production build
bun run preview          # hoặc npm run preview
```

## 🌐 Routes có sẵn

- `/` - Trang chủ
- `/auth` - Trang đăng nhập/đăng ký
- `/booking` - Trang đặt sân
- `*` - Trang 404 Not Found

## 🛠️ Troubleshooting

### Port 8080 đã được sử dụng

Nếu port 8080 đã được sử dụng, bạn có thể thay đổi trong `vite.config.ts`:

```typescript
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 3000, // Thay đổi port tại đây
  },
  // ...
}));
```

### Lỗi kết nối Supabase

Kiểm tra lại file `.env` và đảm bảo:
- File `.env` nằm ở thư mục root
- Các biến môi trường được đặt tên chính xác: `VITE_SUPABASE_URL` và `VITE_SUPABASE_PUBLISHABLE_KEY`
- Restart dev server sau khi thay đổi `.env`

### Lỗi install dependencies

Nếu gặp lỗi khi install:
1. Xóa `node_modules` và `bun.lockb` (hoặc `package-lock.json`)
2. Chạy lại `bun install` hoặc `npm install`

```bash
# Windows PowerShell
Remove-Item -Recurse -Force node_modules, bun.lockb
bun install

# macOS/Linux
rm -rf node_modules bun.lockb
bun install
```

## 📝 Ghi chú

- Dự án sử dụng **Bun** làm package manager chính (có file `bun.lockb`)
- Server development mặc định chạy tại port **8080**
- Supabase được sử dụng cho authentication và database
- UI components từ **shadcn/ui** đã được cài đặt sẵn

## 📞 Hỗ trợ

Nếu gặp vấn đề trong quá trình cài đặt hoặc chạy dự án, vui lòng tạo issue trên repository.

---

**Happy Coding! ⚽️**

