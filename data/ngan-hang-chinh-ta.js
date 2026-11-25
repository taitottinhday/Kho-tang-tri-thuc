/*
 * NGÂN HÀNG CHÍNH TẢ TIỂU HỌC (lớp 1–5) – soạn bởi Claude Code
 * Bám các dạng bài chính tả phân biệt trong SGK Tiếng Việt (CT GDPT 2018).
 * Dùng được khi mở file trực tiếp (file://): window.NGAN_HANG_CHINH_TA
 *
 * Mỗi chủ đề:
 *   id, ten, nhom, lop: [lớp nhỏ nhất, lớn nhất], bieuTuong (emoji), mau (hex)
 *   quyTac: các câu ngắn giải thích mẹo cho HS
 *   viDu: từ mẫu
 *   baiTap: danh sách câu hỏi, gồm 3 loại:
 *     { loai: "chon",     de: "câu có ___", luaChon: [...], dapAn: "...", giaiThich? }
 *     { loai: "timLoi",   cau: "câu có 1 từ viết sai", tuSai: "...", tuDung: "..." }
 *     { loai: "ngheViet", cau: "câu để đọc chính tả (đọc bằng giọng vi-VN)" }
 */
(function () {
  // Tiện ích: tạo câu "chọn" ngắn gọn. c("Sáng ___ chim hót.", "sớm", "xớm")
  // Đáp án đúng luôn là tham số thứ 2; thứ tự hiển thị do app trộn.
  function c(de, dung, ...sai) {
    return { loai: "chon", de: de, dapAn: dung, luaChon: [dung, ...sai] };
  }
  function loi(cau, tuSai, tuDung) {
    return { loai: "timLoi", cau: cau, tuSai: tuSai, tuDung: tuDung };
  }
  function nghe(cau) {
    return { loai: "ngheViet", cau: cau };
  }

  var chuDe = [
    /* ===================== PHỤ ÂM ĐẦU – CÓ QUY TẮC ===================== */
    {
      id: "c-k-q",
      ten: "c, k hay q?",
      nhom: "Phụ âm đầu",
      lop: [1, 2],
      bieuTuong: "🪁",
      mau: "#ff8a65",
      quyTac: [
        "Viết **k** khi đứng trước **i, e, ê**: kì, kẻ, kể.",
        "Viết **q** luôn đi cùng **u** thành **qu**: quả, quê.",
        "Các trường hợp còn lại viết **c**: cá, cổ, cụ."
      ],
      viDu: ["con kiến", "cái kéo", "quả cam", "con cá", "kể chuyện"],
      baiTap: [
        c("Con ___iến tha mồi.", "k", "c"),
        c("Bé ăn ___ẹo.", "k", "c"),
        c("Mẹ mua ___uả cam.", "q", "c", "k"),
        c("Con ___á bơi tung tăng.", "c", "k"),
        c("Ông ___ể chuyện cổ tích.", "k", "c"),
        c("Chú ___ông xòe đuôi.", "c", "k"),
        c("Bà sống ở ___uê.", "q", "c"),
        c("Cái ___éo rất sắc.", "k", "c"),
        c("Lá ___ờ bay phấp phới.", "c", "k"),
        c("Chiếc ___uạt quay vù vù.", "q", "c"),
        loi("Bố đeo cái cính đọc báo.", "cính", "kính"),
        loi("Con kua bò ngang.", "kua", "cua"),
        loi("Em ke vở thật thẳng.", "ke", "kẻ"),
        nghe("Bà kể chuyện cho cả nhà nghe."),
        nghe("Quê em có cây đa và con kênh nhỏ.")
      ]
    },
    {
      id: "g-gh",
      ten: "g hay gh?",
      nhom: "Phụ âm đầu",
      lop: [1, 2],
      bieuTuong: "🐔",
      mau: "#ffb74d",
      quyTac: [
        "Viết **gh** khi đứng trước **i, e, ê**: ghi, ghé, ghế.",
        "Các trường hợp còn lại viết **g**: gà, gỗ, gấu."
      ],
      viDu: ["con gà", "cái ghế", "ghi nhớ", "gỗ", "ghé thăm"],
      baiTap: [
        c("Con ___à trống gáy ò ó o.", "g", "gh"),
        c("Em ngồi trên ___ế.", "gh", "g"),
        c("Cô ___i điểm vào vở.", "gh", "g"),
        c("Bàn làm bằng ___ỗ.", "g", "gh"),
        c("Chú ___ấu ăn mật ong.", "g", "gh"),
        c("Bạn Lan ___é nhà bà.", "gh", "g"),
        c("Mẹ vo ___ạo nấu cơm.", "g", "gh"),
        c("Con ___ẹ có hai cái càng.", "gh", "g"),
        c("Em soi ___ương chải tóc.", "g", "gh"),
        loi("Em gi nhớ lời cô dặn.", "gi", "ghi"),
        loi("Bố mua cái ghấu bông.", "ghấu", "gấu"),
        loi("Cái gế này rất chắc.", "gế", "ghế"),
        nghe("Bé ghé thăm bà, bà cho bé gói quà."),
        nghe("Chú gà con kêu chiếp chiếp.")
      ]
    },
    {
      id: "ng-ngh",
      ten: "ng hay ngh?",
      nhom: "Phụ âm đầu",
      lop: [1, 2],
      bieuTuong: "🐴",
      mau: "#aed581",
      quyTac: [
        "Viết **ngh** khi đứng trước **i, e, ê**: nghỉ, nghe, nghề.",
        "Các trường hợp còn lại viết **ng**: ngủ, ngõ, ngựa."
      ],
      viDu: ["nghỉ ngơi", "con nghé", "ngõ nhỏ", "con ngựa", "nghề nghiệp"],
      baiTap: [
        c("Em ___e cô giảng bài.", "ngh", "ng"),
        c("Bé ___ủ ngon giấc.", "ng", "ngh"),
        c("Con ___é theo mẹ ra đồng.", "ngh", "ng"),
        c("Chú ___ựa phi nhanh.", "ng", "ngh"),
        c("Giờ ra chơi, em ___ỉ tay.", "ngh", "ng"),
        c("Nhà em ở cuối ___õ.", "ng", "ngh"),
        c("Bố em làm ___ề thợ mộc.", "ngh", "ng"),
        c("Trên trời có nhiều ___ôi sao.", "ng", "ngh"),
        c("Em suy ___ĩ rồi mới trả lời.", "ngh", "ng"),
        loi("Cả lớp ngồi ngiêm trang.", "ngiêm", "nghiêm"),
        loi("Em nghồi vào bàn học.", "nghồi", "ngồi"),
        loi("Mẹ ngỉ trưa một lát.", "ngỉ", "nghỉ"),
        nghe("Con nghé ngoan ngoãn theo mẹ."),
        nghe("Em lắng nghe tiếng chim hót ngoài ngõ.")
      ]
    },

    /* ===================== PHỤ ÂM ĐẦU – DỄ LẪN (phải nhớ từ) ===================== */
    {
      id: "s-x",
      ten: "s hay x?",
      nhom: "Phụ âm đầu",
      lop: [2, 5],
      bieuTuong: "🐿️",
      mau: "#4fc3f7",
      quyTac: [
        "s và x đọc gần giống nhau, cần **nhớ từ**.",
        "Mẹo: hai tiếng trong từ láy thường **cùng âm đầu**: **x**inh **x**ắn, **s**ạch **s**ẽ, **x**a **x**ôi, **s**áng **s**ủa.",
        "Đọc to, đặt từ vào câu để nhớ nghĩa: **xem** (nhìn) – **sem** (không có nghĩa)."
      ],
      viDu: ["sân trường", "xe đạp", "sạch sẽ", "xinh xắn", "con sóc"],
      baiTap: [
        c("Sáng ___, chim hót líu lo.", "sớm", "xớm"),
        c("Lớp em quét dọn ___ân trường.", "s", "x"),
        c("Em đi học bằng ___e đạp.", "x", "s"),
        c("Con ___óc nhảy trên cành.", "s", "x"),
        c("Búp bê thật ___inh xắn.", "x", "s"),
        c("Phòng học luôn ___ạch sẽ.", "s", "x"),
        c("Cả lớp ___ếp hàng ngay ngắn.", "x", "s"),
        c("Hồ ___en nở hoa thơm ngát.", "s", "x"),
        c("Lá cây màu ___anh.", "x", "s"),
        c("Mẹ nấu ___ôi gấc.", "x", "s"),
        loi("Chú chim xẻ đậu trên mái nhà.", "xẻ", "sẻ"),
        loi("Em cất xách vở vào cặp.", "xách", "sách"),
        loi("Cả nhà đi sem phim.", "sem", "xem"),
        nghe("Sáng sớm, sân trường sạch sẽ."),
        nghe("Chú sóc nhỏ xinh xắn nhảy trên cành.")
      ]
    },
    {
      id: "ch-tr",
      ten: "ch hay tr?",
      nhom: "Phụ âm đầu",
      lop: [2, 5],
      bieuTuong: "🌕",
      mau: "#ffd54f",
      quyTac: [
        "ch và tr dễ lẫn, cần **nhớ từ**.",
        "Từ láy hai tiếng thường **cùng âm đầu**: chăm chỉ, trong trẻo, chập chững.",
        "Từ chỉ đồ vật trong nhà thường là **ch**: chén, chổi, chăn, chiếu, chậu."
      ],
      viDu: ["trăng tròn", "chăm chỉ", "cây tre", "con trâu", "cái chổi"],
      baiTap: [
        c("Đêm rằm, ___ăng sáng vằng vặc.", "tr", "ch"),
        c("Bạn Nam rất ___ăm chỉ.", "ch", "tr"),
        c("Lũy ___e xanh rì rào.", "tr", "ch"),
        c("Con ___âu kéo cày.", "tr", "ch"),
        c("Em dùng cái ___ổi quét nhà.", "ch", "tr"),
        c("Tiếng ___ống trường vang lên.", "tr", "ch"),
        c("Giờ ra ___ơi thật vui.", "ch", "tr"),
        c("Mẹ trải ___iếu cho bé ngủ.", "ch", "tr"),
        c("Nước suối ___ong vắt.", "tr", "ch"),
        loi("Em chồng cây ở vườn trường.", "chồng", "trồng"),
        loi("Bé trơi đùa cùng các bạn.", "trơi", "chơi"),
        loi("Cột cờ đứng chước sân trường.", "chước", "trước"),
        nghe("Trăng tròn treo trên lũy tre làng."),
        nghe("Bạn Chi chăm chỉ tưới cây trong vườn trường.")
      ]
    },
    {
      id: "d-gi-r",
      ten: "d, gi hay r?",
      nhom: "Phụ âm đầu",
      lop: [2, 5],
      bieuTuong: "🐢",
      mau: "#81c784",
      quyTac: [
        "d, gi, r ở nhiều nơi đọc giống nhau – cần **nhớ từ** và **nghĩa**.",
        "Từ láy thường cùng âm đầu: **r**ộn **r**àng, **d**ịu **d**àng, **gi**ữ **gì**n.",
        "Đọc chậm, phát âm **r** rung lưỡi để phân biệt: con **r**ùa, **r**au."
      ],
      viDu: ["con rùa", "gia đình", "dịu dàng", "giữ gìn", "rực rỡ"],
      baiTap: [
        c("Con ___ùa bò chậm chạp.", "r", "d", "gi"),
        c("Em yêu ___a đình em.", "gi", "d", "r"),
        c("Cô giáo nói ___ịu dàng.", "d", "gi", "r"),
        c("Em ___ữ gìn sách vở cẩn thận.", "gi", "d", "r"),
        c("Hoa phượng nở ___ực rỡ.", "r", "d", "gi"),
        c("Mẹ nấu canh ___au muống.", "r", "d", "gi"),
        c("Cơn ___ó thổi mát rượi.", "gi", "d", "r"),
        c("Con thuyền xuôi ___òng sông.", "d", "gi", "r"),
        c("Bài này thật ___ễ dàng.", "d", "gi", "r"),
        loi("Ngày tết, phố phường dộn ràng.", "dộn", "rộn"),
        loi("Mẹ dạy em dữ gìn đồ dùng.", "dữ", "giữ"),
        loi("Bố mua một dỏ cam.", "dỏ", "giỏ"),
        nghe("Mẹ dịu dàng ru bé ngủ."),
        nghe("Em giữ gìn sách vở sạch sẽ, gọn gàng.")
      ]
    },
    {
      id: "l-n",
      ten: "l hay n?",
      nhom: "Phụ âm đầu",
      lop: [1, 5],
      bieuTuong: "🌿",
      mau: "#4db6ac",
      quyTac: [
        "Khi đọc **n**, đầu lưỡi chạm lợi trên, hơi đi ra **mũi**.",
        "Khi đọc **l**, hơi đi ra hai bên **lưỡi**.",
        "Từ láy: âm đầu **l** hay đi với **l**: long lanh, lấp lánh, lung linh. Láy âm có **n**: no nê, nết na."
      ],
      viDu: ["lá cây", "nước", "long lanh", "no nê", "nắng"],
      baiTap: [
        c("Trời ___ắng chang chang.", "n", "l"),
        c("Chiếc ___á vàng rơi.", "l", "n"),
        c("Em uống ___ước mát.", "n", "l"),
        c("Giọt sương ___ong lanh.", "l", "n"),
        c("Ăn cơm ___o nê.", "n", "l"),
        c("Đồng ___úa chín vàng.", "l", "n"),
        c("Mẹ nấu cơm bằng ___ồi điện.", "n", "l"),
        c("Ngôi sao ___ấp lánh.", "l", "n"),
        c("Bông hoa đang ___ở.", "n", "l"),
        loi("Bà ốm, em rất lo nắng.", "nắng", "lắng"),
        loi("Hoa hồng nở nộng lẫy.", "nộng", "lộng"),
        loi("Mùa hè trời lóng nực.", "lóng", "nóng"),
        nghe("Nắng sớm lấp lánh trên lá non."),
        nghe("Dòng nước trong veo, long lanh.")
      ]
    },

    /* ===================== VẦN DỄ LẪN ===================== */
    {
      id: "an-ang",
      ten: "an / ang – at / ac",
      nhom: "Vần",
      lop: [1, 3],
      bieuTuong: "🌳",
      mau: "#9575cd",
      quyTac: [
        "Vần **an, at**: khi đọc xong, đầu lưỡi chạm răng trên.",
        "Vần **ang, ac**: khi đọc xong, cuống lưỡi nâng lên, miệng vẫn mở.",
        "Đọc chậm từng tiếng và để ý miệng mình nhé!"
      ],
      viDu: ["bàn tay", "cây bàng", "bãi cát", "con hạc", "ca hát"],
      baiTap: [
        c("Bóng cây b___ mát rượi.", "àng", "àn"),
        c("Em rửa b___ tay sạch sẽ.", "àn", "àng"),
        c("Trẻ em chơi trên bãi c___.", "át", "ác"),
        c("Chú b___ sĩ khám bệnh.", "ác", "át"),
        c("Em thích ca h___.", "át", "ác"),
        c("Ngôi l___ yên bình.", "àng", "àn"),
        c("Mẹ xới cơm vào b___.", "át", "ác"),
        c("Hoa l___ thơm ngát.", "an", "ang"),
        c("Em nhặt r___ bỏ vào thùng.", "ác", "át"),
        loi("Em ngồi vào bàng học.", "bàng", "bàn"),
        loi("Trời nắng, em khác nước.", "khác", "khát"),
        nghe("Cây bàng trước sân trường xanh mát."),
        nghe("Các bạn hát vang trên bãi cát.")
      ]
    },
    {
      id: "uon-uong",
      ten: "uôn / uông – uôt / uôc",
      nhom: "Vần",
      lop: [2, 4],
      bieuTuong: "🔔",
      mau: "#f06292",
      quyTac: [
        "Vần **uôn, uôt**: kết thúc bằng n/t, đầu lưỡi chạm răng.",
        "Vần **uông, uôc**: kết thúc bằng ng/c, miệng mở.",
        "Nhớ cặp: chuông – chuột, luôn luôn – buộc dây."
      ],
      viDu: ["cái chuông", "con chuột", "luôn luôn", "buộc dây", "thuốc"],
      baiTap: [
        c("Tiếng ch___ reo vui.", "uông", "uôn"),
        c("Con ch___ nhắt.", "uột", "uộc"),
        c("Em l___ lễ phép.", "uôn", "uông"),
        c("Mẹ b___ tóc cho em.", "uộc", "uột"),
        c("Em ___ sữa mỗi sáng.", "uống", "uốn"),
        c("Bà ốm, mẹ mua th___ cho bà.", "uốc", "uốt"),
        c("Em đọc c___ sách hay.", "uốn", "uống"),
        c("Mẹ hái một b___ chuối chín.", "uồng", "uồn"),
        loi("Mèo bắt chuộc rất giỏi.", "chuộc", "chuột"),
        loi("Em luông giúp đỡ bạn bè.", "luông", "luôn"),
        nghe("Chú mèo luôn rình bắt chuột."),
        nghe("Tiếng chuông báo giờ vào lớp.")
      ]
    },
    {
      id: "uon-uong-2",
      ten: "ươn / ương – ươt / ươc",
      nhom: "Vần",
      lop: [2, 4],
      bieuTuong: "💧",
      mau: "#64b5f6",
      quyTac: [
        "**ươn, ươt** kết thúc bằng n/t; **ương, ươc** kết thúc bằng ng/c.",
        "Nhớ: vườn – sương, ướt – nước, lượt – bước."
      ],
      viDu: ["vườn rau", "giọt sương", "nước", "ướt", "bước đi"],
      baiTap: [
        c("Ông chăm sóc v___ rau.", "ườn", "ường"),
        c("Giọt s___ đọng trên lá.", "ương", "ươn"),
        c("Em uống n___ đun sôi.", "ước", "ướt"),
        c("Trời mưa, áo em bị ___.", "ướt", "ước"),
        c("Em b___ đi thật nhẹ nhàng.", "ước", "ướt"),
        c("Chú chim bay l___ trên trời.", "ượn", "ượng"),
        c("Em yêu tr___ em.", "ường", "ườn"),
        c("Em dùng th___ kẻ vở.", "ước", "ướt"),
        loi("Ông nội tưới cây ngoài vường.", "vường", "vườn"),
        loi("Đường trơn, bé bướt chậm thôi.", "bướt", "bước"),
        nghe("Sáng sớm, sương đọng trên vườn rau."),
        nghe("Em bước nhẹ trên con đường đến trường.")
      ]
    },
    {
      id: "ien-ieng",
      ten: "iên / iêng – iêt / iêc",
      nhom: "Vần",
      lop: [2, 4],
      bieuTuong: "🍂",
      mau: "#a1887f",
      quyTac: [
        "**iên, iêt** kết thúc bằng n/t; **iêng, iêc** kết thúc bằng ng/c.",
        "Nhớ: biển – tiếng, viết – chiếc."
      ],
      viDu: ["bờ biển", "tiếng hát", "siêng năng", "viết bài", "chiếc lá"],
      baiTap: [
        c("Em đi tắm b___.", "iển", "iểng"),
        c("T___ chim hót trong vườn.", "iếng", "iến"),
        c("Bạn Hoa rất s___ năng.", "iêng", "iên"),
        c("Em v___ bài cẩn thận.", "iết", "iếc"),
        c("Ch___ lá rơi nhẹ.", "iếc", "iết"),
        c("Cả nhà đi xem x___.", "iếc", "iết"),
        c("Em b___ đọc, biết viết.", "iết", "iếc"),
        c("Bà dùng nước g___.", "iếng", "iến"),
        loi("Mùa hè, em đi tắm biểng.", "biểng", "biển"),
        loi("Em viếc chữ thật đẹp.", "viếc", "viết"),
        nghe("Bạn Hoa siêng năng viết bài."),
        nghe("Tiếng sóng biển rì rào.")
      ]
    },

    {
      id: "ai-ay",
      ten: "ai hay ay?",
      nhom: "Vần",
      lop: [1, 2],
      bieuTuong: "✈️",
      mau: "#4dd0e1",
      quyTac: [
        "Vần **ai**: cái **tai**, con **nai**, **hai** bàn tay, trái cây.",
        "Vần **ay**: máy **bay**, bàn **tay**, **chạy** nhảy, ớt **cay**.",
        "Đọc chậm cả từ, nghĩ xem từ đó có nghĩa gì rồi mới chọn."
      ],
      viDu: ["máy bay", "cái tai", "con nai", "bàn tay", "đãi gạo"],
      baiTap: [
        c("Chiếc máy b___ bay qua bầu trời.", "ay", "ai"),
        c("Con n___ chạy trong rừng.", "ai", "ay"),
        c("Em rửa t___ trước khi ăn.", "ay", "ai"),
        c("Bé có h___ cái kẹo.", "ai", "ay"),
        c("Mẹ hái tr___ cây ngoài vườn.", "ái", "áy"),
        c("Quả ớt này c___ quá!", "ay", "ai"),
        c("Em ch___ thật nhanh về đích.", "ạy", "ại"),
        c("Ngày m___ là chủ nhật.", "ai", "ay"),
        c("Em giúp mẹ đ___ gạo nấu cơm.", "ãi", "ãy"),
        c("Hôm nay là ngày thứ b___.", "ảy", "ải"),
        loi("Em xếp sách vở ngai ngắn.", "ngai", "ngay"),
        loi("Đàn chim bai về tổ.", "bai", "bay"),
        loi("Con nay ăn cỏ non bên suối.", "nay", "nai"),
        nghe("Máy bay bay qua bầu trời xanh."),
        nghe("Hai bàn tay em thật sạch sẽ.")
      ]
    },
    {
      id: "ao-au",
      ten: "ao hay au?",
      nhom: "Vần",
      lop: [1, 2],
      bieuTuong: "🍎",
      mau: "#ef5350",
      quyTac: [
        "Vần **ao**: ngôi **sao**, quả **táo**, tờ **báo**, áo mới.",
        "Vần **au**: **rau** xanh, quả **cau**, đi **sau**, lau nhà.",
        "Đọc to cả từ rồi chọn cách viết đúng."
      ],
      viDu: ["ngôi sao", "quả táo", "rau muống", "quả cau", "chim chào mào"],
      baiTap: [
        c("Bầu trời đêm đầy ngôi s___.", "ao", "au"),
        c("Mẹ nấu canh r___ ngót.", "au", "ao"),
        c("Em ăn một quả t___ đỏ.", "áo", "áu"),
        c("Bà têm trầu với quả c___.", "au", "ao"),
        c("Em xếp hàng đứng s___ bạn Lan.", "au", "ao"),
        c("Bố đọc b___ mỗi sáng.", "áo", "áu"),
        c("Em giúp mẹ l___ nhà.", "au", "ao"),
        c("Chú chim ch___ mào hót hay.", "ào", "àu"),
        c("Hai bạn chơi với nh___ rất vui.", "au", "ao"),
        loi("Em trồng rao cải ngoài vườn.", "rao", "rau"),
        loi("Ông trèo lên cây hái quả cao.", "cao", "cau"),
        nghe("Đêm nay bầu trời đầy sao."),
        nghe("Mẹ hái rau ở vườn sau nhà.")
      ]
    },
    {
      id: "ui-uy",
      ten: "ui / uy – iu / ưu",
      nhom: "Vần",
      lop: [2, 3],
      bieuTuong: "🐑",
      mau: "#90a4ae",
      quyTac: [
        "Vần **ui**: ngọn **núi**, cái **túi**, **vui** vẻ · vần **uy**: **tuy**, cái **khuy** áo, **huy** hiệu.",
        "Vần **iu**: nhỏ **xíu**, **dịu** dàng · vần **ưu**: con **cừu**, **cứu** hộ, **bưu** điện.",
        "Ghép thử từng vần rồi đọc to: cách viết nào thành từ có nghĩa thì đúng."
      ],
      viDu: ["ngọn núi", "khuy áo", "con cừu", "bưu điện", "dịu dàng"],
      baiTap: [
        c("Ngọn n___ cao chót vót.", "úi", "úy"),
        c("Mẹ đơm lại cái kh___ áo cho em.", "uy", "ui"),
        c("Đàn c___ ăn cỏ trên đồi.", "ừu", "ìu"),
        c("Bố gửi thư ở b___ điện.", "ưu", "iu"),
        c("Em được tặng một chiếc h___ hiệu.", "uy", "ui"),
        c("Cô giáo nói giọng d___ dàng.", "ịu", "ựu"),
        c("Em xách t___ đồ giúp bà.", "úi", "úy"),
        c("Các chú c___ hộ giúp người bị nạn.", "ứu", "íu"),
        c("T___ trời mưa nhưng em vẫn đi học.", "uy", "ui"),
        c("Chú chim nhỏ x___ đậu trên cành.", "íu", "ứu"),
        loi("Con cìu đang gặm cỏ.", "cìu", "cừu"),
        loi("Bà để kẹo trong tuy áo.", "tuy", "túi"),
        nghe("Đàn cừu trắng ăn cỏ dưới chân núi."),
        nghe("Mẹ khâu lại chiếc khuy áo cho em.")
      ]
    },
    {
      id: "an-ang-2",
      ten: "ăn / ăng – ân / âng",
      nhom: "Vần",
      lop: [2, 4],
      bieuTuong: "🎋",
      mau: "#66bb6a",
      quyTac: [
        "Vần **ăn, ân** kết thúc bằng **n**: cái **khăn**, **chăn** ấm, **sân** trường, cái **cân**.",
        "Vần **ăng, âng** kết thúc bằng **ng**: vầng **trăng**, **măng** tre, **nâng** niu, **tầng** hai.",
        "Đọc xong, đầu lưỡi chạm răng trên là **n**; miệng vẫn mở là **ng**."
      ],
      viDu: ["cái khăn", "vầng trăng", "măng tre", "sân trường", "nâng niu"],
      baiTap: [
        c("Mẹ mua cho em chiếc kh___ quàng.", "ăn", "ăng"),
        c("V___ trăng tròn treo trên trời.", "ầng", "ần"),
        c("Bà luộc m___ tre rất ngon.", "ăng", "ăn"),
        c("Mẹ đặt rổ cam lên c___.", "ân", "âng"),
        c("Em n___ niu cuốn sách mới.", "âng", "ân"),
        c("Nhà em ở t___ ba.", "ầng", "ần"),
        c("Mẹ đắp ch___ ấm cho bé.", "ăn", "ăng"),
        c("Ánh n___ chiếu vào lớp học.", "ắng", "ắn"),
        c("Lớp em quét dọn s___ trường.", "ân", "âng"),
        loi("Mẹ đắp chăng cho em ngủ.", "chăng", "chăn"),
        loi("Em ngắm vần trăng sáng.", "vần", "vầng"),
        nghe("Vầng trăng sáng soi khắp sân nhà."),
        nghe("Mẹ quàng khăn ấm cho em đến trường.")
      ]
    },

    /* ===================== DẤU THANH ===================== */
    {
      id: "hoi-nga",
      ten: "Dấu hỏi hay dấu ngã?",
      nhom: "Dấu thanh",
      lop: [2, 5],
      bieuTuong: "❓",
      mau: "#ba68c8",
      quyTac: [
        "Mẹo từ láy: hai tiếng thường **cùng nhóm thanh**. Nhóm **huyền – ngã – nặng** đi với nhau; nhóm **ngang – sắc – hỏi** đi với nhau. Câu vần: “Chị Huyền mang **nặng ngã** đau, anh **Sắc**, anh **Hỏi**, **không** đâu cũng cười.”",
        "Trong **dễ dàng**, “dàng” mang thanh huyền, “dễ” mang dấu ngã. Trong **vui vẻ**, “vui” có thanh ngang, “vẻ” mang dấu hỏi.",
        "Mẹo chỉ đúng với **phần lớn** từ láy, các từ khác phải nhớ."
      ],
      viDu: ["dễ dàng", "mạnh mẽ", "sạch sẽ", "vui vẻ", "nhỏ nhắn"],
      baiTap: [
        c("Bài toán này thật ___ dàng.", "dễ", "dể"),
        c("Chú bộ đội trông thật mạnh ___.", "mẽ", "mẻ"),
        c("Phòng học sạch ___.", "sẽ", "sẻ"),
        c("Các bạn chơi vui ___.", "vẻ", "vẽ"),
        c("Bé ___ nhắn, xinh xắn.", "nhỏ", "nhõ"),
        c("Em nói rõ ___, mạch lạc.", "ràng", "rảng"),
        c("Em ___ tranh con mèo.", "vẽ", "vẻ"),
        c("Đám mây trôi ___ lờ trên bầu trời.", "lững", "lửng"),
        c("Em suy ___ rồi mới trả lời.", "ngẫm", "ngẩm"),
        c("Em làm bài thật ___ càng.", "kĩ", "kỉ"),
        loi("Mẹ dặn em đi đường phải cẩn thận, kỉ càng.", "kỉ", "kĩ"),
        loi("Ông em đã nghỉ hưu, ông vẻ tranh rất đẹp.", "vẻ", "vẽ"),
        loi("Các bạn chơi đùa vui vẽ.", "vẽ", "vẻ"),
        nghe("Bé vẽ một bức tranh thật vui vẻ."),
        nghe("Sân trường sạch sẽ, cây xanh mát mẻ.")
      ]
    },

    {
      id: "dau-thanh",
      ten: "Đặt dấu thanh đúng chỗ",
      nhom: "Dấu thanh",
      lop: [4, 5],
      bieuTuong: "✒️",
      mau: "#8d6e63",
      quyTac: [
        "Dấu thanh đặt ở **âm chính** của vần, không đặt ở âm đầu hay âm cuối.",
        "Vần có **ia, ua, ưa** (không có âm cuối): dấu đặt ở **chữ đầu**: m**í**a, m**ú**a, c**ử**a, s**ữ**a.",
        "Vần có **iê, uô, ươ** (có âm cuối): dấu đặt ở **chữ thứ hai**: ti**ế**ng, cu**ố**n, ng**ườ**i, đ**ườ**ng."
      ],
      viDu: ["cây mía", "múa hát", "cửa sổ", "tiếng chim", "con đường"],
      baiTap: [
        c("Bé thích ăn cây ___.", "mía", "miá"),
        c("Các bạn ___ hát mừng cô giáo.", "múa", "muá"),
        c("Em mở ___ sổ đón nắng.", "cửa", "cưả"),
        c("Em nghe ___ chim hót.", "tiếng", "tíêng"),
        c("Em đọc một ___ sách hay.", "cuốn", "cúôn"),
        c("Mọi ___ đều yêu quý em.", "người", "ngừơi"),
        c("Con ___ đến trường rợp bóng cây.", "đường", "đừơng"),
        c("Bé uống ___ mỗi sáng.", "sữa", "sưã"),
        c("Cả nhà quây quần bên ___ cơm.", "bữa", "bưã"),
        loi("Em ngồi bên cưả sổ ngắm mưa.", "cưả", "cửa"),
        loi("Bố mua cho em một cúôn truyện.", "cúôn", "cuốn"),
        loi("Bà kể chuyện bên bếp lưả hồng.", "lưả", "lửa"),
        nghe("Em ngồi bên cửa sổ nghe tiếng mưa rơi."),
        nghe("Mọi người cùng múa hát trên con đường làng.")
      ]
    },

    /* ===================== TỔNG HỢP (lớp 3–5) ===================== */
    {
      id: "tu-kho",
      ten: "Từ khó hay viết sai",
      nhom: "Tổng hợp",
      lop: [3, 5],
      bieuTuong: "🧠",
      mau: "#7986cb",
      quyTac: [
        "Nhiều từ khó cần **nhớ mặt chữ**: đọc to, viết ra giấy 2–3 lần.",
        "Hiểu **nghĩa** giúp chọn đúng: **trân trọng** (quý trọng) khác **chân thành** (thật lòng).",
        "**xuất sắc**, **chính xác** viết với **x**; **sẵn sàng**, **kiên nhẫn**, **ngỡ ngàng** mang **dấu ngã**."
      ],
      viDu: ["xuất sắc", "sẵn sàng", "trân trọng", "chân thành", "kiên nhẫn"],
      baiTap: [
        c("Em luôn ___ sàng giúp đỡ mọi người.", "sẵn", "sẳn"),
        c("Bạn Lan là học sinh ___ sắc.", "xuất", "suất"),
        c("Câu trả lời của em rất chính ___.", "xác", "sác"),
        c("Chú bộ đội rất dũng ___.", "cảm", "cãm"),
        c("Em biết ___ trọng thời gian.", "trân", "chân"),
        c("Em gửi lời cảm ơn ___ thành tới cô.", "chân", "trân"),
        c("Bà em ăn mặc rất giản ___.", "dị", "rị"),
        c("Đọc sách là việc làm ___ ích.", "bổ", "bỗ"),
        c("Em biết ___ dụng thời gian hợp lí.", "sử", "sữ"),
        c("Cả trường đứng ___ trang chào cờ.", "nghiêm", "ngiêm"),
        c("Ai cũng ___ ngàng trước cảnh đẹp.", "ngỡ", "ngở"),
        c("Em kiên ___ làm hết bài toán khó.", "nhẫn", "nhẩn"),
        loi("Bạn Hà là học sinh suất sắc của lớp.", "suất", "xuất"),
        loi("Em luôn sẳn sàng giúp đỡ bạn bè.", "sẳn", "sẵn"),
        loi("Bố dặn em phải biết chân trọng tình bạn.", "chân", "trân"),
        loi("Cô giáo khen em làm bài chính sác.", "sác", "xác"),
        nghe("Em luôn sẵn sàng giúp đỡ mọi người xung quanh."),
        nghe("Bạn Minh là học sinh xuất sắc, chăm chỉ và dũng cảm.")
      ]
    },

    /* ===================== VIẾT HOA ===================== */
    {
      id: "viet-hoa",
      ten: "Viết hoa đúng",
      nhom: "Viết hoa",
      lop: [1, 5],
      bieuTuong: "🔠",
      mau: "#e57373",
      quyTac: [
        "Viết hoa **chữ cái đầu câu**.",
        "Viết hoa **tên người**: Nguyễn Văn An (viết hoa chữ đầu mỗi tiếng).",
        "Viết hoa **tên địa danh**: Hà Nội, Thành phố Hồ Chí Minh, sông Hồng (viết hoa tên riêng, không hoa chữ “sông”)."
      ],
      viDu: ["Hà Nội", "Nguyễn Thị Lan", "sông Hồng", "Việt Nam"],
      baiTap: [
        c("Thủ đô của nước ta là ___.", "Hà Nội", "hà nội", "Hà nội"),
        c("Bạn thân của em tên là ___.", "Trần Minh Anh", "trần minh anh", "Trần minh Anh"),
        c("Em yêu đất nước ___.", "Việt Nam", "việt nam", "Việt nam"),
        c("Quê nội em ở bên ___.", "sông Hồng", "Sông hồng", "sông hồng"),
        c("Chọn câu viết đúng:", "Sáng nay, em đi học sớm.", "sáng nay, em đi học sớm.", "Sáng nay, Em đi học sớm."),
        c("Chọn câu viết đúng:", "Bạn Lan học lớp 2A.", "Bạn lan học lớp 2A.", "bạn Lan học lớp 2A."),
        loi("Em đã được đi thăm thành phố đà Nẵng.", "đà", "Đà"),
        loi("Hôm nay, cô giáo khen bạn hùng.", "hùng", "Hùng"),
        loi("chúng em chăm chỉ học tập.", "chúng", "Chúng"),
        nghe("Bạn Minh và bạn Lan cùng học ở Hà Nội."),
        nghe("Việt Nam có nhiều cảnh đẹp.")
      ]
    },
    {
      id: "viet-hoa-ngoai",
      ten: "Viết hoa tên nước ngoài",
      nhom: "Viết hoa",
      lop: [4, 5],
      bieuTuong: "🌍",
      mau: "#42a5f5",
      quyTac: [
        "Tên người, tên nơi chốn nước ngoài phiên âm: viết hoa **chữ cái đầu mỗi bộ phận**; giữa các tiếng trong một bộ phận có **gạch nối**: **Lu-i Pa-xtơ**, **Mát-xcơ-va**.",
        "Tên phiên âm theo âm Hán Việt thì viết như tên Việt Nam: **Bắc Kinh**, **Luân Đôn**."
      ],
      viDu: ["Mát-xcơ-va", "Pa-ri", "An-đéc-xen", "Bắc Kinh", "Luân Đôn"],
      baiTap: [
        c("Thủ đô của nước Pháp là ___.", "Pa-ri", "pa-ri", "Pa-Ri"),
        c("Thủ đô của nước Nga là ___.", "Mát-xcơ-va", "Mát xcơ va", "mát-xcơ-va"),
        c("Nhà văn ___ viết truyện “Nàng tiên cá”.", "An-đéc-xen", "an-đéc-xen", "An Đéc Xen"),
        c("Thủ đô của Trung Quốc là ___.", "Bắc Kinh", "Bắc-Kinh", "bắc kinh"),
        c("Thủ đô của nước Anh là ___.", "Luân Đôn", "Luân-Đôn", "luân đôn"),
        c("Nhà bác học ___ đã phát minh ra bóng đèn điện.", "Ê-đi-xơn", "ê-đi-xơn", "Ê Đi Xơn"),
        c("Nhà bác học ___ tìm ra cách chữa bệnh dại.", "Lu-i Pa-xtơ", "Lu-I Pa-Xtơ", "lu-i pa-xtơ"),
        loi("Bạn Nam đã đến thăm thành phố pa-ri.", "pa-ri", "Pa-ri"),
        loi("Cô kể chuyện về nhà bác học ê-đi-xơn.", "ê-đi-xơn", "Ê-đi-xơn")
      ]
    },
    {
      id: "viet-hoa-ten-rieng",
      ten: "Viết hoa tên tổ chức, danh hiệu",
      nhom: "Viết hoa",
      lop: [5, 5],
      bieuTuong: "🏅",
      mau: "#ffa726",
      quyTac: [
        "Tên cơ quan, tổ chức, giải thưởng, danh hiệu, huân chương: viết hoa **chữ cái đầu của mỗi bộ phận** tạo thành tên.",
        "Ví dụ: **Trường Tiểu học** Kim Đồng, **Bộ Giáo dục và Đào tạo**, **Huân chương Sao vàng**, **Anh hùng Lao động**."
      ],
      viDu: ["Trường Tiểu học Kim Đồng", "Bộ Giáo dục và Đào tạo", "Huân chương Sao vàng", "Anh hùng Lao động"],
      baiTap: [
        c("Em học ở ___.", "Trường Tiểu học Kim Đồng", "trường tiểu học Kim Đồng", "Trường Tiểu Học Kim Đồng"),
        c("Cơ quan phụ trách việc dạy và học của cả nước là ___.", "Bộ Giáo dục và Đào tạo", "bộ giáo dục và đào tạo", "Bộ Giáo Dục Và Đào Tạo"),
        c("Ông em được tặng ___.", "Huân chương Sao vàng", "huân chương sao vàng", "Huân Chương Sao Vàng"),
        c("Bác nông dân giỏi được phong danh hiệu ___.", "Anh hùng Lao động", "anh hùng lao động", "Anh Hùng Lao Động"),
        c("Tổ chức của nhiều nước trên thế giới là ___.", "Liên hợp quốc", "liên hợp quốc", "Liên Hợp Quốc"),
        c("Em là đội viên ___.", "Đội Thiếu niên Tiền phong Hồ Chí Minh", "đội thiếu niên tiền phong Hồ Chí Minh", "Đội Thiếu Niên Tiền Phong Hồ Chí Minh"),
        loi("Em học ở trường Tiểu học Kim Đồng.", "trường", "Trường"),
        loi("Mẹ em làm việc ở bộ Y tế.", "bộ", "Bộ")
      ]
    }
  ];

  // Bài nghe – viết tổng hợp theo lớp (đoạn ngắn, câu đơn giản)
  var doanNgheViet = {
    1: [
      "Bé đi học. Mẹ đưa bé đến trường.",
      "Con gà mái có bộ lông vàng óng.",
      "Quê bà có cây đa, giếng nước, sân đình."
    ],
    2: [
      "Mùa thu, lá vàng rơi đầy sân. Em nhặt chiếc lá đẹp nhất tặng cô.",
      "Chú gà trống gáy vang. Cả xóm thức dậy chào ngày mới.",
      "Em yêu trường em, có lũy tre xanh, có tiếng trống vui."
    ],
    3: [
      "Mỗi sáng, em dậy sớm tập thể dục. Ông mặt trời đỏ rực sau rặng tre.",
      "Dòng sông quê em hiền hòa. Hai bên bờ, ngô lúa xanh mướt.",
      "Giờ ra chơi, sân trường rộn rã tiếng cười của các bạn."
    ],
    4: [
      "Mùa xuân, cây gạo đầu làng nở hoa đỏ rực. Chim chóc kéo về ríu rít cả ngày.",
      "Những giọt sương sớm long lanh như hạt ngọc trên những chiếc lá non.",
      "Biển quê em mỗi sáng xanh ngắt, sóng vỗ rì rào vào bờ cát trắng."
    ],
    5: [
      "Trên sườn đồi, những nương chè xanh mướt trải dài. Sương sớm còn vương trên từng búp chè non.",
      "Đất nước Việt Nam có rừng vàng, biển bạc. Mỗi chúng ta cần giữ gìn và bảo vệ thiên nhiên.",
      "Chiều chiều, đàn cò trắng chao nghiêng trên cánh đồng lúa chín vàng ươm."
    ]
  };

  window.NGAN_HANG_CHINH_TA = { phienBan: "1.0", chuDe: chuDe, doanNgheViet: doanNgheViet };
})();
