/*
 * BỘ SINH CÂU CHÍNH TẢ – Claude Code (đợt 12). Nạp NGAY SAU data/ngan-hang-chinh-ta.js.
 *
 * Câu trong ngân hàng là câu cố định. Tệp này thêm cho mỗi chủ đề một danh sách câu SINH TỰ ĐỘNG (t.sinh):
 *   - mỗi từ có vài “khung câu”; trong khung có chỗ trống cho tên bạn nhỏ {ai}, người thân {nguoi}, số đếm {so};
 *   - mỗi lần lấy câu ra (Object.assign / itemOf trong app.js), tên – người thân – số đếm được bốc ngẫu nhiên,
 *     nên cùng một từ nhưng câu mỗi lần một khác: “Bà cho bé Na một cái kẹo.” / “Bố cho bạn Minh một cái kẹo.”
 *   - mỗi câu sinh có khoá cố định “mã-chủ-đề:g<số>” (thứ tự sinh không đổi) nên vẫn ghi vào sổ ôn, thống kê như câu thường.
 *
 * Cách thêm từ: [từ đúng, phần cần điền, [phần viết sai...], [khung câu...], cờ]
 *   - “~” là chỗ đặt từ, KHÔNG đặt ở đầu câu (để chữ hoa không lộ đáp án);
 *   - phần cần điền = cả từ (dấu hỏi/ngã, viết hoa) hoặc một phần (phụ âm đầu, vần);
 *   - cờ “-” = không sinh câu “tìm chữ viết sai” cho từ này (khi chữ sai trông quá lạ).
 * Kiểm tra tự động (tests/sinh-cau-check.js): đáp án ∈ lựa chọn, lựa chọn không trùng, đúng 1 chỗ trống,
 * chữ sai xuất hiện đúng 1 lần, chuỗi NFC.
 */
(function () {
  'use strict';
  var D = window.NGAN_HANG_CHINH_TA;
  if (!D || !D.chuDe) return;

  var AI = ['bé Na', 'bé Bin', 'bạn Minh', 'bạn Lan', 'chị Mai', 'anh Tú', 'bé Su', 'bạn Khôi', 'bé Bông', 'bạn Hà', 'bé Mít', 'bạn Nam', 'em', 'em'];
  var NGUOI = ['bà', 'mẹ', 'bố', 'ông', 'chị', 'cô', 'bác'];
  var SO = ['hai', 'ba', 'bốn', 'năm', 'sáu', 'bảy', 'tám', 'chín', 'mười'];

  var KHO = {
    'c-k-q': [
      ['kiến', 'k', ['c'], ['{ai} ngồi xem đàn ~ tha mồi.', 'Có {so} con ~ bò trên lá.']],
      ['kẹo', 'k', ['c'], ['{nguoi} cho {ai} một cái ~.', '{ai} chia ~ cho các bạn.']],
      ['kể', 'k', ['c'], ['{nguoi} ~ chuyện cổ tích cho {ai} nghe.']],
      ['kéo', 'k', ['c'], ['{ai} dùng ~ cắt giấy màu.']],
      ['kính', 'k', ['c'], ['{nguoi} đeo ~ để đọc báo.']],
      ['kem', 'k', ['c'], ['Trời nóng, {ai} ăn que ~ mát lạnh.']],
      ['quả', 'q', ['c', 'k'], ['{nguoi} mua {so} ~ cam.', '{ai} hái một ~ ổi chín.'], '-'],
      ['quạt', 'q', ['c'], ['Chiếc ~ trần quay vù vù.'], '-'],
      ['quê', 'q', ['c'], ['Hè này, {ai} về ~ thăm ông bà.']],
      ['cá', 'c', ['k'], ['{ai} cho đàn ~ ăn.', 'Dưới ao có {so} con ~ vàng.']],
      ['cờ', 'c', ['k'], ['Lá ~ đỏ bay trước sân trường.']],
      ['cổ', 'c', ['k'], ['{nguoi} quàng khăn ấm vào ~ cho {ai}.']],
      ['cửa', 'c', ['k'], ['{ai} mở ~ sổ đón nắng.']]
    ],
    'g-gh': [
      ['ghế', 'gh', ['g'], ['{ai} kê ~ ngồi học bài.', 'Trong lớp có {so} cái ~ mới.']],
      ['ghi', 'gh', ['g'], ['Cô ~ tên {ai} vào sổ khen.']],
      ['ghé', 'gh', ['g'], ['Trên đường đi học, {ai} ~ thăm bà.']],
      ['ghép', 'gh', ['g'], ['{ai} ~ các mảnh hình lại với nhau.']],
      ['gà', 'g', ['gh'], ['{nguoi} cho đàn ~ ăn thóc.', 'Sáng sớm, chú ~ trống gáy vang.']],
      ['gỗ', 'g', ['gh'], ['Bàn học của {ai} làm bằng ~.']],
      ['gói', 'g', ['gh'], ['{ai} ~ quà tặng bạn.']],
      ['gấu', 'g', ['gh'], ['{ai} ôm chú ~ bông đi ngủ.']],
      ['gương', 'g', ['gh'], ['{ai} soi ~ chải tóc.']],
      ['gửi', 'g', ['gh'], ['{ai} ~ thư cho ông già Noel.']]
    ],
    'ng-ngh': [
      ['nghe', 'ngh', ['ng'], ['{ai} ~ {nguoi} kể chuyện.', 'Cả lớp chăm chú ~ cô giảng bài.']],
      ['nghỉ', 'ngh', ['ng'], ['Giờ ra chơi, {ai} ~ ngơi một lát.']],
      ['nghé', 'ngh', ['ng'], ['Chú ~ con chạy theo mẹ.']],
      ['nghĩ', 'ngh', ['ng'], ['{ai} suy ~ rồi mới trả lời.']],
      ['nghệ', 'ngh', ['ng'], ['{nguoi} trồng một khóm ~ sau nhà.']],
      ['ngủ', 'ng', ['ngh'], ['Tối nay, {ai} đi ~ sớm.', 'Chú mèo nằm ~ trên ghế.']],
      ['ngõ', 'ng', ['ngh'], ['Nhà {ai} ở cuối ~.']],
      ['ngựa', 'ng', ['ngh'], ['{ai} cưỡi ~ gỗ ở công viên.']],
      ['ngôi', 'ng', ['ngh'], ['Bầu trời có {so} ~ sao lấp lánh.']]
    ],
    's-x': [
      ['sáng', 's', ['x'], ['Buổi ~, {ai} dậy tập thể dục.']],
      ['sách', 's', ['x'], ['{ai} cất ~ vở gọn gàng.']],
      ['sao', 's', ['x'], ['Ngôi ~ trên đỉnh cây thông lấp lánh.']],
      ['sữa', 's', ['x'], ['Mỗi buổi tối, {ai} uống một cốc ~.']],
      ['sân', 's', ['x'], ['Các bạn nhỏ chơi đá cầu trên ~ trường.']],
      ['suối', 's', ['x'], ['Tiếng ~ chảy róc rách.']],
      ['sương', 's', ['x'], ['Buổi sớm, ~ đọng trên lá cỏ.']],
      ['xanh', 'x', ['s'], ['Cây thông Noel có lá ~ mướt.', 'Bầu trời hôm nay ~ trong.']],
      ['xe', 'x', ['s'], ['{nguoi} đưa {ai} đi học bằng ~ đạp.']],
      ['xinh', 'x', ['s'], ['Chiếc váy mới của {ai} thật ~.']],
      ['xếp', 'x', ['s'], ['{ai} ~ hàng ngay ngắn vào lớp.']],
      ['xôi', 'x', ['s'], ['{nguoi} nấu ~ gấc đỏ au.']]
    ],
    'ch-tr': [
      ['trăng', 'tr', ['ch'], ['Đêm rằm, ~ sáng vằng vặc.', '{ai} ngắm ~ cùng {nguoi}.']],
      ['trường', 'tr', ['ch'], ['{ai} đi bộ đến ~ cùng các bạn.']],
      ['tre', 'tr', ['ch'], ['Lũy ~ đầu làng xanh mát.']],
      ['trống', 'tr', ['ch'], ['Tiếng ~ vang lên tùng tùng.']],
      ['tranh', 'tr', ['ch'], ['{ai} vẽ một bức ~ ông già Noel.']],
      ['trứng', 'tr', ['ch'], ['Gà mái đẻ được {so} quả ~.']],
      ['chăm', 'ch', ['tr'], ['{ai} rất ~ chỉ học bài.']],
      ['chim', 'ch', ['tr'], ['Trên cành, {so} chú ~ hót líu lo.']],
      ['chơi', 'ch', ['tr'], ['Giờ ra ~, {ai} nhảy dây.']],
      ['chuông', 'ch', ['tr'], ['Tiếng ~ Noel ngân vang khắp phố.']],
      ['chuối', 'ch', ['tr'], ['{nguoi} mua một nải ~ chín vàng.']]
    ],
    'd-gi-r': [
      ['rùa', 'r', ['d', 'gi'], ['Chú ~ bò chậm chạp.']],
      ['rửa', 'r', ['d', 'gi'], ['{ai} ~ tay trước khi ăn cơm.']],
      ['rau', 'r', ['d', 'gi'], ['{nguoi} hái ~ trong vườn.']],
      ['rừng', 'r', ['d', 'gi'], ['Trong ~ có nhiều chim thú.']],
      ['gió', 'gi', ['d', 'r'], ['Cơn ~ mùa đông thổi lạnh buốt.']],
      ['giường', 'gi', ['d', 'r'], ['{ai} gấp chăn trên ~ thật gọn.']],
      ['giấy', 'gi', ['d', 'r'], ['{ai} gấp ~ thành chiếc thuyền.']],
      ['dạy', 'd', ['gi', 'r'], ['Cô ~ {ai} viết chữ đẹp.']],
      ['dép', 'd', ['gi', 'r'], ['{ai} xếp ~ gọn gàng ở cửa.']],
      ['dừa', 'd', ['gi', 'r'], ['Cây ~ cao vút bên bờ biển.']]
    ],
    'l-n': [
      ['nắng', 'n', ['l'], ['Trời ~ chang chang.', 'Buổi trưa, ~ vàng rực rỡ.']],
      ['nước', 'n', ['l'], ['{ai} uống một cốc ~ ấm.']],
      ['nụ', 'n', ['l'], ['Cành hồng có {so} ~ hoa xinh xắn.']],
      ['nồi', 'n', ['l'], ['{nguoi} nấu một ~ canh ngon.']],
      ['nấu', 'n', ['l'], ['{nguoi} ~ cơm cho cả nhà.']],
      ['lá', 'l', ['n'], ['Chiếc ~ vàng rơi xuống sân.']],
      ['lửa', 'l', ['n'], ['Cả nhà ngồi bên bếp ~ ấm áp.']],
      ['lạnh', 'l', ['n'], ['Mùa đông, trời rất ~.']],
      ['làng', 'l', ['n'], ['Cổng ~ có cây đa to.']],
      ['lớp', 'l', ['n'], ['{ai} vào ~ đúng giờ.']]
    ],
    'an-ang': [
      ['bàn', 'àn', ['àng'], ['{ai} lau ~ học sạch sẽ.']],
      ['bạn', 'ạn', ['ạng'], ['{ai} chơi trốn tìm với ~ thân.']],
      ['đàn', 'àn', ['àng'], ['Một ~ cò trắng bay qua cánh đồng.']],
      ['vàng', 'àng', ['àn'], ['Lá cây ngả màu ~.', '{ai} được tặng một ngôi sao ~.']],
      ['làng', 'àng', ['àn'], ['Cổng ~ có cây đa cổ thụ.']],
      ['thang', 'ang', ['an'], ['{ai} trèo lên ~ treo ngôi sao.']],
      ['hát', 'át', ['ác'], ['{ai} ~ một bài thật hay.']],
      ['cát', 'át', ['ác'], ['{ai} xây lâu đài ~ trên bãi biển.']],
      ['bát', 'át', ['ác'], ['{ai} giúp {nguoi} rửa ~.']],
      ['bác', 'ác', ['át'], ['Chú ~ sĩ khám bệnh cho {ai}.']],
      ['nhạc', 'ạc', ['ạt'], ['{ai} thích nghe ~ Giáng sinh.']]
    ],
    'uon-uong': [
      ['chuông', 'uông', ['uôn'], ['Tiếng ~ nhà thờ ngân vang.']],
      ['luôn', 'uôn', ['uông'], ['{ai} ~ lễ phép với người lớn.']],
      ['muốn', 'uốn', ['uống'], ['{ai} ~ làm một chú người tuyết.']],
      ['cuốn', 'uốn', ['uống'], ['{ai} đọc xong ~ truyện tranh.']],
      ['ruộng', 'uộng', ['uộn'], ['{nguoi} cày ~ ngoài đồng.']],
      ['xuồng', 'uồng', ['uồn'], ['Chiếc ~ nhỏ trôi trên sông.']],
      ['chuột', 'uột', ['uộc'], ['Con ~ nhắt chạy vụt qua.']],
      ['buộc', 'uộc', ['uột'], ['{ai} ~ dây giày thật chặt.']],
      ['thuốc', 'uốc', ['uốt'], ['{ai} uống ~ khi bị ốm.']],
      ['suốt', 'uốt', ['uốc'], ['{ai} chăm chỉ học ~ cả buổi.']]
    ],
    'uon-uong-2': [
      ['vườn', 'ườn', ['ường'], ['{nguoi} trồng rau trong ~.']],
      ['đường', 'ường', ['ườn'], ['{ai} đi bộ trên con ~ làng.']],
      ['lượn', 'ượn', ['ượng'], ['Cánh diều bay ~ trên trời.']],
      ['gương', 'ương', ['ươn'], ['{ai} soi ~ chải tóc.']],
      ['thương', 'ương', ['ươn'], ['{ai} rất ~ {nguoi}.']],
      ['vượt', 'ượt', ['ược'], ['Chú ếch nhảy ~ qua vũng nước.']],
      ['mượt', 'ượt', ['ược'], ['Mái tóc của {ai} đen ~.']],
      ['nước', 'ước', ['ướt'], ['{ai} uống một cốc ~ ấm.']],
      ['lược', 'ược', ['ượt'], ['{ai} dùng ~ chải tóc.']],
      ['bước', 'ước', ['ướt'], ['Em bé tập ~ đi chập chững.']]
    ],
    'ien-ieng': [
      ['biển', 'iển', ['iểng'], ['Hè này, {ai} được đi tắm ~.']],
      ['tiếng', 'iếng', ['iến'], ['Sáng sớm, ~ chim hót líu lo.']],
      ['siêng', 'iêng', ['iên'], ['{ai} rất ~ năng.']],
      ['tiên', 'iên', ['iêng'], ['{ai} thích đọc truyện cô ~.']],
      ['điện', 'iện', ['iệng'], ['{nguoi} gọi ~ thoại cho {ai}.']],
      ['miệng', 'iệng', ['iện'], ['{ai} súc ~ sau khi ăn.']],
      ['viết', 'iết', ['iếc'], ['{ai} ~ chữ thật đẹp.']],
      ['biết', 'iết', ['iếc'], ['{ai} đã ~ đọc truyện.']],
      ['tiệc', 'iệc', ['iệt'], ['Cả lớp tổ chức ~ Giáng sinh.']],
      ['xiếc', 'iếc', ['iết'], ['{nguoi} đưa {ai} đi xem ~.']]
    ],
    'ai-ay': [
      ['tay', 'ay', ['ai'], ['{ai} giơ ~ xin phát biểu.']],
      ['bay', 'ay', ['ai'], ['Đàn chim ~ về tổ.']],
      ['máy', 'áy', ['ái'], ['Chiếc ~ bay lượn trên bầu trời.']],
      ['ngày', 'ày', ['ài'], ['Hôm nay là ~ Giáng sinh.']],
      ['cày', 'ày', ['ài'], ['{nguoi} ~ ruộng ngoài đồng.']],
      ['chai', 'ai', ['ay'], ['{ai} rót nước từ ~ ra cốc.']],
      ['vải', 'ải', ['ảy'], ['{nguoi} mua một chùm ~ thiều.']],
      ['nai', 'ai', ['ay'], ['Một chú ~ nhỏ đứng bên suối.']],
      ['tai', 'ai', ['ay'], ['Chú thỏ vểnh đôi ~ lắng nghe.']]
    ],
    'ao-au': [
      ['sao', 'ao', ['au'], ['Trên trời có {so} ngôi ~.']],
      ['cháo', 'áo', ['áu'], ['{nguoi} nấu ~ cho {ai}.']],
      ['báo', 'áo', ['áu'], ['{nguoi} đọc ~ buổi sáng.']],
      ['chào', 'ào', ['àu'], ['{ai} lễ phép ~ thầy cô.']],
      ['táo', 'áo', ['áu'], ['{ai} ăn một quả ~ đỏ.']],
      ['mào', 'ào', ['àu'], ['Chú gà trống có cái ~ đỏ.'], '-'],
      ['rau', 'au', ['ao'], ['{nguoi} nấu canh ~ ngót.']],
      ['màu', 'àu', ['ào'], ['{ai} tô ~ cây thông Noel.']],
      ['cau', 'au', ['ao'], ['Trước ngõ có hàng ~ xanh tốt.']],
      ['đau', 'au', ['ao'], ['{ai} bị ~ răng nên đi khám.']]
    ],
    'ui-uy': [
      ['núi', 'úi', ['úy'], ['Ngọn ~ cao chót vót.']],
      ['túi', 'úi', ['úy'], ['{ai} để kẹo trong ~ áo.']],
      ['vui', 'ui', ['uy'], ['Cả lớp ~ vẻ đón Giáng sinh.']],
      ['mũi', 'ũi', ['ũy'], ['Chú hề có cái ~ đỏ.']],
      ['khuy', 'uy', ['ui'], ['{nguoi} đơm lại cái ~ áo.']],
      ['huy', 'uy', ['ui'], ['{ai} được tặng một tấm ~ hiệu.']],
      ['rìu', 'ìu', ['ừu'], ['Bác tiều phu dùng ~ chặt củi.']],
      ['chịu', 'ịu', ['ựu'], ['{ai} rất ~ khó học bài.']],
      ['cứu', 'ứu', ['íu'], ['Chú lính ~ hỏa dập tắt đám cháy.']],
      ['bưu', 'ưu', ['iu'], ['{nguoi} ra ~ điện gửi quà.']]
    ],
    'an-ang-2': [
      ['khăn', 'ăn', ['ăng'], ['{ai} quàng ~ len đỏ cho ấm.']],
      ['chăn', 'ăn', ['ăng'], ['{ai} đắp ~ ấm khi ngủ.']],
      ['trăng', 'ăng', ['ăn'], ['Vầng ~ tròn treo trên trời.']],
      ['măng', 'ăng', ['ăn'], ['{nguoi} luộc ~ tre.']],
      ['bằng', 'ằng', ['ằn'], ['{ai} đi học ~ xe đạp.']],
      ['lặn', 'ặn', ['ặng'], ['Mặt trời ~ sau núi.']],
      ['sân', 'ân', ['âng'], ['Các bạn chơi trên ~ trường.']],
      ['cân', 'ân', ['âng'], ['Bác bán hàng ~ cam cho {nguoi}.']],
      ['tầng', 'ầng', ['ần'], ['Nhà {ai} ở ~ hai.']],
      ['vâng', 'âng', ['ân'], ['{ai} ~ lời {nguoi}.']],
      ['nâng', 'âng', ['ân'], ['{ai} ~ niu chú mèo con.']]
    ],
    'hoi-nga': [
      ['vẽ', 'vẽ', ['vẻ'], ['{ai} ~ một cây thông Noel.']],
      ['vẻ', 'vẻ', ['vẽ'], ['Cả lớp vui ~ đón Giáng sinh.']],
      ['nghĩ', 'nghĩ', ['nghỉ'], ['{ai} suy ~ rất lâu.']],
      ['nghỉ', 'nghỉ', ['nghĩ'], ['Chủ nhật, {ai} được ~ học.']],
      ['sữa', 'sữa', ['sửa'], ['{ai} uống ~ trước khi đi ngủ.']],
      ['sửa', 'sửa', ['sữa'], ['{nguoi} ~ chiếc xe đạp cho {ai}.']],
      ['giữ', 'giữ', ['giử'], ['{ai} ~ gìn sách vở cẩn thận.']],
      ['nhỏ', 'nhỏ', ['nhõ'], ['Chú mèo ~ nằm sưởi nắng.']],
      ['mỗi', 'mỗi', ['mổi'], ['{ai} đánh răng ~ sáng.']],
      ['cũ', 'cũ', ['củ'], ['Chiếc áo ~ vẫn còn ấm.']],
      ['củ', 'củ', ['cũ'], ['{nguoi} nhổ ~ cà rốt làm mũi người tuyết.']],
      ['bão', 'bão', ['bảo'], ['Cơn ~ đi qua, cây đổ nhiều.']],
      ['bảo', 'bảo', ['bão'], ['Cô giáo ~ {ai} đọc bài.']]
    ],
    'dau-thanh': [
      ['mía', 'mía', ['miá'], ['{ai} thích ăn ~.']],
      ['múa', 'múa', ['muá'], ['Các bạn ~ hát mừng Giáng sinh.']],
      ['cửa', 'cửa', ['cưả'], ['{ai} mở ~ sổ.']],
      ['lửa', 'lửa', ['lưả'], ['Bếp ~ hồng ấm áp.']],
      ['chuối', 'chuối', ['chúôi'], ['{nguoi} mua một nải ~.']],
      ['tiếng', 'tiếng', ['tíêng'], ['{ai} nghe ~ chuông ngân vang.']],
      ['người', 'người', ['ngừơi'], ['Mọi ~ cùng hát mừng Noel.']],
      ['mùa', 'mùa', ['muà'], ['Tuyết rơi vào ~ đông.']],
      ['quà', 'quà', ['qùa'], ['{ai} nhận được ~ Giáng sinh.']],
      ['nướng', 'nướng', ['nứơng'], ['{nguoi} ~ bánh quy gừng.']],
      ['giữa', 'giữa', ['giưã'], ['Cây thông đứng ~ phòng khách.']]
    ],
    'tu-kho': [
      ['sẵn', 'sẵn', ['sẳn'], ['{ai} luôn ~ sàng giúp bạn.']],
      ['xuất', 'xuất', ['suất'], ['{ai} là học sinh ~ sắc.']],
      ['xác', 'xác', ['sác'], ['Câu trả lời của {ai} rất chính ~.']],
      ['giản', 'giản', ['dản'], ['Bài toán này rất đơn ~.']],
      ['xuống', 'xuống', ['suống'], ['Tuyết rơi ~ mái nhà.']],
      ['sắc', 'sắc', ['xắc'], ['Bức tranh có nhiều màu ~.']],
      ['trân', 'trân', ['chân'], ['{ai} ~ trọng tình bạn.']],
      ['chân', 'chân', ['trân'], ['{ai} ~ thành cảm ơn {nguoi}.']],
      ['gìn', 'gìn', ['dìn'], ['{ai} giữ ~ đồ dùng học tập.']],
      ['dũng', 'dũng', ['dủng'], ['Chú bộ đội rất ~ cảm.']],
      ['nghiêng', 'nghiêng', ['nghiên'], ['Chữ của {ai} viết hơi ~.']]
    ]
  };

  /* Mỗi từ trong KHO có thêm ngữ cảnh lớp học, sách và trò chơi.
     Các câu khung dùng “từ ~” để mọi âm/vần đều lắp vào tự nhiên. */
  var KHUNG_BO_SUNG = [
    '{ai} viết từ ~ vào vở ô li.',
    'Cô giáo đọc từ ~ để {ai} đánh vần.',
    'Trên tấm thẻ của {ai}, từ cần tìm là ~.',
    '{ai} tìm từ ~ trong trang sách hôm nay.',
    'Cả nhóm cùng chọn từ ~ trong trò chơi chữ.'
  ];

  /* Viết hoa tên riêng: lựa chọn sai sinh tự động (viết thường hết / chỉ hoa chữ đầu) */
  var DIA_DANH = ['Hà Nội', 'Huế', 'Đà Nẵng', 'Hạ Long', 'Cần Thơ', 'Sa Pa', 'Hải Phòng', 'Nha Trang', 'Đà Lạt', 'Phú Quốc'];
  var TEN_NGUOI = ['Trần Bảo Ngọc', 'Lê Gia Huy', 'Phạm Thu Hà', 'Nguyễn Đức Minh', 'Võ Khánh Linh', 'Đỗ Quang Vinh'];
  var KHUNG_DIA_DANH = ['Quê ngoại của {ai} ở ~.', 'Hè này, {ai} được đi chơi ở ~.', 'Năm nay, cả nhà {ai} đón Giáng sinh ở ~.'];
  var KHUNG_TEN = ['Bạn ngồi cạnh {ai} tên là ~.', 'Lớp em có bạn mới tên là ~.'];

  var rand = function (a) { return a[Math.floor(Math.random() * a.length)]; };
  function fill(frame) {
    var s = frame.replace(/\{ai\}/g, function () { return rand(AI); })
      .replace(/\{nguoi\}/g, function () { return rand(NGUOI); })
      .replace(/\{so\}/g, function () { return rand(SO); });
    return s.charAt(0).toUpperCase() + s.slice(1);
  }
  function lower(s) { return s.toLocaleLowerCase('vi'); }
  // Chữ sai xuất hiện đúng một lần và đúng ở chỗ “~” (app.js thay chữ đầu tiên tìm thấy)
  function sentenceWith(frame, word) {
    for (var k = 0; k < 12; k++) {
      var s = fill(frame), p = s.indexOf('~'), c = s.replace('~', word);
      if (c.indexOf(word) === p && c.indexOf(word, p + 1) < 0) return c;
    }
    var s0 = frame.replace(/\{ai\}/g, 'em').replace(/\{nguoi\}/g, 'mẹ').replace(/\{so\}/g, 'hai');
    return (s0.charAt(0).toUpperCase() + s0.slice(1)).replace('~', word);
  }
  function chonItem(frame, blanked, dapAn, sai) {
    var o = { loai: 'chon', dapAn: dapAn, luaChon: [dapAn].concat(sai), sinh: true };
    Object.defineProperty(o, 'de', { enumerable: true, get: function () { return fill(frame).replace('~', blanked); } });
    return o;
  }
  function loiItem(frame, tuSai, tuDung) {
    var o = { loai: 'timLoi', tuSai: tuSai, tuDung: tuDung, sinh: true };
    Object.defineProperty(o, 'cau', { enumerable: true, get: function () { return sentenceWith(frame, tuSai); } });
    return o;
  }
  function fromBank(bank) {
    var out = [];
    bank.forEach(function (e) {
      var word = e[0], part = e[1], sai = e[2], frames = e[3].concat(KHUNG_BO_SUNG), at = word.indexOf(part);
      if (at < 0) return;
      var blanked = word.slice(0, at) + '___' + word.slice(at + part.length);
      frames.forEach(function (f) { out.push(chonItem(f, blanked, part, sai)); });
      if (e[4] !== '-') out.push(loiItem(frames[frames.length - 1], word.slice(0, at) + sai[0] + word.slice(at + part.length), word));
    });
    return out;
  }
  function capsVariants(name) { // “Đà Nẵng” → [“đà nẵng”, “Đà nẵng”]; “Huế” → [“huế”]
    var w = name.split(' '), v = [lower(name)];
    if (w.length > 1) v.push(w[0] + ' ' + w.slice(1).map(lower).join(' '));
    return v.filter(function (x, i, a) { return x !== name && a.indexOf(x) === i; });
  }
  function fromNames(names, frames) {
    var out = [];
    names.forEach(function (n, i) {
      var f = frames[i % frames.length];
      out.push(chonItem(f, '___', n, capsVariants(n)));
      out.push(loiName(frames[(i + 1) % frames.length], n));
    });
    return out;
  }
  // Tìm lỗi với tên riêng: chữ sai là TIẾNG CUỐI viết thường (“Đà nẵng” → chạm “nẵng”), để chạm được từng chữ
  function loiName(frame, name) {
    var w = name.split(' '), last = w[w.length - 1], wrongName = w.slice(0, -1).concat(lower(last)).join(' ');
    var o = { loai: 'timLoi', tuSai: lower(last), tuDung: last, sinh: true };
    Object.defineProperty(o, 'cau', { enumerable: true, get: function () {
      for (var k = 0; k < 12; k++) {
        var c = fill(frame).replace('~', wrongName), p = c.indexOf(wrongName) + wrongName.length - last.length;
        if (c.indexOf(o.tuSai) === p && c.indexOf(o.tuSai, p + 1) < 0) return c;
      }
      return ('Quê ngoại của em ở ~.').replace('~', wrongName);
    } });
    return o;
  }

  D.chuDe.forEach(function (t) {
    if (KHO[t.id]) t.sinh = fromBank(KHO[t.id]);
    else if (t.id === 'viet-hoa') t.sinh = fromNames(DIA_DANH, KHUNG_DIA_DANH).concat(fromNames(TEN_NGUOI, KHUNG_TEN));
  });

  /* Thêm đoạn nghe – viết mùa đông cho mỗi lớp (đoạn cố định, nhưng nhiều hơn để mỗi lần nghe một đoạn khác) */
  var DOAN_THEM = {
    1: ['Bé quàng khăn đỏ. Bé đi chơi với bà.', 'Cây thông có ngôi sao. Ngôi sao lấp lánh.'],
    2: ['Mùa đông, gió bấc thổi lạnh. Mẹ đan cho em chiếc khăn len màu đỏ.', 'Đêm Noel, cả nhà quây quần bên cây thông. Em treo chiếc chuông nhỏ lên cành.'],
    3: ['Sáng mùa đông, sương phủ trắng cánh đồng. Em mặc áo ấm, vui vẻ đến trường.', 'Cả lớp em cùng trang trí cây thông. Bạn treo ngôi sao, bạn quấn dây đèn nhấp nháy.'],
    4: ['Mùa đông về, những hàng cây trút lá. Gió lạnh luồn qua khe cửa, nhưng căn bếp nhỏ vẫn ấm áp tiếng cười.', 'Đêm Giáng sinh, phố phường rực rỡ ánh đèn. Tiếng chuông ngân vang, lũ trẻ háo hức chờ quà.'],
    5: ['Mùa đông trên vùng cao, sương mù giăng kín lối đi. Những mái nhà khói bếp bay lên, quyện vào màn sương trắng đục.', 'Đêm Giáng sinh, em ngồi bên cửa sổ, ngắm những ngôi sao lấp lánh. Em ước mọi bạn nhỏ trên khắp thế giới đều được ấm no, hạnh phúc.']
  };
  if (D.doanNgheViet) Object.keys(DOAN_THEM).forEach(function (g) {
    var list = D.doanNgheViet[g] || (D.doanNgheViet[g] = []);
    DOAN_THEM[g].forEach(function (p) { if (list.indexOf(p) < 0) list.push(p); });
  });

  window.SINH_CAU = { fill: fill, kho: KHO };
})();
