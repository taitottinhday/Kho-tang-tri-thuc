# Vườn Chữ

Ứng dụng frontend luyện chính tả tiếng Việt cho học sinh lớp 1–5. Giao diện và dữ liệu chạy trong trình duyệt; tiến độ lưu cục bộ trên thiết bị.

## Chạy trên máy

Mở PowerShell tại thư mục dự án, sau đó chạy:

```powershell
python -m http.server 8000 --bind 127.0.0.1
```

Mở `http://localhost:8000` trong trình duyệt. Có thể dừng máy chủ bằng `Ctrl+C`. App cũng có thể mở bằng `index.html`.

## Chức năng hiện có

- Chọn lớp 1–5. Lộ trình và bộ thẻ mẫu dùng ngân hàng chính tả ở `data/ngan-hang-chinh-ta.js`.
- Bài học có ba mức, phản hồi ngay, sao thành tích và mở bài tiếp theo khi đạt yêu cầu.
- Trò chơi gồm thử thách hằng ngày, nhanh tay, săn lỗi, nghe–viết và ôn câu hay nhầm.
- Nghe câu hỏi, bật hoặc tắt âm thanh, thêm nhiều hồ sơ học sinh trên cùng thiết bị, nhận XP và huy hiệu.
- Góc giáo viên có bảng tiến độ, bật mở bài tự do, in báo cáo và sao lưu/khôi phục dữ liệu.
- **Tủ thẻ từ** cho học sinh tìm từ theo lớp, nhìn mẫu, che thẻ rồi tự viết. Khi chấm, ứng dụng phân biệt dấu và chữ hoa, chấp nhận các cách mã hoá Unicode tương đương. Những thẻ còn sai xuất hiện trong mục **Ôn lại từ sai** của từng học sinh.
- Trong **Dành cho thầy cô → Soạn bộ thẻ**, nhập mỗi từ hoặc cụm từ trên một dòng. Có thể lưu nháp, giao bộ thẻ cho một khối lớp trên máy này, xem kết quả từng học sinh và in phiếu A4 từ cùng danh sách. Khi thay nội dung từ, bộ thẻ bắt đầu ghi kết quả cho phiên bản mới.
- Tiến độ và hồ sơ được lưu trong `localStorage` của trình duyệt hiện tại.
- **Câu hỏi biến đổi**: ngoài câu soạn sẵn, `data/sinh-cau.js` sinh thêm hơn 400 câu từ kho từ và khung câu; tên bạn nhỏ, người thân, số đếm đổi mỗi lần nên học lại vẫn gặp câu mới. Câu sinh làm sai vẫn vào mục Ôn lại như câu thường.
- **Hứng tuyết chữ** (Trò chơi): bông tuyết mang các cách viết rơi xuống, bé chạm bông tuyết viết đúng để điền vào câu; 60 giây, 3 trái tim, sao băng giá làm tuyết rơi chậm.
- **Mùa Giáng sinh** (tự bật 15/11 → 10/1, tắt/bật trong Cài đặt → Hiển thị): một bầu trời đỏ chung cho mọi trang, tuyết rơi động, ông già Noel bay ngang trời, Lịch Noel 24 ô. Bật “Giảm chuyển động” thì tuyết đứng yên.

## Kiểm thử

Cần Node 22 và Chrome (hoặc đặt `CHROME_PATH`):

- `node tests/sinh-cau-check.js` – kiểm tra mọi câu sinh (thêm `--mau` để in câu mẫu).
- `node tests/noel_e2e.js 390 844` – kiểm thử câu sinh, Hứng tuyết chữ, nền Noel, tuyết, chế độ đêm (ảnh lưu ở `qa-results/noel`).
- `node tests/contrast_check.js 390` – dò chữ khó đọc trên mọi trang, ngày và đêm.
- `node tests/layout_sweep.mjs` – dò chữ bị bóp/đè, nút chồng nút ở 320–2560px.
- `python tests/browser_qa.py` – kiểm thử chức năng tổng thể.

## Ghi chú

- Giáo viên nên rà nội dung theo bộ sách, kế hoạch dạy học và phương ngữ của lớp trước khi dùng chính thức.
- Nghe–viết phụ thuộc vào giọng tiếng Việt có sẵn trên trình duyệt/thiết bị; có thể nghe chậm hoặc xem câu để người lớn đọc.
- Bản hiện tại chưa có tài khoản trực tuyến, đồng bộ giữa thiết bị, quản lý lớp qua mạng hoặc báo cáo từ xa.
- Dữ liệu giáo viên có thể sao lưu/khôi phục trong góc thầy cô; xóa hồ sơ hoặc tiến độ tại đó không thể hoàn tác.

## Chạy bằng Node / deploy lên Railway

- Chạy trên máy: `npm start` (hoặc `node server.js`) rồi mở `http://localhost:3000`. Không cần `npm install` vì máy chủ chỉ dùng thư viện có sẵn của Node.
- Railway: tạo project từ repo GitHub, Railway tự nhận `package.json` và chạy `npm start`. Máy chủ tự dùng cổng trong biến `PORT` mà Railway cấp. Vào **Settings → Networking → Generate Domain** để lấy đường link cho học sinh.
- Máy chủ chỉ phục vụ các tệp của web; `server.js`, `tests/` và tệp ghi chú phối hợp không truy cập được từ trình duyệt.
