# fekrik — React + Vite (gọi API bekrik)

## Chạy local

1. Bật PostgreSQL, chạy **bekrik** (`http://localhost:5207`) theo README repo đó.
2. FE:

```powershell
npm install
npm run dev
```

Mở `http://localhost:5173`. Vite **proxy** mọi request `/api/*` sang API (xem `vite.config.ts`).

## Biến môi trường (tuỳ chọn)

Xem `.env.example`. Chỉ cần `VITE_API_BASE` nếu bạn **không** dùng proxy (ví dụ build tĩnh gọi thẳng URL API).

## Luồng demo

- Đăng nhập → JWT lưu `localStorage` (`krik_token`).
- Trang **Cửa hàng**: gọi `GET /api/stores` — số dòng phụ thuộc role.
- Trang **Admin / Users**: chỉ hiện menu khi role `AdminHR`; gọi `/api/admin/ping` và `/api/users`.
