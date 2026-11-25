# Phối hợp Claude Code ↔ Codex

Hai trợ lý cùng làm trong thư mục này. Để không ghi đè lên nhau:

## Phân công
- **Codex**: dựng khung app (HTML/CSS/JS chạy độc lập, không cần máy chủ), lộ trình bài học, lưu tiến độ.
- **Claude Code**:
  1. Soạn **ngân hàng nội dung chính tả** chuẩn chương trình GDPT 2018 (lớp 1–5): cặp âm/vần dễ lẫn (s/x, ch/tr, d/gi/r, l/n, c/k/q, g/gh, ng/ngh, an/ang, ac/at, ân/âng, ươc/ươt, iêc/iêt, uôn/uông...), dấu hỏi/ngã, quy tắc viết hoa — ghi vào `data/` (file riêng, không sửa code của Codex khi chưa xong).
  2. **Kiểm thử + rà soát** khi Codex xong bản đầu: lỗi chức năng, chính tả nội dung, giao diện cho HS tiểu học (chữ to, nút to, màu tươi, ít chữ, có âm thanh/khen thưởng), khả năng dùng trên điện thoại/máy tính bảng.
  3. Sửa lỗi + bổ sung tính năng còn thiếu sau khi Codex dừng ghi.

## Quy ước
- Ai đang sửa file nào thì ghi vào mục "Đang sửa" bên dưới; xong thì xoá dòng đó.
- Ghi lỗi/đề xuất vào mục "Ghi chú rà soát".

## Đang sửa
- (Claude đã xong `data/ngan-hang-chinh-ta.js` – Codex có thể nạp bằng `<script src="data/ngan-hang-chinh-ta.js">`, dữ liệu ở `window.NGAN_HANG_CHINH_TA`: 13 chủ đề, 175 câu, 3 loại `chon` / `timLoi` / `ngheViet`, kèm `doanNgheViet` theo lớp 1–5. Mô tả định dạng ở đầu file.)

- ✅ **Claude XONG đợt 3** (đã nhả `app.js`, `kid.css`, `data/`): phiếu bài tập in cho giáo viên (trang 1 phiếu, trang 2 đáp án – đã kiểm bằng PDF thật), chọn giọng đọc tiếng Việt + tốc độ đọc (`db.settings.voice`, `db.settings.rate`), chủ đề mới `tu-kho` “Từ khó hay viết sai” lớp 3–5 (nay 14 chủ đề, 193 câu). Kiểm thử Chrome 1366px + 400px: 27/27 bước đạt, 0 lỗi JS. Codex có thể đưa vào `tests/browser_qa.*`: mở góc thầy cô → `#wsOpen` → `.worksheet h2` có 4 mục; đổi `#rateSel` → `db.settings.rate` lưu lại.
- **Đề xuất Codex nhận (đợt 3): `manifest.webmanifest`, `sw.js`, `README.md`, `tests/`** – (1) PWA: cài lên máy tính bảng như app, chạy offline khi đã mở qua http(s); đăng ký service worker trong một `<script>` nhỏ cuối `index.html` (chỉ thêm dòng, không sửa phần khác). (2) README đang ghi “Đổi giọng đọc” – Claude đang làm tính năng này, cập nhật lại mô tả khi xong. (3) Bổ sung kịch bản QA cho phiếu in + chọn giọng đọc.

## Ghi chú rà soát (Claude rà bản Codex v1)
1. [Kiến thức – nghiêm trọng] hoi-nga: giải thích “Sẵn sàng viết dấu hỏi ở tiếng sẵn” SAI (sẵn = dấu ngã).
2. [Kiến thức] Lựa chọn trùng: s-x ['sếp','xếp','xếp'], hoi-nga ['sữa','sửa','sửa'], c-t ['th','thềm','thềm'], n-ng ['đường','đườn','đường'], ['học','hót','học'].
3. [Kiến thức] Lựa chọn vô nghĩa/lạc đề: 'zông', 'chongg', 'chre', 'Chúngg'; câu “phơi” trong bài s/x; câu “chuyện” (dấu nặng) trong bài hỏi/ngã; câu “rửa tay” trong bài n/ng.
4. [Chức năng – nghiêm trọng] Săn lỗi: class `.wrong-word` tô đỏ sẵn từ sai → lộ đáp án.
5. [Chức năng] Làm Nghe–viết ≥60% tự đánh dấu bài học hoàn thành, mở khoá bài sau.
6. [Chức năng] So khớp nghe–viết không chuẩn hoá Unicode (NFC) → gõ đúng vẫn bị chấm sai với một số bộ gõ.
7. [Chức năng] Chọn lớp không thay đổi nội dung; chỉ có 35 câu.
8. [Giao diện] Nhiều chữ 8–12px, quá nhỏ cho HS tiểu học; màu tương phản thấp (#9aa… trên nền trắng).
9. [Trải nghiệm] Thiếu âm thanh, hiệu ứng khen thưởng, đọc câu hỏi cho HS lớp 1, nhiều học sinh trên một máy, khoá góc giáo viên.

## Ghi chú rà soát của Codex (bản v2, 25-11-2026)
1. [Đạt] `node --check app.js` và `node --check data/ngan-hang-chinh-ta.js` chạy qua. Rà dữ liệu thấy 13 chủ đề, đủ dạng câu hỏi `chon` / `timLoi` / `ngheViet`, đáp án trắc nghiệm có trong lựa chọn và từ sai đều xuất hiện trong câu.
2. [Đạt – mô phỏng luồng] Mô phỏng DOM bằng Node cho lớp 2: mở trang học, hoàn thành bài c/k/q đủ 3 sao, mở bài kế tiếp, đưa câu trả lời sai vào danh sách ôn; lọc lớp 5 còn 6 chủ đề. Đây chưa thay thế kiểm tra giao diện thực trong trình duyệt.
3. [Giao diện / tệp thiếu] `index.html` đang nạp `kid.css`, nhưng tệp này chưa có trong thư mục. Máy chủ local trả 404 cho `kid.css`; `styles.css` và `comfort.css` trả 200. Bổ sung tệp hoặc bỏ tham chiếu trước khi chốt.
4. [Kiến thức] Trong chủ đề `hoi-nga`, mẹo ghi “dễ dàng (huyền → ngã)”; tiếng “dàng” mang dấu huyền, nên ví dụ này không minh họa mẹo dấu ngã như câu đang ghi. Nên thay bằng ví dụ từ láy đúng quy luật hoặc diễn đạt đây là trường hợp cần ghi nhớ riêng.
5. [Lần kiểm tra đầu] Công cụ điều khiển cửa sổ trình duyệt hết thời gian chờ. Kết quả kiểm thử trình duyệt tiếp theo ở bên dưới.

## Kết quả kiểm thử lại ngày 25-11-2026

Chrome và Edge đã chạy hết các kịch bản ở kích thước 1366 × 900 và 390 × 844 bằng hồ sơ tạm. Tệp `kid.css` đã tải được. Nút sang câu kế tiếp chỉ hiện khi trả lời xong. Nút về trang học ở màn kết quả đã đưa học sinh về đúng trang. Ví dụ “dễ dàng” đã chỉ rõ thanh của từng tiếng.

Các lượt kiểm thử đã xác nhận lọc bài lớp 1–5, chấm 4/5 câu được hai sao và mở bài, tải lại vẫn còn tiến độ, ôn đúng ở hai lượt thì gỡ câu sai, chơi thử thách ngày, săn lỗi, nghe–viết với Unicode tổ hợp và hết giờ Nhanh tay. Góc giáo viên hiển thị báo cáo, cho mở bài tự do và khôi phục hồ sơ mẫu từ bản sao lưu. Đổi học sinh giữ riêng XP của từng bạn.

Ảnh và báo cáo từng kích thước nằm trong `qa-results/` và `qa-results/edge/`. Có thể chạy lại bằng `python tests/browser_qa.py --out qa-results`. Các lượt này kiểm tra giao diện điện thoại bằng kích thước khung nhìn. Chất lượng phát âm qua loa và thao tác trên thiết bị cảm ứng thật cần được đánh giá riêng.

## Claude phản hồi ghi chú Codex (25-11-2026, đợt 2)
1. Mục 3 (`kid.css` thiếu): đã tạo `kid.css` – chứa toàn bộ lớp giao diện mà `app.js` v2 dùng (thẻ chủ đề, sao, khu vườn, huy hiệu, khung làm bài, nghe–viết, bảng giáo viên, pháo giấy, bố cục di động).
2. Mục 4 (mẹo hỏi/ngã): giữ câu Codex viết lại ở dòng 2. Quy tắc trầm/bổng trong từ láy (huyền–ngã–nặng / ngang–sắc–hỏi) là đúng; đã diễn đạt lại dòng 1 cho rõ và thêm câu vần “Chị Huyền mang nặng ngã đau…”. Sửa thêm 2 câu: “lững lờ” (đáp án cũ ghi “lửng”, sai), thay câu “nghĩ ngợi/ngởi” bằng “suy ngẫm/ngẩm”.
3. Lỗi Claude tự phát hiện khi xem ảnh chụp: thuộc tính `hidden` bị `display:inline-flex` của `.primary-btn` đè → nút “Câu tiếp theo” hiện trước khi trả lời. Đã thêm `[hidden]{display:none!important}` vào `kid.css`. (Kịch bản QA nên kiểm tra `getComputedStyle(...).display`, không chỉ thuộc tính `.hidden`.)
4. Di động 400px: ẩn breadcrumb ≤480px (trước đó tràn 3 dòng), thẻ hoạt động bớt cao, phản hồi nghe–viết căn trái.
5. Kiểm thử Claude: Chrome thật qua DevTools Protocol, 1366px và 400px, 21/21 bước đạt, 0 lỗi JS.

## Claude ghi chú (21:02) – Tủ thẻ của Codex
- Đã thấy Codex thêm `word-shelf.js` + `assets/tho-doc-sach.webp` và nối vào `app.js` (view `shelf`, `WordShelf.home()`, `WordShelf.teacherPanel()`). Các sửa đổi đợt 3 của Claude trong `app.js` vẫn còn nguyên – không bị ghi đè.
- Lúc 21:01 `index.html` nạp `word-shelf.css` nhưng tệp chưa có → 404. Codex hoàn tất giúp tệp này.
- Claude đang **chờ Codex dừng ghi 2 phút** rồi chạy lại toàn bộ kiểm thử Chrome (1366px + 400px) trên bản gộp và ghi kết quả ở đây. Trong lúc đó Claude không sửa tệp nào.

---------------------------------------------------------------------
# ĐỢT 4 (21:15) – NÂNG CẤP THEO THAM KHẢO “Kho Báu Chữ Việt” + các app học cho trẻ
Kiểm thử bản gộp (Claude + Tủ thẻ của Codex) lúc 21:12: Chrome 1366px & 400px, 27/27 đạt, 0 lỗi JS.

## Claude đã khảo sát (Chrome thật, bấm qua từng màn)
Kho Báu Chữ Việt: màn chào có hình đảo + “Tạo nhà thám hiểm / Chơi thử”, không cần email, PIN 4 số · chọn nhân vật + lớp (mỗi lớp là 1 hòn đảo có tên) · hộp hướng dẫn luật chơi · bản đồ đảo: đường cong nối các nút bài học / chướng ngại (tính giờ) / kim cương / trùm / rương · thanh trên: 🔥 chuỗi ngày, 💎, ⭐ · 4 lối tắt: Tiếp tục hành trình, Luyện nhanh 10 câu, Ôn câu sai, Kiểm tra trình độ · thanh tab dưới: Bản đồ / Ôn luyện / Hồ sơ / Cài đặt · màn làm bài toàn màn hình: thanh tiến độ, 3 tim, thẻ câu có nhãn loại (ĐÚNG HAY SAI? / TRẮC NGHIỆM), chọn rồi bấm “Kiểm tra”, tấm phản hồi trượt từ dưới (xanh/cam) có giải thích + “Tiếp tục” · Hồ sơ: lưới chỉ số + “Kỹ năng” theo từng mạch kiến thức · Cài đặt: hiệu ứng âm thanh, nhạc nền, âm lượng, giao diện ngày/đêm/tự động, chữ lớn, giảm chuyển động, đổi người chơi.
Nguồn khác: app ghép chữ (Spelling Adventure, I Spell Words: nghe từ rồi kéo chữ, chữ đúng khoá xanh, lặp lại ngắt quãng), hướng dẫn thiết kế cho trẻ của Google & NN/g (phản hồi đủ âm thanh + hình + chữ, rõ ràng cho 6–10 tuổi, phiên ngắn 2–5 phút), VioEdu (nhiệm vụ mỗi ngày), OLM (báo cáo cho phụ huynh/giáo viên).

## Nguyên tắc: KHÔNG sao chép – chuyển thành bản sắc “Vườn Chữ”
Đảo → **khu vườn theo lớp** (Lớp 1 Vườn Mầm · 2 Vườn Hoa · 3 Vườn Cây Trái · 4 Rừng Chữ · 5 Đồi Thi Ca) · tim → **💧 giọt nước** (chỉ dùng ở Thử thách, bài học thường không trừ để bé không sợ sai) · kim cương → **🌸 bông hoa** · trùm cuối → **🌳 Cây Chữ Thần** · rương → **🎁 giỏ quà**.

## Chia việc đợt 4
**Claude (app.js lõi + `kid.css` + data):**
1. Màn làm bài toàn màn hình kiểu “tập trung”: chọn → **Kiểm tra** → tấm phản hồi trượt từ dưới + **Tiếp tục**; nhãn loại câu.
2. Dạng câu mới (sinh tự động từ ngân hàng, không cần soạn thêm): **Đúng hay sai?**, **Ghép chữ** (chạm chữ cái theo thứ tự), **Nghe rồi chọn** (cho lớp 1 chưa gõ phím được).
3. **Lộ trình thành “con đường trong vườn”** (SVG đường cong): nút Bài học · ⚡ Thử thách (tính giờ, 3 💧) · 🎁 Giỏ quà · 🌳 Cây Chữ Thần cuối vườn (pháo hoa khi thắng).
4. Thanh trên: 🔥 ngày · 🌸 hoa · ⭐ sao. **Nhiệm vụ hôm nay** (3 nhiệm vụ nhỏ + giỏ quà).
5. Hàm `registerView(name, title, page, bind)` + mảng `AFTER_RENDER` đã thêm vào app.js – module ngoài dùng, không cần sửa app.js.

**Đề xuất Codex (tệp riêng, nạp SAU app.js trong index.html):**
A. `settings.js/.css` → `registerView('settings','Cài đặt',…)`: ngày/đêm/tự động (đặt `data-theme` trên `<html>`, CSS biến màu), **chữ lớn**, **giảm chuyển động** (thêm class lên `<body>`), bật/tắt hiệu ứng (dùng `db.settings.sound`), đổi người chơi. Lưu vào `db.settings.*` rồi `save()`.
B. `onboarding.js/.css`: màn chào lần đầu (khi `!db.onboarded`): chọn bạn đồng hành + tên + lớp, **PIN 4 số tuỳ chọn** cho hồ sơ (`S.pin`, hỏi khi `switchProfile`), hộp “Cách chơi” 3 bước.
C. **Thanh tab dưới cho di động** (≤760px): Vườn / Lộ trình / Ôn luyện / Hồ sơ – nút `data-view=…` + thuộc tính `data-tab` (render() đã tự tô nút đang chọn); thêm vào index.html sau `</main>`.
D. `profile.js` → `registerView('profile','Hồ sơ',…)`: lưới chỉ số + **thanh “Kỹ năng”** theo từng chủ đề (dùng `tstat(id).correct/attempts`: <5 câu “Chưa đủ dữ liệu”, <60% “Cần ôn”, <85% “Đang tiến bộ”, còn lại “Vững vàng”).
E. **Kiểm tra trình độ** (10 câu trộn từ lớp 1–5, gợi ý lớp phù hợp) – có thể đặt trong profile.js.
F. PWA (`manifest.webmanifest`, `sw.js`) + cập nhật README + kịch bản QA cho các phần trên.
Claude KHÔNG sửa các tệp A–F. Nếu Codex cần điểm nối mới trong app.js, ghi yêu cầu vào đây, Claude thêm.

## Claude – ĐỢT 4 ĐÃ XONG (21:40)
Đã làm (app.js, kid.css, 1 dòng index.html thêm 🌸/⭐ ở thanh trên):
- Màn làm bài toàn màn hình: thanh tiến độ, nhãn loại câu, chọn → **Kiểm tra** → tấm phản hồi trượt lên (xanh/cam) + **Tiếp tục**; phím Enter/1–4.
- 3 dạng câu mới sinh tự động: **Đúng hay sai?**, **Ghép chữ** (thẻ chữ, giữ cụm gh/ngh/uông thành 1 thẻ), **Nghe rồi chọn** (lớp 1). Bài “Vừa sức” = 1 đúng/sai + 4 chọn + 1 ghép + 2 tìm lỗi + 1 nghe.
- **Con đường trong vườn** (view `roadmap`): tên vườn theo lớp (Vườn Mầm/Hoa/Cây Trái/Rừng Chữ/Đồi Thi Ca), ⚡ Thử thách (90 giây, 3 💧) sau mỗi 2 bài, 🎁 Giỏ quà sau mỗi 4 bài, 🌳 Cây Chữ Thần cuối vườn (150 giây, 12 câu). Thử thách/quà KHÔNG chặn bài sau (bé nhỏ không bị kẹt).
- 🌸 bông hoa (sao mới, quà, thử thách, nhiệm vụ), **Nhiệm vụ hôm nay** + giỏ quà, “Luyện nhanh 10 câu”, “Tiếp tục hành trình”, 2 huy hiệu mới.
- Kiểm thử Chrome 1366 / 400 / 360px: **34/34 đạt**, 0 lỗi JS. Kiểm tra tràn ngang nay so với đúng bề rộng màn hình (trước đây so với innerWidth nên bỏ sót).

### Cần Codex xử lý / thống nhất
1. **Hướng hình ảnh**: `voyage.css` đang đưa giao diện sang biển–đảo–la bàn (✥, `.sea-chart`, `.island-*`, màu xanh dương). Hình ảnh quần đảo/hải đồ rất giống trang tham khảo → **rủi ro bị coi là sao chép**, và lệch bản sắc “Vườn Chữ”. Đề xuất: GIỮ thanh dock dưới (rất tốt) + font Nunito cục bộ; ĐỔI logo la bàn → mầm cây/lá, nhãn dock “Bản đồ” → “Vườn” (trỏ `roadmap`), bỏ `.sea-chart/.island-*` (con đường trong vườn đã thay vai trò bản đồ), dùng lại tông xanh lá. Nếu thầy cô (người dùng) chọn hướng khác thì làm theo thầy cô.
2. **Font**: `<link rel="preload" … crossorigin>` + `@font-face url(assets/Nunito.ttf)` bị Chrome chặn khi mở bằng file:// (CORS, origin null) → lỗi đỏ trong console; chạy qua http thì ổn. Đề xuất bỏ dòng preload hoặc chấp nhận font dự phòng.
3. Thanh trên ở ≤480px tràn 23px (avatar ra ngoài màn) → trình duyệt điện thoại thu nhỏ cả trang. Claude đã thêm trong kid.css: ẩn `#crumbCurrent`, chữ `.mast-brand b`, `.streak-pill small`, ⭐ ở ≤480px. Nếu Codex đổi topbar, giữ điều kiện “vừa 360px”.
4. `tests/browser_qa.*` cần cập nhật luồng làm bài mới: chọn đáp án → `#plCheck` → `#plCont`; dạng `dungSai` bấm `[data-tf="1|0"]`, `ghepChu` bấm `[data-tile]` theo `Q.items[Q.i].units`, nghe–viết gõ `#dictIn` rồi phát sự kiện `input`. Mẫu: kịch bản Claude dùng `STEP` trong ghi chú này.

## Claude – ĐỢT 5 (21:40): hoàn thiện phần Codex đang dở (theo yêu cầu của thầy cô)
Thầy cô yêu cầu làm tiếp phần Codex đang dở → giữ hướng **quần đảo** của `voyage.css` + `assets/quan-dao.webp` (tranh do Codex tự tạo, không lấy từ trang tham khảo). Tên đảo đặt theo tranh: Lớp 1 Đảo Phượng Đỏ · 2 Đảo Thác Bạc · 3 Đảo Cối Gió · 4 Đảo Hải Đăng · 5 Đảo Lâu Đài; mỗi đảo có “con đường trong vườn” của lớp đó.
**✅ Claude XONG đợt 5 – đã nhả mọi tệp dưới đây (Codex có thể sửa tiếp):**
- `app.js`: trang chủ quần đảo (`.voyage-home`, `.voyage-intro`, `.hero-card.voyage-actions`, `.sea-chart`, `[data-island]`), **Kiểm tra trình độ** (mục E).
- `tests/browser_qa.js`: cập nhật theo màn làm bài mới (`#plCheck` → `#plSheet` → `#plCont`) + con đường trong vườn.
- Mới: `settings.js` (mục A: ngày/đêm, chữ lớn, giảm chuyển động, âm thanh) và `profile.js` (mục D: Hồ sơ + thanh kỹ năng) – dùng `registerView`.
Còn để Codex: B (màn chào + PIN), F (PWA + README).

### Kết quả đợt 5 (Claude)
- Trang chủ quần đảo đã nối JS: `.voyage-intro`, 4 `.voyage-choice` (Tiếp tục / Luyện nhanh / Ôn câu sai / **Kiểm tra trình độ**), `.sea-chart` + 5 `[data-island]` (có tiến độ x/y, đảo đang học `.selected`), chạm đảo → đổi lớp + mở con đường. Bài tiếp theo vẫn ở `.hero-card.next-voyage .hero-copy [data-start]`.
- Con đường: tiêu đề `Lớp N · Đảo …` (khớp kiểm thử “Island opens its grade roadmap”).
- **Kiểm tra trình độ**: 10 câu = 2 × 5 mức (`PLACEMENT_LEVELS`), gợi ý lớp = số mức liên tiếp đúng ≥1/2; KHÔNG ghi sổ ôn/thống kê chủ đề; lưu `S.placement`.
- `settings.js` (ngày/đêm/tự động qua `html[data-theme]`, `body.big-text`, `body.calm`, âm thanh, tốc độ đọc) và `profile.js` (thẻ chỉ số + thanh kỹ năng + “Ôn ngay” + lịch sử). Thanh bên thêm Hồ sơ/Cài đặt; dock dưới: Bản đồ · Ôn luyện · Thẻ từ · Hồ sơ · Cài đặt.
- `tests/browser_qa.js`: luồng trả lời mới (`#plCheck`/`#plSheet`/`#plCont`, đủ 6 dạng câu), thêm kiểm thử con đường, thử thách (sai 3 lần dừng; thắng được ghi), kiểm tra trình độ, cài đặt đêm/chữ lớn, hồ sơ.
- Kết quả: `python tests/browser_qa.py` → **176/176 đạt ở 1366px và 390px**; kịch bản Claude 34/34 ở 1366/360px; 0 lỗi JS (ngoài cảnh báo font khi mở file://).
### Còn lại cho Codex
- B: màn chào lần đầu + PIN 4 số. F: PWA (`manifest.webmanifest`, `sw.js`) + **cập nhật README** (thêm quần đảo, con đường, thử thách, kiểm tra trình độ, cài đặt, hồ sơ). Font `Nunito.ttf` bị chặn khi mở bằng file:// (chạy qua `python -m http.server` thì ổn).

## ✅ Claude – ĐỢT 6 XONG (đã nhả tệp): nội dung + Đấu đội + Gợi ý
**Claude nhận:** `data/ngan-hang-chinh-ta.js` (thêm 7 chủ đề: ai/ay, ao/au, ui/uy–iu/ưu, ăn/ăng–ân/âng, đặt dấu thanh ia/iê…, viết hoa tên nước ngoài, viết hoa tên cơ quan/danh hiệu), `app.js` (nút 💡 Gợi ý trong màn làm bài), tệp mới `arena.js` (Đấu đội trên lớp – trình chiếu), `kid.css`, 1 dòng `<script>` trong `index.html`.
Không dùng API AI cho câu hỏi: câu chính tả do AI sinh dễ sai phương án nhiễu/dấu hỏi-ngã; khoá API đặt trong web tĩnh sẽ lộ.

### Kết quả đợt 6 (Claude)
- Ngân hàng: **21 chủ đề, 279 câu** (lớp 1: 8 · lớp 2: 17 · lớp 3: 13 · lớp 4: 13 · lớp 5: 10 chủ đề). Mới: `ai-ay`, `ao-au`, `ui-uy`, `an-ang-2`, `dau-thanh` (ia/ua/ưa – iê/uô/ươ), `viet-hoa-ngoai`, `viet-hoa-ten-rieng`. Kiểm tra tự động: đáp án ∈ lựa chọn, lựa chọn không trùng, từ sai xuất hiện đúng 1 lần, chuỗi NFC; bộ sinh câu (ghép chữ / nghe chọn / đúng-sai) chạy đúng trên cả 186 câu chọn.
- Lưu ý cho kịch bản nghe–viết: tránh từ có gạch nối (Mát-xcơ-va…) trong `ngheViet` vì so khớp tách theo dấu cách – 2 chủ đề viết hoa mới không có câu nghe–viết.
- **💡 Gợi ý** (2 lần/bài; không có ở thử thách, Cây Chữ Thần, Nhanh tay, Kiểm tra trình độ): loại 1 đáp án sai khi còn ≥ 2 đáp án sai, nếu không thì gợi ý bằng lời (thẻ chữ đầu, nửa câu chứa chữ sai, số chữ của câu, mẹo chủ đề).
- **`arena.js` – Đấu đội trên lớp** (Trò chơi → 🏆): chọn chủ đề/số đội 2–4/số câu/thời gian; ô A–D màu, đếm giờ, hiện đáp án + mẹo + đọc câu, chọn đội đúng (phím 1–4), bảng điểm sau mỗi câu, bục vinh quang; phím Space/Enter; không ghi vào hồ sơ học sinh.
- Kiểm thử: Claude 41/41 (1366px, 360px), `tests/browser_qa.py` 177/177 (1366px, 390px). Codex có thể thêm vào QA: `doAction('arena')` → `#arGo` → `#arReveal` → `[data-team]` → `#arScore` → `#arNext`.

## ✅ Claude – ĐỢT 7 XONG (đã nhả tệp): cơ chế bài học kiểu ForumFlash
Khảo sát forumflashstudy.com/roadmap/ngu-phap/a1 (Chrome thật): bậc A1→C2 khoá dần + “x/19 bài đã hoàn thành” · banner “Kiểm tra kiến thức A1 → Làm bài vượt cấp” · chặng đánh số 01…19 + nhãn loại kiến thức + ★★★ · hộp “Xem thông tin bài học”: trạng thái, 3 mức **Dễ ★ / Vừa ★★ / Khó ★★★** (qua mức nào nhận sao mức đó), 2 lối vào **Lý thuyết** / **Bài tập 20 câu** · trang Lý thuyết: Trọng tâm, Cấu trúc chính, Ví dụ mở đầu, Chức năng + ví dụ, Cách phân tích 01-02-03, Ví dụ và giảng giải, Đối chiếu, Lỗi thường gặp (Chưa đúng → Đã sửa), Tự kiểm tra, “Tiếp tục →”. (Phần bài tập yêu cầu đăng nhập Google nên không khảo sát.)
**Claude nhận:** `app.js` (hộp xem trước bài học 3 mức sao, mở mức theo thứ tự, kiểm tra vượt cấp theo lớp, con đường có số chặng + nhãn), tệp mới `theory.js` (trang Lý thuyết), `kid.css`, `index.html` (1 dòng script), `tests/browser_qa.js` (cập nhật luật sao mới).

### Kết quả đợt 7 (Claude)
- **Luật sao mới**: mỗi bài 3 mức `TIERS` – Dễ ★ (≥70%, 2 gợi ý) · Vừa ★★ (≥70%, 1 gợi ý) · Khó ★★★ (≥80%, không gợi ý). Qua mức nào nhận sao mức đó; mức sau mở khi qua mức trước (`tierOpen`), qua Dễ là mở bài tiếp theo. Màn kết quả có nút “Lên mức …” (`#upTier`).
- **Hộp thông tin bài học** (`showIntro`): số chặng 01…, nhóm kiến thức, trạng thái (“Chưa làm bài” / “Đã đạt x★ · tốt nhất y%”), 3 thẻ mức `[data-level]`, 2 lối vào `#openTheory` / `#beginQuiz`.
- **`theory.js`** – trang Lý thuyết dựng tự động cho cả 21 chủ đề: Trọng tâm · Công thức nhớ (`CONG_THUC`) · Ví dụ mở đầu · Mẹo 01-02-03 · Cách làm · Ví dụ và giảng giải · Đối chiếu (cột k/q/c… hoặc bảng Viết đúng/Không viết) · Lỗi thường gặp (Chưa đúng → Đã sửa) · Tự kiểm tra; lần đầu đọc +5 XP (`tstat(id).theory`).
- **Làm bài vượt cấp** theo lớp (`kind: 'skip'`, 12 câu, ≥80% → `S.skip[grade]` mở mọi bài). Con đường có bảng chọn lớp `.gm-grade` (tiến độ x/y), băng rôn `.gm-skip`, nhãn `.gm-num` “01 · PHỤ ÂM ĐẦU”.
- Kiểm thử: Claude 48/48 (1366, 360px); `tests/browser_qa.py` 181/181 (1366, 390px) – đã sửa kiểm thử “2 sao ở 80%” thành luật mới (qua Dễ = 1★ + có nút lên mức Vừa) và thêm kiểm thử hộp 3 mức + trang Lý thuyết.

## Claude – sửa giọng đọc (đợt 8)
- Máy thầy cô: Chrome mặc định; SAPI chỉ có giọng Anh, giọng Việt “Microsoft An” (OneCore) Chrome chỉ thấy sau khi tải xong danh sách; Edge có Hoài My / Nam Minh (online, tự nhiên).
- `speak()` (app.js): không còn im lặng – âm thanh tắt → nhắc bật nút 🔇; chưa tải giọng → chờ 500ms thử lại; không có giọng Việt → bảng `.voice-help` (Windows + Chrome: nút “Mở bằng Edge” qua `microsoft-edge:`); chờ 60ms sau `cancel()`; ưu tiên giọng Natural/Online; `onerror` báo lỗi.
- Cài đặt: dòng “Giọng đọc tiếng Việt” cho biết đang dùng giọng nào hoặc vì sao không có.
- Đã thêm `server.js` + `package.json` + `.gitignore` để deploy Railway (`npm start`, cổng `PORT`).

## ✅ Claude – ĐỢT 9 XONG (đã nhả tệp): nhạc nền + bảng âm lượng · Trang trí vườn (tiêu 🌸) · Giấy khen
Tham khảo nước ngoài: ABCmouse (vé thưởng → mua đồ trang trí phòng/thú cưng), Reading Eggs (giấy khen cuối mỗi bản đồ, in dán lớp), Teach Your Monster to Read / Khan Academy Kids / Starfall (thanh trượt âm lượng nhạc nền, tắt nhạc để tập trung).
**Claude nhận:** tệp mới `music.js` (nhạc nền WebAudio tự sinh + bảng âm lượng ở nút `#soundToggle`), `rewards.js` (view `garden`: cửa hàng + trang trí vườn; giấy khen in A4 ngang), `app.js` (âm lượng hiệu ứng/giọng đọc, nút giấy khen sau Cây Chữ Thần), `profile.js`, `settings.js`, `kid.css`, `index.html`.

### Kết quả đợt 9 (Claude)
- `music.js`: nhạc nền WebAudio tự sinh (I–vi–IV–V Đô trưởng, giai điệu ngũ cung kiểu hộp nhạc, vọng nhẹ, 66 BPM); bắt đầu sau lần chạm đầu; nhỏ còn 25% khi máy đọc; dừng khi ẩn tab. Bảng âm lượng mở từ `#soundToggle` (`#volPanel`, `#musicVol`, `#sfxVol`, `#musicOn`, `#sfxOn`, `#volAll`). Cài đặt mới: `db.settings.music`, `musicVol` (mặc định 0.3), `sfxVol` (0.8) – `tone()` và `speak()` nhân theo `sfxVol`.
- `rewards.js`: view `garden` – 18 món (2–20 🌸), vườn 6×4 ô, túi đồ, chuyển chỗ/cất vào túi; mini vườn trong thẻ “Khu vườn của em” ở trang chủ. Giấy khen A4 ngang (`showCertificate`, cqw), mục “📜 Giấy khen của em” trong Hồ sơ, nút sau khi thắng Cây Chữ Thần. Đã xuất PDF thật: đúng 1 trang.
- Kiểm thử: Claude 62/62 (1366, 390, 360px qua http); `tests/browser_qa.py` 180/180. Lưu ý QA: chạm giả lập vào `document` sẽ đóng bảng âm lượng (đóng khi chạm ra ngoài) – hãy phát `pointerdown` trên chính `#volPanel`.
