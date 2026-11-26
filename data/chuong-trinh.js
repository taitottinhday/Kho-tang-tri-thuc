/*
 * CHƯƠNG TRÌNH PHÂN BIỆT CHÍNH TẢ LỚP 1 – 2 – 3 (định hướng CTGDPT 2018) – Claude Code, đợt 16.
 * Nạp SAU data/ngan-hang-chinh-ta.js và data/sinh-cau.js, TRƯỚC app.js.
 *
 * Danh mục bài do thầy/cô gửi (đúng thứ tự). Mỗi bài ghép 1–3 “cặp chính tả” (CAP):
 *   - cặp có sẵn trong ngân hàng cũ được TÁCH ra theo đúng cặp (vd. chủ đề “an/ang – at/ac” → chỉ lấy câu at/ac);
 *   - cặp chưa có (v/d, in/inh, uyp/uyu, uynh/uych, ân/uân, im/iêm, yêng/iêng, et/oet, ong/ông, anh/ênh, oan/oăn,
 *     oa/uê, ich/it, ach/êch, iên/yên/uyên, iêu/yêu/iu, en/eng, i/y, ay/ây…) được soạn mới ở dưới.
 * Kết quả: window.NGAN_HANG_CHINH_TA.chuDe = các bài l1-01…l3-24 (lop = [g, g]) + chủ đề cũ (chuyển sang lớp 4–5,
 * chưa triển khai). Mã câu ổn định: “l2-05:3”, câu sinh “l2-05:g7”.
 * Thêm/sửa bài: sửa mảng CHUONG_TRINH; thêm câu cho một cặp: thêm vào CAP_MOI. Kiểm tra: node tests/chuong-trinh-check.js
 *
 * Ghi chú chính tả theo SGK hiện hành (Quyết định 1989/QĐ-BGDĐT): sau phụ âm viết i (kĩ, lí, mĩ, sĩ);
 * dấu thanh của oa, oe, uy đặt trên chữ cái thứ hai (hoà, khoẻ, thuỷ). Câu hỏi tránh các từ hai cách viết đều gặp.
 */
(function () {
  'use strict';
  var D = window.NGAN_HANG_CHINH_TA;
  if (!D || !D.chuDe) return;

  function c(de, dung) { return { loai: 'chon', de: de, dapAn: dung, luaChon: [].slice.call(arguments, 1) }; }
  function loi(cau, tuSai, tuDung) { return { loai: 'timLoi', cau: cau, tuSai: tuSai, tuDung: tuDung }; }
  function nghe(cau) { return { loai: 'ngheViet', cau: cau }; }

  /* ===================== CẶP CHÍNH TẢ SOẠN MỚI ===================== */
  var CAP_MOI = {
    'v-d': { ten: 'v hay d?', icon: '🐘', quyTac: [
        'Âm **v**: môi dưới chạm nhẹ răng trên – **v**ui **v**ẻ, quyển **v**ở, con **v**oi, **v**ườn rau.',
        'Âm **d**: con **d**ê, quả **d**ưa, **d**ịu **d**àng, ngủ **d**ậy.',
        'Từ láy thường cùng âm đầu: **v**ui **v**ẻ, **v**ội **v**àng, **d**ịu **d**àng.'],
      viDu: ['vui vẻ', 'quyển vở', 'con voi', 'con dê', 'quả dưa', 'dịu dàng'],
      baiTap: [
        c('Em mở ___ở ra viết bài.', 'v', 'd'),
        c('Con ___ê kêu be be.', 'd', 'v'),
        c('Cả nhà ___ui vẻ đón Tết.', 'v', 'd'),
        c('Bà trồng rau trong ___ườn.', 'v', 'd'),
        c('Mẹ bổ một quả ___ưa hấu.', 'd', 'v'),
        c('Bé ___ẽ một ngôi nhà.', 'v', 'd'),
        c('Cô giáo nói ___ịu dàng.', 'd', 'v'),
        c('Chú ___oi có cái vòi dài.', 'v', 'd'),
        c('Bạn Nam ___ậy sớm tập thể dục.', 'd', 'v'),
        c('Cả lớp ___ỗ tay hoan hô.', 'v', 'd'),
        c('Chiều nay, cả nhà đi ___ạo công viên.', 'd', 'v'),
        loi('Em dẽ một bông hoa thật đẹp.', 'dẽ', 'vẽ'),
        loi('Con vê ăn cỏ trên đồi.', 'vê', 'dê'),
        loi('Chú doi dùng vòi uống nước.', 'doi', 'voi'),
        nghe('Bé vẽ con voi và con dê.'),
        nghe('Em dậy sớm, vui vẻ đến trường.')
      ] },
    'in-inh': { ten: 'in hay inh?', icon: '💡', quyTac: [
        'Vần **in** kết thúc bằng **n** (đầu lưỡi chạm răng): số **chín**, đèn **pin**, **xin** lỗi, giữ **gìn**.',
        'Vần **inh** kết thúc bằng **nh** (miệng mở, lưỡi nâng): **xinh** xắn, **kính**, **bình** hoa, phép **tính**.'],
      viDu: ['quả chín', 'đèn pin', 'xin lỗi', 'xinh xắn', 'cái kính', 'bình hoa'],
      baiTap: [
        c('Quả chuối ch___ vàng.', 'ín', 'ính'),
        c('Bố đeo k___ để đọc báo.', 'ính', 'ín'),
        c('Bạn Lan có đôi mắt x___ xắn.', 'inh', 'in'),
        c('Em x___ lỗi bạn vì làm rơi bút.', 'in', 'inh'),
        c('Ông soi đèn p___ tìm chìa khoá.', 'in', 'inh'),
        c('Em vẽ một h___ tròn thật đẹp.', 'ình', 'ìn'),
        c('Em giữ g___ sách vở sạch sẽ.', 'ìn', 'ình'),
        c('Em làm phép t___ cộng.', 'ính', 'ín'),
        c('Bé n___ khóc khi mẹ về.', 'ín', 'ính'),
        c('Mẹ cắm hoa vào b___.', 'ình', 'ìn'),
        loi('Bé rất xin xắn trong chiếc váy mới.', 'xin', 'xinh'),
        loi('Quả na đã chính, mẹ hái cho em.', 'chính', 'chín'),
        loi('Em vẽ hìn con mèo.', 'hìn', 'hình'),
        nghe('Bé xinh xắn khoanh tay chào ông.'),
        nghe('Quả na đã chín, mẹ hái cho em.')
      ] },
    'uyp-uyu': { ten: 'uyp hay uyu?', icon: '💡', quyTac: [
        'Vần **uyp**: đèn **tuýp**, **tuýp** kem đánh răng, **tuýp** màu vẽ.',
        'Vần **uyu**: **khuỷu** tay, đường **khúc khuỷu**, **khuỵu** chân.'],
      viDu: ['đèn tuýp', 'tuýp màu', 'khuỷu tay', 'khúc khuỷu', 'khuỵu chân'],
      baiTap: [
        c('Bố thay bóng đèn t___ mới.', 'uýp', 'uýu'),
        c('Mẹ mua một t___ kem đánh răng.', 'uýp', 'uỷu'),
        c('Bạn Nam bị đau kh___ tay.', 'uỷu', 'uỷp'),
        c('Con đường lên núi khúc kh___.', 'uỷu', 'uỷp'),
        c('Chú ngựa mỏi quá, kh___ chân xuống.', 'uỵu', 'uỵp'),
        c('Em bóp t___ màu để vẽ tranh.', 'uýp', 'uýu'),
        loi('Bóng đèn tuýu trong lớp rất sáng.', 'tuýu', 'tuýp'),
        loi('Bạn Minh chống khuỷp tay lên bàn.', 'khuỷp', 'khuỷu'),
        nghe('Đường lên đồi khúc khuỷu.')
      ] },
    'uynh-uych': { ten: 'uynh hay uych?', icon: '🏃', quyTac: [
        'Vần **uynh**: phụ **huynh**, đèn **huỳnh** quang, **luýnh quýnh**.',
        'Vần **uych**: ngã **huỵch**, **huých** vai, chạy **uỳnh uỵch**.'],
      viDu: ['phụ huynh', 'huỳnh quang', 'luýnh quýnh', 'ngã huỵch', 'huých vai'],
      baiTap: [
        c('Cô giáo mời phụ h___ đến họp.', 'uynh', 'uych'),
        c('Bạn Tú ngã cái h___ xuống đất.', 'uỵch', 'uỳnh'),
        c('Bạn khẽ h___ vai em ra hiệu.', 'uých', 'uýnh'),
        c('Ánh đèn h___ quang sáng trắng.', 'uỳnh', 'uỵch'),
        c('Em l___ quýnh vì sắp muộn học.', 'uýnh', 'uých'),
        c('Bạn Nam chạy ___ uỵch trên cầu thang.', 'uỳnh', 'uỵch'),
        loi('Bố mẹ em đi họp phụ huých.', 'huých', 'huynh'),
        loi('Bạn Hà ngã cái huỳnh xuống sân.', 'huỳnh', 'huỵch'),
        nghe('Ánh đèn huỳnh quang sáng trắng.')
      ] },
    'an-uan': { ten: 'ân hay uân?', icon: '🌸', quyTac: [
        'Vần **ân**: cái **cân**, **sân** trường, đôi **chân**, ân **cần**.',
        'Vần **uân** (có âm đệm **u**): mùa **xuân**, **tuần** lễ, **khuân** vác, **huân** chương.'],
      viDu: ['cái cân', 'sân trường', 'mùa xuân', 'tuần lễ', 'huân chương'],
      baiTap: [
        c('Mùa x___, hoa đào nở.', 'uân', 'ân'),
        c('Một t___ lễ có bảy ngày.', 'uần', 'ần'),
        c('Em chơi đá cầu ở s___ trường.', 'ân', 'uân'),
        c('Ông em được tặng h___ chương.', 'uân', 'ân'),
        c('Bác nông dân kh___ thóc vào kho.', 'uân', 'ân'),
        c('Mẹ dùng c___ để cân rau.', 'ân', 'uân'),
        c('Em rửa ch___ trước khi đi ngủ.', 'ân', 'uân'),
        c('Cô giáo ân c___ chỉ bảo em.', 'ần', 'uần'),
        loi('Mùa xân, cây cối đâm chồi.', 'xân', 'xuân'),
        loi('Các bạn chạy quanh suân trường.', 'suân', 'sân'),
        nghe('Mùa xuân về, sân trường rực rỡ hoa.')
      ] },
    'im-iem': { ten: 'im hay iêm?', icon: '🐦', quyTac: [
        'Vần **im**: con **chim**, quả **tim**, cái **kim**, **lim** dim.',
        'Vần **iêm**: que **diêm**, **tiêm** phòng, cái **liềm**, **điểm** mười.'],
      viDu: ['con chim', 'cái kim', 'que diêm', 'tiêm phòng', 'điểm mười'],
      baiTap: [
        c('Con ch___ hót líu lo.', 'im', 'iêm'),
        c('Bà xâu k___ khâu áo.', 'im', 'iêm'),
        c('Em được đ___ mười môn Toán.', 'iểm', 'ỉm'),
        c('Bé đi t___ phòng ở trạm y tế.', 'iêm', 'im'),
        c('Mẹ dùng que d___ thắp nến.', 'iêm', 'im'),
        c('Bác nông dân cầm l___ đi gặt lúa.', 'iềm', 'ìm'),
        c('Chú mèo nằm l___ dim trên ghế.', 'im', 'iêm'),
        c('Bé m___ cười thật tươi.', 'ỉm', 'iểm'),
        c('Gà con kêu ch___ chiếp.', 'iêm', 'im'),
        loi('Em được đỉm mười môn Toán.', 'đỉm', 'điểm'),
        loi('Bác thợ cầm lìm đi gặt.', 'lìm', 'liềm'),
        nghe('Chú chim nhỏ hót trên cành.'),
        nghe('Em được điểm mười, cô khen em.')
      ] },
    'ieng-yeng': { ten: 'iêng hay yêng?', icon: '🐦', quyTac: [
        'Không có âm đầu → viết **yê**: chim **yểng**.',
        'Có âm đầu → viết **iê**: **tiếng** hát, **siêng** năng, cái **giếng**, bay **liệng**.'],
      viDu: ['chim yểng', 'tiếng hát', 'siêng năng', 'cái giếng', 'bay liệng'],
      baiTap: [
        c('Chú chim ___ biết nói như người.', 'yểng', 'iểng'),
        c('Bạn Hoa rất s___ năng.', 'iêng', 'yêng'),
        c('Bà múc nước ở g___.', 'iếng', 'yếng'),
        c('Cánh diều bay l___ trên trời.', 'iệng', 'yệng'),
        c('Bé há m___ ăn cơm.', 'iệng', 'yệng'),
        c('Em có một góc học tập r___.', 'iêng', 'yêng'),
        c('T___ trống trường vang lên.', 'iếng', 'yếng'),
        loi('Con chim iểng đậu trên cành.', 'iểng', 'yểng'),
        nghe('Chim yểng hót, cánh diều bay liệng.')
      ] },
    'et-oet': { ten: 'et hay oet?', icon: '🦜', quyTac: [
        'Vần **et**: con **vẹt**, bánh **tét**, sấm **sét**, nét chữ.',
        'Vần **oet** (có âm đệm **o**): **khoét** lỗ, cười toe **toét**, đỏ **loét**.'],
      viDu: ['con vẹt', 'bánh tét', 'sấm sét', 'khoét lỗ', 'toe toét'],
      baiTap: [
        c('Con v___ biết nói.', 'ẹt', 'oẹt'),
        c('Bé cười toe t___.', 'oét', 'ét'),
        c('Chú chuột kh___ một lỗ nhỏ.', 'oét', 'ét'),
        c('Ngày Tết, mẹ gói bánh t___.', 'ét', 'oét'),
        c('Trời mưa, sấm s___ ầm ầm.', 'ét', 'oét'),
        c('Quả ớt chín đỏ l___.', 'oét', 'ét'),
        c('Bé viết từng n___ chữ thật đẹp.', 'ét', 'oét'),
        loi('Chú chuột khét một lỗ ở chân tường.', 'khét', 'khoét'),
        loi('Con voẹt đậu trên cành.', 'voẹt', 'vẹt'),
        nghe('Bé cười toe toét bên chú vẹt.')
      ] },
    'ong-ong': { ten: 'ong hay ông?', icon: '🐝', quyTac: [
        'Vần **ong**: con **ong**, cái **võng**, quả **bóng**, **cong** cong.',
        'Vần **ông**: **bông** hoa, dòng **sông**, bộ **lông**, cánh **đồng**.'],
      viDu: ['con ong', 'quả bóng', 'bông hoa', 'dòng sông', 'cánh đồng'],
      baiTap: [
        c('Đàn ___ bay đi hút mật.', 'ong', 'ông'),
        c('Em tặng mẹ một b___ hoa.', 'ông', 'ong'),
        c('Bé nằm v___ nghe bà hát ru.', 'õng', 'ỗng'),
        c('Con thuyền trôi trên dòng s___.', 'ông', 'ong'),
        c('Ông trăng tròn như quả b___.', 'óng', 'ống'),
        c('Chú mèo có bộ l___ mượt.', 'ông', 'ong'),
        c('Cầu tre c___ cong bắc qua suối.', 'ong', 'ông'),
        c('Bác nông dân làm việc trên cánh đ___.', 'ồng', 'òng'),
        loi('Em tặng bà một bong hoa.', 'bong', 'bông'),
        loi('Chú mèo có bộ long trắng muốt.', 'long', 'lông'),
        nghe('Đàn ong bay qua bông hoa bên bờ sông.')
      ] },
    'anh-enh': { ten: 'anh hay ênh?', icon: '🛶', quyTac: [
        'Vần **anh**: quả **chanh**, **cành** cây, màu **xanh**, **nhanh** nhẹn.',
        'Vần **ênh**: con **kênh**, bập **bênh**, **lênh** đênh, **mênh** mông.'],
      viDu: ['quả chanh', 'cành cây', 'màu xanh', 'con kênh', 'bập bênh', 'mênh mông'],
      baiTap: [
        c('Bé chơi bập b___ với bạn.', 'ênh', 'anh'),
        c('Lá cây màu x___ biếc.', 'anh', 'ênh'),
        c('Con thuyền l___ đênh trên sông.', 'ênh', 'anh'),
        c('Mẹ pha nước ch___ cho em.', 'anh', 'ênh'),
        c('Chim đậu trên c___ cây.', 'ành', 'ềnh'),
        c('Biển rộng m___ mông.', 'ênh', 'anh'),
        c('Nước ở con k___ rất trong.', 'ênh', 'anh'),
        c('Bé ăn b___ quy giòn tan.', 'ánh', 'ếnh'),
        loi('Bé chơi bập banh ngoài sân.', 'banh', 'bênh'),
        loi('Dòng kanh trong veo chảy qua làng.', 'kanh', 'kênh'),
        nghe('Con thuyền lênh đênh trên dòng kênh xanh.')
      ] },
    'inh-uynh': { ten: 'inh hay uynh?', icon: '💡', quyTac: [
        'Vần **inh**: **xinh** xắn, cái **kính**, **bình** hoa, anh **lính**.',
        'Vần **uynh** (có âm đệm **u**): phụ **huynh**, đèn **huỳnh** quang, **luýnh quýnh**.'],
      viDu: ['xinh xắn', 'cái kính', 'bình hoa', 'phụ huynh', 'huỳnh quang'],
      baiTap: [
        c('Bố mẹ em là phụ h___ của lớp.', 'uynh', 'inh'),
        c('Lọ hoa đặt trên bàn thật x___.', 'inh', 'uynh'),
        c('Ông đeo k___ đọc báo.', 'ính', 'uýnh'),
        c('Ánh đèn h___ quang sáng trắng.', 'uỳnh', 'ình'),
        c('Bé l___ quýnh tìm mũ.', 'uýnh', 'ính'),
        c('Mẹ cắm hoa vào b___.', 'ình', 'uỳnh'),
        c('Anh l___ đứng gác ở cổng trại.', 'ính', 'uýnh'),
        loi('Cô giáo họp phụ hinh cuối tuần.', 'hinh', 'huynh'),
        loi('Bé rất xuynh xắn trong áo mới.', 'xuynh', 'xinh'),
        nghe('Phụ huynh đến lớp xem các em vẽ tranh.')
      ] },
    'oan-oan2': { ten: 'oan hay oăn?', icon: '🌿', quyTac: [
        'Vần **oan**: **ngoan** ngoãn, bài **toán**, hoa **xoan**, liên **hoan**.',
        'Vần **oăn** (âm **ă** ngắn): tóc **xoăn**, băn **khoăn**, **thoăn** thoắt, **ngoằn** ngoèo.'],
      viDu: ['ngoan ngoãn', 'bài toán', 'hoa xoan', 'tóc xoăn', 'băn khoăn'],
      baiTap: [
        c('Bé rất ng___ ngoãn.', 'oan', 'oăn'),
        c('Bạn Mai có mái tóc x___.', 'oăn', 'oan'),
        c('Em làm bài t___ thật nhanh.', 'oán', 'oắn'),
        c('Đôi chân bé chạy th___ thoắt.', 'oăn', 'oan'),
        c('Cây x___ nở hoa tím.', 'oan', 'oăn'),
        c('Con đường ng___ ngoèo lên núi.', 'oằn', 'oàn'),
        c('Lớp em tổ chức liên h___.', 'oan', 'oăn'),
        c('Em băn kh___ không biết chọn quà gì.', 'oăn', 'oan'),
        loi('Bạn Mai có mái tóc xoan.', 'xoan', 'xoăn'),
        loi('Em làm bài toắn rất nhanh.', 'toắn', 'toán'),
        nghe('Bé ngoan ngoãn làm bài toán.')
      ] },
    'oa-ue': { ten: 'oa hay uê?', icon: '🌼', quyTac: [
        'Vần **oa** (âm đệm **o**): bông **hoa**, cái **loa**, **xoa** đầu, **khoa** học.',
        'Vần **uê** (âm đệm **u**): **quê** hương, hoa **huệ**, cây cối xum **xuê**, **thuê** nhà.'],
      viDu: ['bông hoa', 'cái loa', 'quê hương', 'hoa huệ', 'xum xuê'],
      baiTap: [
        c('Cái l___ phát thanh vang to.', 'oa', 'uê'),
        c('Em về q___ thăm bà.', 'uê', 'oa'),
        c('Bà trồng hoa h___ trắng.', 'uệ', 'oạ'),
        c('Cây cối xum x___.', 'uê', 'oa'),
        c('Mẹ x___ đầu cho bé.', 'oa', 'uê'),
        c('Nhà bác Ba cho th___ phòng.', 'uê', 'oa'),
        c('Em thích học môn Kh___ học.', 'oa', 'uê'),
        loi('Cây cối xum xoa trong vườn.', 'xoa', 'xuê'),
        loi('Bé xuê đầu chú mèo.', 'xuê', 'xoa'),
        nghe('Quê em có hoa huệ trắng và cây cối xum xuê.')
      ] },
    'ich-it': { ten: 'ich hay it?', icon: '🦆', quyTac: [
        'Vần **ich**: tờ **lịch**, **xích** đu, **thích**, chim **chích** bông.',
        'Vần **it**: con **vịt**, quả **mít**, **thịt** kho, một **ít**.'],
      viDu: ['tờ lịch', 'xích đu', 'yêu thích', 'con vịt', 'quả mít'],
      baiTap: [
        c('Mẹ treo tờ l___ lên tường.', 'ịch', 'ịt'),
        c('Con v___ bơi dưới ao.', 'ịt', 'ịch'),
        c('Em rất th___ đọc truyện.', 'ích', 'ít'),
        c('Quả m___ chín thơm lừng.', 'ít', 'ích'),
        c('Bé chơi x___ đu ở công viên.', 'ích', 'ít'),
        c('Chim ch___ bông nhảy trên cành.', 'ích', 'ít'),
        c('Mẹ kho th___ thơm phức.', 'ịt', 'ịch'),
        c('Đồng hồ kêu t___ tắc.', 'ích', 'ít'),
        loi('Con vịch kêu cạp cạp.', 'vịch', 'vịt'),
        loi('Em rất thít vẽ tranh.', 'thít', 'thích'),
        nghe('Chú vịt con thích bơi dưới ao.')
      ] },
    'ach-ech': { ten: 'ach hay êch?', icon: '🐸', quyTac: [
        'Vần **ach**: cuốn **sách**, viên **gạch**, **sạch** sẽ.',
        'Vần **êch**: con **ếch**, treo **lệch**, trắng **bệch**, mũi **hếch**.'],
      viDu: ['cuốn sách', 'viên gạch', 'sạch sẽ', 'con ếch', 'treo lệch'],
      baiTap: [
        c('Con ___ ngồi trên lá sen.', 'ếch', 'ách'),
        c('Em đọc cuốn s___ mới.', 'ách', 'ếch'),
        c('Bé rửa tay s___ sẽ.', 'ạch', 'ệch'),
        c('Chú thợ xây xếp g___.', 'ạch', 'ệch'),
        c('Bức tranh treo bị l___.', 'ệch', 'ạch'),
        c('Chú chó con có cái mũi h___.', 'ếch', 'ách'),
        c('Mặt bé trắng b___ vì sợ.', 'ệch', 'ạch'),
        loi('Con ách kêu ộp ộp.', 'ách', 'ếch'),
        loi('Em xếp sếch vở gọn gàng.', 'sếch', 'sách'),
        nghe('Chú ếch nhỏ ngồi bên bờ ao sạch.')
      ] },
    'ien-yen-uyen': { ten: 'iên, yên hay uyên?', icon: '⛵', quyTac: [
        'Có âm đầu → viết **iê**: cô **tiên**, **biển** xanh, **điện**.',
        'Không có âm đầu → viết **yê**: **yên** xe, **yên** tĩnh.',
        'Có âm đệm **u** → viết **uyê**: **khuyên**, con **thuyền**, **truyện**, quyển vở.'],
      viDu: ['cô tiên', 'biển xanh', 'yên xe', 'con thuyền', 'truyện cổ tích'],
      baiTap: [
        c('Con th___ ra khơi đánh cá.', 'uyền', 'iền'),
        c('Em ngồi sau ___ xe đạp.', 'yên', 'iên'),
        c('Mẹ kh___ em học bài chăm chỉ.', 'uyên', 'iên'),
        c('Cả nhà đi tắm b___.', 'iển', 'uyển'),
        c('Em thích đọc tr___ cổ tích.', 'uyện', 'iện'),
        c('Lớp học thật ___ tĩnh.', 'yên', 'iên'),
        c('Bà kể chuyện cô t___.', 'iên', 'uyên'),
        c('Bé có một qu___ vở mới.', 'yển', 'iển'),
        c('Mẹ bật đ___ cho sáng.', 'iện', 'uyện'),
        loi('Chiếc thiền nhỏ trôi trên sông.', 'thiền', 'thuyền'),
        loi('Em ngồi lên iên xe.', 'iên', 'yên'),
        loi('Bé đọc chiện cổ tích.', 'chiện', 'chuyện'),
        nghe('Con thuyền nhỏ trôi yên bình trên biển.'),
        nghe('Mẹ khuyên em đọc truyện mỗi tối.')
      ] },
    'ieu-yeu-iu': { ten: 'iêu, yêu hay iu?', icon: '🪁', quyTac: [
        'Có âm đầu → viết **iêu**: cánh **diều**, buổi **chiều**, hạt **tiêu**.',
        'Không có âm đầu → viết **yêu**: **yêu** thương, ốm **yếu**.',
        'Vần **iu** đọc ngắn hơn: cái **rìu**, **dịu** dàng, nhỏ **xíu**.'],
      viDu: ['cánh diều', 'buổi chiều', 'yêu thương', 'cái rìu', 'nhỏ xíu'],
      baiTap: [
        c('Em ___ mẹ nhiều lắm.', 'yêu', 'iêu'),
        c('Bé thả d___ trên đồi.', 'iều', 'ìu'),
        c('Buổi ch___, em tưới cây.', 'iều', 'ìu'),
        c('Bố dùng cái r___ chặt củi.', 'ìu', 'iều'),
        c('Chú gà con nhỏ x___.', 'íu', 'iếu'),
        c('Bạn ốm nên người còn ___.', 'yếu', 'iếu'),
        c('Cô giáo nói giọng d___ dàng.', 'ịu', 'iệu'),
        c('Mẹ rắc hạt t___ vào bát canh.', 'iêu', 'iu'),
        c('Em ch___ khó học bài.', 'ịu', 'iệu'),
        loi('Em rất iêu bà ngoại.', 'iêu', 'yêu'),
        loi('Bé thả dìu trên bãi cỏ.', 'dìu', 'diều'),
        nghe('Chiều chiều, em thích thả diều.'),
        nghe('Em yêu bà, yêu mẹ, yêu cô giáo.')
      ] },
    'en-eng': { ten: 'en hay eng?', icon: '🔔', quyTac: [
        'Vần **en**: cái **đèn**, thổi **kèn**, cô **khen**, áo **len**.',
        'Vần **eng**: cái **xẻng**, **leng keng**, tiếng **kẻng**, xà **beng**.'],
      viDu: ['cái đèn', 'thổi kèn', 'áo len', 'cái xẻng', 'leng keng'],
      baiTap: [
        c('Bố bật đ___ học cho em.', 'èn', 'èng'),
        c('Chú xúc đất bằng cái x___.', 'ẻng', 'ẻn'),
        c('Chuông xe đạp kêu l___ keng.', 'eng', 'en'),
        c('Cô giáo kh___ em chăm ngoan.', 'en', 'eng'),
        c('Mẹ đan áo l___ cho em.', 'en', 'eng'),
        c('Bé thổi k___ toe toe.', 'èn', 'èng'),
        c('Tiếng k___ báo giờ ăn trưa.', 'ẻng', 'ẻn'),
        c('Khi xếp hàng, em không ch___ lấn.', 'en', 'eng'),
        loi('Chú dùng xẻn xúc cát.', 'xẻn', 'xẻng'),
        loi('Bé bật đèng đọc truyện.', 'đèng', 'đèn'),
        nghe('Tiếng kẻng vang lên, cô khen cả lớp.')
      ] },
    'i-y': { ten: 'i hay y?', icon: '🩺', quyTac: [
        'Tiếng không có âm đầu → thường viết **y**: **y** tá, **ý** kiến, **yêu**.',
        'Sau âm đệm **u** → viết **y**: **khuy** áo, **suy** nghĩ, **huy** hiệu, tàu **thuỷ**.',
        'Sau phụ âm, sách giáo khoa hiện nay viết **i**: bác **sĩ**, **kĩ** năng, **mĩ** thuật, **lí** do.'],
      viDu: ['y tá', 'ý kiến', 'khuy áo', 'suy nghĩ', 'bác sĩ', 'kĩ năng'],
      baiTap: [
        c('Cô ___ tá chăm sóc người bệnh.', 'y', 'i'),
        c('Em nêu ___ kiến của mình.', 'ý', 'í'),
        c('Mẹ đơm khu___ áo cho em.', 'y', 'i'),
        c('Em su___ nghĩ rồi mới trả lời.', 'y', 'i'),
        c('Bác s___ khám bệnh cho em.', 'ĩ', 'ỹ'),
        c('Bạn Hà học giỏi môn m___ thuật.', 'ĩ', 'ỹ'),
        c('Em được tặng hu___ hiệu.', 'y', 'i'),
        c('Em luyện k___ năng bơi.', 'ĩ', 'ỹ'),
        loi('Mẹ đơm lại cái khui áo.', 'khui', 'khuy'),
        loi('Em xin nêu í kiến.', 'í', 'ý'),
        nghe('Bác sĩ và cô y tá chăm sóc em rất tận tình.')
      ] },
    'ay-ay2': { ten: 'ay hay ây?', icon: '☁️', quyTac: [
        'Vần **ay** (âm **a** ngắn): máy **bay**, bàn **tay**, ớt **cay**, **may** áo.',
        'Vần **ây** (âm **â**): đám **mây**, cái **cây**, nhảy **dây**, **xây** nhà.'],
      viDu: ['máy bay', 'bàn tay', 'đám mây', 'cái cây', 'nhảy dây'],
      baiTap: [
        c('Đám m___ trôi trên bầu trời.', 'ây', 'ay'),
        c('Máy b___ bay qua làng.', 'ay', 'ây'),
        c('Bố trồng một c___ bưởi.', 'ây', 'ay'),
        c('Quả ớt rất c___.', 'ay', 'ây'),
        c('Em nhảy d___ ở sân trường.', 'ây', 'ay'),
        c('Mẹ m___ áo mới cho em.', 'ay', 'ây'),
        c('Bé x___ lâu đài bằng cát.', 'ây', 'ay'),
        c('Em ch___ thi về đích.', 'ạy', 'ậy'),
        c('Bạn Nam ngủ d___ sớm.', 'ậy', 'ạy'),
        loi('Đám may đen kéo đến.', 'may', 'mây'),
        loi('Bé giơ tây chào cô.', 'tây', 'tay'),
        nghe('Máy bay bay qua đám mây trắng.')
      ] }
  };

  /* Câu thêm cho các cặp tách từ ngân hàng cũ còn ít câu */
  var THEM = {
    'an-ang': [
      c('Bé ngồi vào b___ học bài.', 'àn', 'àng'),
      c('Cả lớp hát v___ bài ca.', 'ang', 'an'),
      c('Trời đã s___, gà gáy vang.', 'áng', 'án'),
      c('Em chơi với b___ thân.', 'ạn', 'ạng'),
      c('Em t___ học lúc năm giờ chiều.', 'an', 'ang'),
      loi('Bạn Lan là bạng thân của em.', 'bạng', 'bạn')
    ],
    'at-ac': [
      c('Bé h___ một bài thật hay.', 'át', 'ác'),
      c('Em ăn hết một b___ cơm.', 'át', 'ác'),
      c('Con h___ trắng bay trên đồng.', 'ạc', 'ạt'),
      c('Bà nhặt từng h___ thóc.', 'ạt', 'ạc'),
      loi('Bà nhặt từng hạc thóc rơi.', 'hạc', 'hạt')
    ],
    'uon-uong': [
      c('Chú ch___ chuồn bay thấp.', 'uồn', 'uồng'),
      c('Mẹ nấu canh rau m___.', 'uống', 'uốn'),
      c('Bà ngồi nhổ cỏ bên l___ rau cải.', 'uống', 'uốn'),
      c('Em m___ đi chơi công viên.', 'uốn', 'uống'),
      c('Bé đã vui, không còn b___ nữa.', 'uồn', 'uồng'),
      c('Bác nông dân cày r___.', 'uộng', 'uộn'),
      c('Em đi x___ cầu thang thật chậm.', 'uống', 'uốn'),
      loi('Bố vừa cày xong thửa ruộn.', 'ruộn', 'ruộng'),
      nghe('Chuồn chuồn bay qua ruộng lúa xanh.')
    ],
    'uoc-uot': [
      c('Em mơ ___ được làm cô giáo.', 'ước', 'ướt'),
      c('Sàn nhà ___ nên rất trơn.', 'ướt', 'ước'),
      c('Bé đi chậm từng b___.', 'ước', 'ướt'),
      c('Thuyền l___ nhanh trên mặt hồ.', 'ướt', 'ước'),
      c('Lá cây ___ đẫm sương sớm.', 'ướt', 'ước'),
      loi('Trời mưa, áo em bị ước sũng.', 'ước', 'ướt'),
      loi('Em uống nướt đun sôi để nguội.', 'nướt', 'nước'),
      nghe('Trời mưa, áo em ướt, em bước thật nhanh.')
    ],
    'iec-iet': [
      c('Bà mua một ch___ nón lá.', 'iếc', 'iết'),
      c('Mẹ t___ kiệm điện, nước.', 'iết', 'iếc'),
      c('Cả nhà đi dự t___ cưới.', 'iệc', 'iệt'),
      c('Em v___ thư cho ông bà.', 'iết', 'iếc'),
      loi('Cô tặng em một chiết bút.', 'chiết', 'chiếc'),
      nghe('Em viết thư mời bạn đến dự tiệc.')
    ],
    'uu-iu': [
      c('Ông em đã về h___.', 'ưu', 'iu'),
      c('Cây l___ trĩu quả.', 'ựu', 'ịu'),
      c('Chim hót l___ lo.', 'íu', 'ứu'),
      c('Mẹ đ___ em bé trên lưng.', 'ịu', 'ựu'),
      c('Bố chặt củi bằng cái r___.', 'ìu', 'ừu'),
      c('Bé ngoan, ch___ khó học bài.', 'ịu', 'ựu'),
      loi('Bố chặt củi bằng cái rừu.', 'rừu', 'rìu'),
      loi('Cây lịu sai trĩu quả.', 'lịu', 'lựu'),
      nghe('Đàn cừu ăn cỏ dưới gốc cây lựu.')
    ],
    'r-gi': [
      c('Mẹ ___ửa rau thật sạch.', 'r', 'gi'),
      c('Cơn ___ó thổi mát rượi.', 'gi', 'r'),
      c('Bố mua một ___ỏ cam.', 'gi', 'r'),
      c('Bé ___ót nước cho bà.', 'r', 'gi'),
      c('Em ___úp mẹ quét nhà.', 'gi', 'r'),
      loi('Bé dót nước mời bà.', 'dót', 'rót')
    ],
    'r-d': [
      c('Cô giáo ___ạy em đọc.', 'd', 'r'),
      c('Bố mua ___ổ rá mới.', 'r', 'd'),
      c('Em ăn cháo ___au ngót.', 'r', 'd'),
      c('Bé ___ọn đồ chơi gọn gàng.', 'd', 'r'),
      loi('Cô giáo rạy em tập viết.', 'rạy', 'dạy')
    ],
    'gi-d': [
      c('Bà ___ỗ em bé ngủ.', 'd', 'gi'),
      c('Em ___ặt quần áo cùng mẹ.', 'gi', 'd'),
      c('Bé ___ắt tay em đi chơi.', 'd', 'gi'),
      c('Ông ___à kể chuyện ngày xưa.', 'gi', 'd'),
      loi('Bé dúp mẹ nhặt rau.', 'dúp', 'giúp')
    ],
    'c-k': [
      c('Chú ___ỳ đà nằm phơi nắng.', 'k', 'c'),
      c('Bé ăn ___ơm ngon miệng.', 'c', 'k'),
      c('Bố ___ê bàn học cho em.', 'k', 'c'),
      c('Các bạn chơi trò ___éo co.', 'k', 'c')
    ]
  };

  /* ===================== TÁCH CẶP TỪ NGÂN HÀNG CŨ ===================== */
  var TONES = /[̣̀́̃̉]/g;
  function bare(s) { return String(s).normalize('NFD').replace(TONES, '').normalize('NFC').toLowerCase(); }
  var CONS = ['ngh', 'gh', 'gi', 'ng', 'ch', 'tr', 'kh', 'th', 'nh', 'ph', 'qu', 'c', 'k', 'q', 'g', 'd', 'r', 's', 'x', 'l', 'n', 'v', 'b', 'h', 'm', 't'];
  function onset(w) { w = bare(w); for (var i = 0; i < CONS.length; i++) if (w.indexOf(CONS[i]) === 0) return CONS[i] === 'qu' ? 'q' : CONS[i]; return ''; }
  function rime(w) { w = bare(w).replace(/[.,!?;:]/g, ''); var o = onset(w); return o === 'q' ? w.slice(1) : w.slice(o === 'gi' && w.length > 2 ? 2 : o.length); }
  function words(s) { return String(s).split(/\s+/).map(function (w) { return w.replace(/[.,!?;:“”"]/g, ''); }).filter(Boolean); }
  /* kiểu 'dau': lấy câu có đáp án thuộc tập phụ âm đầu, lựa chọn thu lại trong tập;
     kiểu 'van': lấy câu mà mọi lựa chọn (bỏ dấu thanh) thuộc tập vần */
  function split(fromId, kind, set) {
    var t = D.chuDe.filter(function (x) { return x.id === fromId; })[0]; if (!t) return { baiTap: [], sinh: [] };
    function keep(b) {
      if (b.loai === 'chon') {
        if (kind === 'dau') {
          if (set.indexOf(b.dapAn) < 0) return null;
          var opts = b.luaChon.filter(function (o) { return set.indexOf(o) >= 0; });
          return opts.length >= 2 ? Object.assign({}, b, { luaChon: opts }) : null;
        }
        return b.luaChon.every(function (o) { return set.indexOf(rime(o)) >= 0 || set.indexOf(bare(o)) >= 0; }) ? b : null;
      }
      if (b.loai === 'timLoi') {
        if (kind === 'dau') return set.indexOf(onset(b.tuSai)) >= 0 && set.indexOf(onset(b.tuDung)) >= 0 ? b : null;
        return set.indexOf(rime(b.tuSai)) >= 0 && set.indexOf(rime(b.tuDung)) >= 0 ? b : null;
      }
      if (b.loai === 'ngheViet') {
        return words(b.cau).some(function (w) { return kind === 'dau' ? set.indexOf(onset(w)) >= 0 : set.indexOf(rime(w)) >= 0; }) ? b : null;
      }
      return null;
    }
    return {
      quyTac: t.quyTac, viDu: t.viDu, icon: t.bieuTuong,
      baiTap: t.baiTap.map(keep).filter(Boolean),
      sinh: (t.sinh || []).map(keep).filter(Boolean)
    };
  }
  function whole(id) { var t = D.chuDe.filter(function (x) { return x.id === id; })[0]; return { ten: t.ten, quyTac: t.quyTac, viDu: t.viDu, icon: t.bieuTuong, baiTap: t.baiTap.slice(), sinh: (t.sinh || []).slice() }; }

  var CAP = {
    's-x': whole('s-x'), 'ch-tr': whole('ch-tr'), 'l-n': whole('l-n'), 'g-gh': whole('g-gh'), 'ng-ngh': whole('ng-ngh'),
    'hoi-nga': whole('hoi-nga'), 'ai-ay': whole('ai-ay'), 'c-k-q': whole('c-k-q'), 'd-gi-r': whole('d-gi-r'),
    'c-k': Object.assign(split('c-k-q', 'dau', ['c', 'k']), { ten: 'c hay k?', quyTac: ['Viết **k** khi đứng trước **i, e, ê**: **k**ì, **k**ẻ, **k**ể, **k**iến.', 'Các trường hợp còn lại viết **c**: **c**á, **c**ô, **c**ụ, **c**ơm.'] }),
    'gi-d': Object.assign(split('d-gi-r', 'dau', ['gi', 'd']), { ten: 'gi hay d?', quyTac: ['**gi** và **d** nhiều nơi đọc giống nhau – cần **nhớ từ**: **gi**a đình, **gi**ữ **gì**n, **gi**ó · **d**ịu **d**àng, **d**ễ, **d**òng sông.', 'Từ láy thường cùng âm đầu: **d**ịu **d**àng, **gi**ữ **gì**n.'] }),
    'r-d': Object.assign(split('d-gi-r', 'dau', ['r', 'd']), { ten: 'r hay d?', quyTac: ['Từ láy chỉ tiếng động thường viết **r**: **r**ì **r**ào, **r**óc **r**ách, **r**ộn **r**àng.', 'Cần nhớ từ: con **r**ùa, **r**au, **r**ửa · **d**ạy, **d**ịu **d**àng, **d**ễ.'] }),
    'r-gi': Object.assign(split('d-gi-r', 'dau', ['r', 'gi']), { ten: 'r hay gi?', quyTac: ['Âm **r** rung đầu lưỡi: con **r**ùa, **r**au, **r**ửa tay, **r**ót nước.', 'Âm **gi**: **gi**a đình, cơn **gi**ó, cái **gi**ỏ, **gi**úp đỡ.'] }),
    'an-ang': Object.assign(split('an-ang', 'van', ['an', 'ang']), { ten: 'an hay ang?' }),
    'at-ac': Object.assign(split('an-ang', 'van', ['at', 'ac']), { ten: 'at hay ac?' }),
    'uon-uong': Object.assign(split('uon-uong', 'van', ['uôn', 'uông']), { ten: 'uôn hay uông?' }),
    'uon-uong-2': Object.assign(split('uon-uong-2', 'van', ['ươn', 'ương']), { ten: 'ươn hay ương?' }),
    'uoc-uot': Object.assign(split('uon-uong-2', 'van', ['ươc', 'ươt']), { ten: 'ươc hay ươt?' }),
    'ien-ieng': Object.assign(split('ien-ieng', 'van', ['iên', 'iêng']), { ten: 'iên hay iêng?' }),
    'iec-iet': Object.assign(split('ien-ieng', 'van', ['iêc', 'iêt']), { ten: 'iêc hay iêt?' }),
    'uu-iu': Object.assign(split('ui-uy', 'van', ['ưu', 'iu']), { ten: 'ưu hay iu?', quyTac: ['Vần **ưu**: con **cừu**, **bưu** điện, quả **lựu**, về **hưu**.', 'Vần **iu**: nhỏ **xíu**, **dịu** dàng, cái **rìu**, **líu** lo.'] })
  };
  Object.keys(CAP_MOI).forEach(function (k) { var m = CAP_MOI[k]; CAP[k] = { ten: m.ten, quyTac: m.quyTac, viDu: m.viDu, icon: m.icon, baiTap: m.baiTap, sinh: [] }; });
  Object.keys(THEM).forEach(function (k) { CAP[k].baiTap = CAP[k].baiTap.concat(THEM[k]); });

  /* ===================== DANH MỤC BÀI THEO LỚP (đúng thứ tự thầy/cô gửi) ===================== */
  var CHUONG_TRINH = {
    1: [
      ['s/x · tr/ch', ['s-x', 'ch-tr']],
      ['ươc/ươt · inh/in', ['uoc-uot', 'in-inh']],
      ['n/l · c/k', ['l-n', 'c-k']],
      ['uyp/uyu · uynh/uych', ['uyp-uyu', 'uynh-uych']],
      ['gi/d · ng/ngh', ['gi-d', 'ng-ngh']],
      ['n/l · g/gh', ['l-n', 'g-gh']],
      ['tr/ch · gh/g · r hay gi', ['ch-tr', 'g-gh', 'r-gi']],
      ['c/k · v/d', ['c-k', 'v-d']],
      ['Dấu hỏi / dấu ngã', ['hoi-nga']],
      ['ai/ay · iêc/iêt', ['ai-ay', 'iec-iet']],
      ['ân/uân · im/iêm', ['an-uan', 'im-iem']],
      ['yêng/iêng · iêc/iêt · et/oet', ['ieng-yeng', 'iec-iet', 'et-oet']],
      ['r/d', ['r-d']],
      ['ong/ông · anh/ênh', ['ong-ong', 'anh-enh']],
      ['inh/uynh · oan/oăn', ['inh-uynh', 'oan-oan2']],
      ['oa/uê · ưu/iu', ['oa-ue', 'uu-iu']],
      ['ich/it · ach/êch', ['ich-it', 'ach-ech']]
    ],
    2: [
      ['ch/tr', ['ch-tr']],
      ['v/d', ['v-d']],
      ['s/x', ['s-x']],
      ['Dấu hỏi / dấu ngã', ['hoi-nga']],
      ['g/gh', ['g-gh']],
      ['ng/ngh', ['ng-ngh']],
      ['ch/tr (ôn tập)', ['ch-tr']],
      ['uôn/uông', ['uon-uong']],
      ['iên, yên hay uyên', ['ien-yen-uyen']],
      ['l/n', ['l-n']]
    ],
    3: [
      ['c/k', ['c-k']],
      ['gi/r/d', ['d-gi-r']],
      ['ng/ngh', ['ng-ngh']],
      ['ch/tr · v/d', ['ch-tr', 'v-d']],
      ['s/x · dấu hỏi/ngã', ['s-x', 'hoi-nga']],
      ['r/d/gi · an/ang', ['d-gi-r', 'an-ang']],
      ['iên · iêng/yêng', ['ien-ieng', 'ieng-yeng']],
      ['iêu/yêu/iu · en/eng', ['ieu-yeu-iu', 'en-eng']],
      ['l/n · s/x', ['l-n', 's-x']],
      ['s/x · uôn/uông', ['s-x', 'uon-uong']],
      ['r/d/gi · ươn/ương', ['d-gi-r', 'uon-uong-2']],
      ['iên/yên · an/ang', ['ien-yen-uyen', 'an-ang']],
      ['iên · iêng/yêng (ôn tập)', ['ien-ieng', 'ieng-yeng']],
      ['ch/tr · at/ac', ['ch-tr', 'at-ac']],
      ['s/x · at/ac', ['s-x', 'at-ac']],
      ['r/d/gi · in/inh', ['d-gi-r', 'in-inh']],
      ['i/y · dấu hỏi/ngã', ['i-y', 'hoi-nga']],
      ['iu/ưu · im/iêm', ['uu-iu', 'im-iem']],
      ['s/x · v/d', ['s-x', 'v-d']],
      ['c/k/q · dấu hỏi/ngã', ['c-k-q', 'hoi-nga']],
      ['ch/tr · ươc/ươt', ['ch-tr', 'uoc-uot']],
      ['s/x · dấu hỏi/ngã (ôn tập)', ['s-x', 'hoi-nga']],
      ['ch/tr · ay/ây', ['ch-tr', 'ay-ay2']],
      ['r/d/gi · dấu hỏi/ngã', ['d-gi-r', 'hoi-nga']]
    ]
  };
  var MAU = ['#ff8a65', '#ffb74d', '#81c784', '#4fc3f7', '#ba68c8', '#f06292', '#4db6ac', '#9575cd', '#e57373', '#64b5f6'];
  var GIOI_HAN = { chon: 12, timLoi: 4, ngheViet: 3 };

  /* Lấy đều từ mỗi cặp (theo thứ tự cố định để mã câu không đổi giữa các lần mở web) */
  function pick(parts, loai, n, offset) {
    var lists = parts.map(function (p) { return p.baiTap.filter(function (b) { return b.loai === loai; }); });
    var out = [], i = 0;
    while (out.length < n && lists.some(function (l) { return l.length > i; })) {
      lists.forEach(function (l, k) { var j = (i + offset * (k + 1)) % Math.max(1, l.length); if (i < l.length && out.length < n) out.push(l[j]); });
      i++;
    }
    return out;
  }
  function interleave(arrs, max) { var out = [], i = 0; while (out.length < max && arrs.some(function (a) { return a.length > i; })) { arrs.forEach(function (a) { if (a.length > i && out.length < max && out.indexOf(a[i]) < 0) out.push(a[i]); }); i++; } return out; }

  var lessons = [];
  Object.keys(CHUONG_TRINH).forEach(function (g) {
    var list = CHUONG_TRINH[g], half = Math.ceil(list.length / 2);
    list.forEach(function (row, idx) {
      var parts = row[1].map(function (id) { if (!CAP[id]) throw new Error('Thiếu cặp chính tả: ' + id); return CAP[id]; });
      var n = idx + 1, id = 'l' + g + '-' + (n < 10 ? '0' : '') + n, off = idx * 3;
      var baiTap = [].concat(pick(parts, 'chon', GIOI_HAN.chon, off), pick(parts, 'timLoi', GIOI_HAN.timLoi, off), pick(parts, 'ngheViet', GIOI_HAN.ngheViet, off));
      var multi = parts.length > 1;
      lessons.push({
        id: id, ten: row[0], lop: [Number(g), Number(g)],
        nhom: idx < half ? 'Học kì I' : 'Học kì II',
        bieuTuong: parts[0].icon || '📘', mau: MAU[(n - 1 + Number(g)) % MAU.length],
        cap: row[1],
        quyTac: interleave(parts.map(function (p) { return (p.quyTac || []).map(function (r) { return multi && p.ten ? '(' + p.ten.replace('?', '') + ') ' + r : r; }); }), 6),
        viDu: interleave(parts.map(function (p) { return p.viDu || []; }), 10),
        baiTap: baiTap,
        sinh: [].concat.apply([], parts.map(function (p) { return p.sinh || []; }))
      });
    });
  });
  // Chủ đề cũ: giữ lại (lớp 4–5, chưa triển khai) để hồ sơ/sao lưu cũ vẫn đọc được
  D.chuDe.forEach(function (t) { t.lop = [4, 5]; });
  D.chuDe = lessons.concat(D.chuDe);
  D.capChinhTa = CAP;
  D.chuongTrinh = CHUONG_TRINH;
})();
