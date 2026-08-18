# VJGS OTP/OTA Static Web Build

## Cách chạy trên GitHub Pages
1. Upload toàn bộ nội dung thư mục này lên repository.
2. Bật GitHub Pages trỏ vào root hoặc docs tuỳ cấu trúc repo.
3. Đảm bảo giữ nguyên cấu trúc:

```text
index.html
style.css
app.js
DataOTP/otp_2026_index.json
DataOTP/2026/otp_2026_01.csv ... otp_2026_08.csv
```

## Ghi chú
- Web đọc CSV tĩnh bằng fetch(). Nếu mở trực tiếp bằng file:// có thể bị chặn CORS. Hãy chạy qua GitHub Pages hoặc local server.
- Nhập/sửa trong OTP Input lưu vào localStorage của trình duyệt, không ghi ngược lên GitHub.
- Dùng tab Export để tải CSV sau khi sửa.
