# fekrik — Giao diện React + Vite

FE cho hệ thống Krik (Công & KPI nhân viên cửa hàng). Gọi sang API `bekrik` qua proxy.

> Tài liệu chính (kiến trúc, ERD, permission, công thức) ở `../bekrik/README.md` và `../bekrik/docs/design.md`.
> README này chỉ tập trung phần FE.

## 1. Tech stack

| Lớp | Công nghệ | Lý do |
| --- | --- | --- |
| Framework | **React 19 + Vite 8** | HMR cực nhanh, build tree-shake tốt |
| Ngôn ngữ | **TypeScript 6** | Type-mirror DTO BE → cảnh báo sớm khi đổi contract |
| Router | **React Router 7** (file `App.tsx`) | Nested route + redirect tiện cho layout đăng nhập |
| HTTP | **axios 1.x** + interceptor lưu JWT | Bắt 401 toàn cục → đẩy về `/login` |
| Auth | `AuthContext` (`src/auth/`) | Lưu token & user vào `localStorage`, cung cấp `useAuth()` |
| Style | CSS thuần (`src/theme/fisa-theme.css`) | Không cần thêm dependency, kiểm soát visual rõ |

## 2. Chạy local

### 2.1 Cách 1: 1 lệnh chạy cả BE + FE

Trong `../bekrik` (PowerShell):

```powershell
.\start-dev.ps1
```

Script tự `npm install` (nếu cần) rồi spawn `dotnet run` + `npm run dev` song song.

### 2.2 Cách 2: chạy riêng FE

Đảm bảo API `bekrik` đã chạy tại `http://localhost:5207` trước, rồi:

```powershell
cd fekrik
npm install
npm run dev
# Mở http://localhost:5173
```

Vite **proxy** mọi request `/api/*` sang `http://localhost:5207` (xem `vite.config.ts`). Khi build tĩnh hoặc deploy, đặt `VITE_API_BASE` chỉ tới origin API thật.

## 3. Cấu trúc thư mục

```
src/
├─ api/           # tất cả call HTTP (krikApi.ts, client.ts)
├─ auth/          # AuthContext + token storage
├─ routes/        # RequireAuth, RequireRole guard
├─ layout/        # AppLayout (sidebar + header)
├─ pages/
│  ├─ StoresPage.tsx
│  ├─ LoginPage.tsx
│  ├─ AdminPage.tsx
│  └─ shiftKpi/
│     ├─ DailyShiftPage.tsx     # bảng công ngày, save-on-blur
│     ├─ MonthlyShiftPage.tsx   # dashboard tháng (default /app)
│     ├─ KpiConfigPage.tsx      # cấu hình KPI (workflow Accept)
│     ├─ StaffListPage.tsx
│     └─ PayrollPage.tsx
├─ components/    # MoneyCellInput (commit on blur)
├─ hooks/         # useShiftKpiStoreId (đồng bộ store theo role)
├─ utils/         # formatMoneyEn / parseMoneyEn
├─ types/         # api.ts, shiftKpi.ts — type-mirror DTO BE
└─ theme/         # fisa-theme.css
```

## 4. Mỗi màn hình dùng những API nào, để làm gì

Mục đích phần này: đọc 1 nhịp là biết ngay "màn X gọi API Y để làm gì, có công thức tính gì". Mã nguồn công thức gốc nằm ở `../bekrik/src/Krik.Api/Services/ShiftKpiMath.cs` và `StoreShiftKpiController.cs`.

### 4.1 Đăng nhập — `LoginPage` (`src/pages/LoginPage.tsx`)

Mục đích: lấy JWT để vào hệ thống.

APIs:
- **POST `/api/auth/login`** — gửi email + mật khẩu, nhận về JWT + thông tin user. BE verify mật khẩu bằng `BCrypt.Verify`, ký JWT có claim `role` + `storeId`.
- **GET `/api/auth/me`** — khi reload app, FE gọi lại để rehydrate `AuthContext` (lấy thông tin user từ JWT đã lưu trong `localStorage`).

Không có công thức tính.

### 4.2 Danh sách cửa hàng — `StoresPage` (`src/pages/StoresPage.tsx`)

Mục đích: xem / thêm / sửa / xoá cửa hàng + xuất Excel.

APIs:
- **GET `/api/stores`** — load danh sách. BE tự lọc theo claim: AdminHR thấy tất cả; AreaManager chỉ thấy cửa hàng trong khu của mình; StoreManager / SalesStaff chỉ thấy đúng 1 cửa hàng.
- **GET `/api/areas`** — chỉ HR / AreaManager mới gọi, để đổ dropdown khu trong form thêm/sửa.
- **POST `/api/stores`** — thêm cửa hàng mới. BE validate mã không trùng.
- **PUT `/api/stores/{id}`** — sửa tên + khu của cửa hàng (không cho sửa mã).
- **POST `/api/stores/batch-delete`** — xoá nhiều cửa hàng đã tick. BE chặn nếu cửa hàng còn nhân viên hoặc bảng công.
- **GET `/api/stores/export`** — xuất Excel danh sách (BE render bằng EPPlus).

Không có công thức tính.

### 4.3 Kiểm tra hệ thống — `AdminPage` (`src/pages/AdminPage.tsx`)

Mục đích: HR ping API + xem danh sách user.

APIs:
- **GET `/api/admin/ping`** — kiểm tra API còn sống.
- **GET `/api/users`** — danh sách toàn bộ tài khoản (email, họ tên, role, store gắn).
- **GET `/api/stores`** — để map `storeId` thành tên hiển thị.

Không có công thức tính.

### 4.4 Danh sách nhân viên cửa hàng — `StaffListPage` (`src/pages/shiftKpi/StaffListPage.tsx`)

Mục đích: thêm / sửa / xoá nhân viên của 1 cửa hàng (kèm tạo tài khoản đăng nhập).

APIs:
- **GET `/api/stores/{storeId}/shift-kpi/staff`** — load danh sách nhân viên của cửa hàng.
- **POST `/api/stores/{storeId}/shift-kpi/staff`** — thêm nhân viên + đồng thời tạo `User` (role `SalesStaff`), băm mật khẩu bằng `BCrypt.HashPassword(loginPassword)`, rồi gắn `LinkedUserId` vào nhân viên.
- **PUT `/api/stores/{storeId}/shift-kpi/staff/{id}`** — sửa thông tin nhân viên. Nếu nhân viên **chưa có** tài khoản mà form nhập email + mật khẩu thì cũng tạo `User` và link.
- **DELETE `/api/stores/{storeId}/shift-kpi/staff/{id}`** — xoá 1 nhân viên (gọi vòng `for` khi user tick "Xoá đã chọn"). BE chặn nếu còn dữ liệu công tham chiếu.

Không có công thức tính.

### 4.5 Cấu hình KPI tháng — `KpiConfigPage` (`src/pages/shiftKpi/KpiConfigPage.tsx`)

Mục đích: AreaManager / StoreManager đề xuất KPI tháng và tỷ trọng (tuần, ngày, ca). AdminHR đọc → chốt & khoá tháng để dùng cho bảng công và bảng lương.

APIs:
- **GET `/api/stores/{storeId}/shift-kpi/kpi-months/{yyyy-MM}`** — đọc cấu hình của tháng đó: KPI tháng + 3 JSON tỷ trọng + cờ `isMonthLocked`. Chỉ là đọc, không tính.
- **PUT `/api/stores/{storeId}/shift-kpi/kpi-months/{yyyy-MM}`** — ghi đề xuất KPI. BE check `StoreAccess.CanEditKpiMonthConfig(user, yearMonth, serverToday)`:
  - AreaManager: sửa bất kỳ lúc nào, miễn tháng chưa bị khoá.
  - StoreManager: chỉ sửa được **vào đúng ngày 1 của chính tháng đó** (theo giờ máy server).
- **PATCH `/api/stores/{storeId}/shift-kpi/kpi-months/{yyyy-MM}/month-lock`** — HR bấm "Chốt & khoá" / "Mở khoá". Khi `locked = true`, BE chặn mọi PUT cấu hình + chặn sửa bảng công trong tháng (`daily-entry`).

Cấu hình tháng không tự tính khi lưu — nhưng 3 JSON đó được các API khác (bảng công ngày, dashboard, bảng lương) tiêu thụ để tính KPI ngày cửa hàng và KPI cá nhân. Xem chi tiết ở mục 4.6 dưới.

### 4.6 Bảng công ngày — `DailyShiftPage` (`src/pages/shiftKpi/DailyShiftPage.tsx`)

Mục đích: nhập giờ công + doanh thu từng nhân viên theo từng ca, BE tính ngay KPI ngày cửa hàng + KPI cá nhân.

APIs:
- **GET `/api/stores/{storeId}/shift-kpi/daily?workDate=...`** — load bảng công của 1 ngày. BE đã tính sẵn `storeDayKpi`, `weightNv`, `targetNv`, `kpiPctNv`, `dayLocked` (xem công thức bên dưới).
- **PATCH `/api/stores/{storeId}/shift-kpi/daily-entry`** — lưu **1 ô** (giờ hoặc doanh thu) khi `onBlur` / Enter. Body gồm `staffId`, `workDate`, `field`, `value`, `version`. BE tăng `version` lên 1 sau lưu; nếu `version` đã lệch (người khác sửa trước) thì trả HTTP 409 và FE reload lại sheet.
- **GET `/api/stores/{storeId}/shift-kpi/daily-export?workDate=...`** — xuất Excel bảng công của ngày (EPPlus).
- **POST `/api/stores/{storeId}/shift-kpi/daily-equalize?workDate=...`** — bấm "Chia đều DT NVBH". BE chia: `DT mỗi NVBH có giờ công trong ca = DT ca thực tế / số NVBH có giờ công ở ca` (chỉ áp với row là NVBH).
- **PATCH `/api/stores/{storeId}/shift-kpi/daily-day-lock?workDate=...`** — HR bật/tắt cờ `IsDayLocked` của ngày ⇒ chặn mọi `daily-entry` trong ngày đó.
- **PATCH `/api/stores/{storeId}/shift-kpi/staff/{staffId}/position?workDate=...`** — đổi chức danh của 1 nhân viên **cho riêng ngày đó** (snapshot), không động đến các ngày khác.

Công thức tính nằm trong GET `/daily` (file `ShiftKpiMath.cs`):

- **KPI ngày cửa hàng `storeDayKpi`**: ưu tiên `TryWeeklyRebalancedStoreDayKpi(...)` — chia tháng thành 5 "lát tuần" theo công thức `WeekSliceIndexInMonth = min(4, (day−1) × 5 / DaysInMonth)`. KPI tuần = `monthlyTarget × weekRatios[wk] / Σ weekRatios`. KPI còn lại của lát = `weeklyTarget − Σ DT các ngày đã qua trong lát`. KPI ngày hôm nay = `remaining × dayRatios[today] / Σ dayRatios[các ngày còn lại trong lát]`. Nếu JSON tỷ trọng sai hoặc thiếu dữ liệu thì fallback `DailyTargetFromMonthConfig`: KPI ngày = `monthlyTarget × dayRatios[indexOfDow] / Σ dayRatios`, không tính được nữa thì chia đều `monthlyTarget / DaysInMonth`.
- **Trọng số nhân viên `weightNv`** = tổng giờ công 4 ca (`gcMorning + gcAfternoon + gcEvening + gcExtra`) **chỉ khi** chức danh là `NVBH_FT` hoặc `NVBH_PT`. Mọi vị trí khác (QLCH, CHP, NVBV, NVK, NVTN) `weightNv = 0` — vì vậy UI hiển thị `—` ở cột "Mục tiêu DT NV" và "% KPI NV" thay vì 0.
- **Mục tiêu DT của 1 NVBH** `targetNv` = `storeDayKpi × weightNv(row) / Σ weightNv(toàn cửa hàng ngày đó)`.
- **% KPI cá nhân** `kpiPctNv` = `revenueNv / targetNv × 100`.

### 4.7 Dashboard tháng — `MonthlyShiftPage` (đường dẫn `/app`, file `src/pages/shiftKpi/MonthlyShiftPage.tsx`)

Mục đích: trang chủ. Xem tiến độ KPI tháng, biểu đồ DT theo ngày, top nhân viên. HR có thêm nút "Chốt & khoá tháng" / "Mở khoá tháng".

APIs:
- **GET `/api/stores/{storeId}/shift-kpi/monthly-dashboard?yearMonth=...`** — gom 1 lần đủ dữ liệu vẽ dashboard (xem công thức bên dưới).
- **PATCH `/api/stores/{storeId}/shift-kpi/kpi-months/{yyyy-MM}/month-lock`** — y hệt mục 4.5, dùng cho 2 nút HR ngay trên dashboard.

Công thức trong GET `/monthly-dashboard` (`StoreShiftKpiController.GetMonthlyDashboard`):

- **KPI tháng mục tiêu** `monthlyTarget` = `StoreMonthlyKpiConfig.MonthlyTargetAmount` (hoặc 0 nếu chưa cấu hình).
- **Doanh thu NV nhập** `revenueFromStaffEntries` = `Σ (RevenueMorning + RevenueAfternoon + RevenueEvening)` trên `StaffDailyEntries` của tháng.
- **DT đối chiếu kênh** `tongDoanhThuHeThongThang` = `Σ KenhDoanhThuJson` trên `StoreDailySummary` của tháng (cộng các kênh khác như POS, GHN, Shopee…).
- **Cảnh báo lệch >5%** `discrepancyOver5Pct` = `|revenueFromStaffEntries − tongDoanhThuHeThongThang| / max(revenueFromStaffEntries, tongDoanhThuHeThongThang) > 5%`.
- **% tiến độ KPI tháng** `kpiAchievedPct` = `revenueFromStaffEntries / monthlyTarget × 100`.
- **Biểu đồ ngày** `dailySeries[d]` = `{ workDate, staffRevenue, channelRevenue, storeDayKpiTarget, isDayLocked }`. `storeDayKpiTarget` đọc thẳng từ snapshot `StoreDailySummary.StoreKpiTargetAmount` (dashboard không tính lại rebalance để cho nhanh).
- **Top nhân viên** `topStaff` = group theo `staffId`, tính `Σ giờ công 4 ca` và `Σ DT 3 ca`, sort giảm dần theo tổng DT, lấy 10 dòng đầu.

Phía FE bổ sung 2 phép biến đổi để vẽ (không phải logic nghiệp vụ):
- `kpiPctClamped = clamp(kpiAchievedPct, 0, 150)` → bề rộng thanh tiến độ (giới hạn 150% để khỏi tràn).
- `kpiTone = kpiAchievedPct ≥ 100 ? 'high' : kpiAchievedPct ≥ 80 ? 'mid' : 'low'` → màu thanh (xanh / xanh nhạt / cam).

### 4.8 Bảng lương — `PayrollPage` (`src/pages/shiftKpi/PayrollPage.tsx`)

Mục đích: tổng hợp lương theo tháng cho mọi nhân viên của cửa hàng + xuất Excel.

APIs:
- **GET `/api/stores/{storeId}/shift-kpi/payroll?yearMonth=...`** — trả `PayrollRow[]` đã tính lương xong (xem công thức bên dưới).
- **GET `/api/stores/{storeId}/shift-kpi/payroll-export?yearMonth=...`** — bấm "Xuất Excel" trên header, BE render bằng EPPlus.

Công thức 1 dòng `PayrollRow` (`ShiftKpiMath.MonthlySalary` + `PickCommissionPct`):

- **Tổng giờ công** `totalHours` = `Σ (hoursMorning + hoursAfternoon + hoursEvening + hoursExtra)` toàn tháng.
- **Tổng doanh thu cá nhân** `totalRevenue` = `Σ (revenueMorning + revenueAfternoon + revenueEvening)` toàn tháng (chỉ có ý nghĩa với NVBH).
- **% KPI tháng cửa hàng** `storeKpiAchievedPct` = `Σ revenueFromStaffEntries(tháng) / monthlyTarget × 100`.
- **% hoa hồng được áp** `commissionPctApplied` = `PickCommissionPct(brackets, storeKpiAchievedPct)`: duyệt bảng bậc hoa hồng (cấu hình trong DB) và chọn bậc thoả `min ≤ kpiPct < max`. Bậc cuối có thể không có `max`. Không khớp bậc nào ⇒ `0`.
- **Lương cứng** `salaryFixed` = `hourlyRate × totalHours`.
- **Lương doanh thu** `salaryRevenue` = `isSales ? totalRevenue × commissionPctApplied / 100 : 0`.
- **Thưởng team (chỉ QLCH, và `teamBonusBase > 0`)** `teamBonus`:
  - `storeKpiAchievedPct ≥ 100` → `teamBonusBase`
  - `≥ 90` và `< 100` → `teamBonusBase × 0.5`
  - còn lại → `0`
- **Tổng lương** `totalSalary` = `salaryFixed + salaryRevenue + teamBonus`.
- **HH ước (95% KPI)** `hypotheticalSalaryRevenueAt95` = `totalRevenue × PickCommissionPct(brackets, 95) / 100` (chỉ tính cho NVBH) — dùng để cảnh báo cận bậc, giúp QLCH thấy được "nếu đạt 95% thì hoa hồng tháng sẽ là bao nhiêu".

## 5. Permission FE (lọc theo role JWT)

- Route guard: `routes/RequireRole.tsx` chặn vào trang theo role.
- Sidebar: `layout/AppLayout.tsx` ẩn nav theo role (`canStaffMaster`, `isAdmin`).
- Trang `KpiConfigPage`:
  - **AreaManager / StoreManager** → form editable + "Lưu đề xuất KPI" (QLCH chỉ ngày 1).
  - **AdminHR** → form read-only + nút "Chốt & khoá tháng" / "Mở khoá tháng".
- Trang `DailyShiftPage`:
  - **SalesStaff** → chỉ thấy row của mình; ngày quá khứ không sửa.
  - **QLCH** → không sửa được row của QLCH/CHP đồng cấp.
  - **AdminHR** → có nút "Khoá ngày / Mở khoá ngày".

## 6. Save-on-blur

`components/MoneyCellInput` commit khi `onBlur` hoặc `Enter`. Cell input có `syncKey={entryId + version}` — khi server trả `version` mới, cell re-mount với giá trị canonical.

Race / 409: gọi API thất bại với 409 ⇒ trang tự reload bảng, hiển thị message từ server (thường: "Phiên bản dữ liệu đã đổi — đang tải lại.").

> Các trang dashboard / cấu hình / payroll đều tự `useEffect(load, [storeId, yearMonth])` nên đã bỏ nút "Tải lại" thủ công — chỉ cần đổi cửa hàng / tháng là FE tự gọi lại API.

## 7. Lint & build

```powershell
npm run lint   # eslint
npm run build  # tsc -b && vite build
npm run preview
```

## 8. Liên kết tài liệu

- API + kiến trúc tổng thể: [`../bekrik/README.md`](../bekrik/README.md)
- Thiết kế chi tiết (ERD, permission, công thức): [`../bekrik/docs/design.md`](../bekrik/docs/design.md)
- Kịch bản test tay: [`../bekrik/HUONG_DAN_TEST.md`](../bekrik/HUONG_DAN_TEST.md)
