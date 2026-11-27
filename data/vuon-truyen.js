/* Kịch bản gốc của Vườn truyện. Mỗi chốt có một đoạn ngắn và một đoạn dài. */
'use strict';
window.VUON_TRUYEN = [
  {
    id: 'seed', icon: '🌱', title: 'Hạt mầm biết đọc', subtitle: 'Theo tấm bản đồ tới thư viện bên suối.',
    relic: 'Hạt mầm Ánh Sáng',
    tale: {
      title: 'Tiếng gõ trong túi áo',
      pages: [
        {
          heading: 'Cốc! Cốc!',
          paragraphs: [
            'Vừa tới Cổng Lá, Thỏ Lá nghe “cốc, cốc” ngay trong túi áo. Thỏ lục túi. Chỉ có Hạt mầm Ánh Sáng.',
            'Sóc Nâu mở tấm bản đồ rồi kể chuyện mình đi lạc. Hạt mầm im bặt. Đến chỗ Sóc phải ngủ trong một chiếc ủng, nó lại gõ “cốc, cốc!”.'
          ]
        },
        {
          heading: 'Đến đoạn hay thì dừng',
          paragraphs: [
            'Bên suối, Rái Cá Bông nhỏ một giọt nước lên hạt mầm. Nó vẫn gõ. Bông bèn kể chuyện một con cá muốn leo cây. Tiếng gõ lại im.',
            'Khi Bông dừng để lấy hơi, hạt mầm lăn sát tới. Thỏ Lá bật cười. “Tớ biết cậu muốn gì rồi!”'
          ]
        },
        {
          heading: 'Cái lá biết nghe',
          paragraphs: [
            'Thỏ đặt hạt mầm cạnh cuốn sách của Cú Mực. Cả ba nghe bác đọc đến trang cuối. Vừa nghe chữ “hết”, hạt mầm nứt vỏ. Hai chiếc lá nhỏ xòe ra như đôi tai.',
            'Cú Mực khép sách. Từ trong chậu lại có tiếng “cốc, cốc”. Thỏ Lá mỉm cười, lật sang cuốn khác.'
          ]
        }
      ]
    },
    scenes: [
      {
        place: 'Cổng Lá', guide: 'Sóc Nâu', icon: '🐿️',
        line: 'Tấm bản đồ bị nhòe một chữ. Thỏ Lá sửa giúp tớ nhé!',
        praise: 'Đúng rồi! Bản đồ đã hiện đường tới bờ suối.',
        short: 'Lối qua cổng dẫn đến bờ xuối.',
        paragraph: 'Sóc Nâu mở tấm bản đồ. Lối qua cổng dẫn đến bờ xuối, ngay dưới tán cây lớn.',
        bad: 'xuối', good: 'suối', hint: 'Nhìn tiếng chỉ dòng nước. Tiếng này bắt đầu bằng chữ s.'
      },
      {
        place: 'Bậc đá bên suối', guide: 'Rái Cá Bông', icon: '🦦',
        line: 'Em xem tấm biển trên bờ đi. Sửa đúng rồi mình qua cùng nhau.',
        praise: 'Chuẩn rồi! Tớ đã chỉ những bậc đá khô để em qua an toàn.',
        short: 'Đá bên bờ suối rất chơn.',
        paragraph: 'Nước chảy qua những bậc đá. Đá bên bờ suối rất chơn, nên Thỏ Lá bước chậm.',
        bad: 'chơn', good: 'trơn', hint: 'Tiếng chỉ bề mặt dễ trượt bắt đầu bằng tr, như trong tiếng trượt.'
      },
      {
        place: 'Thư viện cây già', guide: 'Cú Mực', icon: '🦉',
        line: 'Hạt mầm chỉ nảy khi em sửa đúng mẩu giấy của bác.',
        praise: 'Đúng lắm! Hạt mầm đã thức dậy. Em mang một hạt theo nhé.',
        short: 'Hạt mầm tỏa xáng trên bàn.',
        paragraph: 'Cú Mực đưa Thỏ Lá vào thư viện. Hạt mầm tỏa xáng trên chiếc bàn gỗ.',
        bad: 'xáng', good: 'sáng', hint: 'Tiếng chỉ ánh đèn và ánh nắng ở đây bắt đầu bằng chữ s.'
      }
    ]
  },
  {
    id: 'cloud', icon: '🚂', title: 'Chuyến tàu mây', subtitle: 'Mang hạt mầm qua cây cầu bảy sắc.',
    relic: 'Vé Tàu Mây',
    tale: {
      title: 'Hành khách không mang ô',
      pages: [
        {
          heading: 'Chiếc vé ướt',
          paragraphs: [
            'Thỏ Lá giơ Vé Tàu Mây lên. “Tu tu!” Tàu ghé ga, mang theo một hành khách tròn xoe. Đó là Mây Con. Bạn làm ướt cả chiếc ghế.',
            'Sẻ Mây hỏi: “Bạn muốn xuống ga nào?” Mây Con cúi đầu. “Tớ muốn tưới cây. Nhưng trên này chỉ có mây.”'
          ]
        },
        {
          heading: 'Một cây cầu dẫn xuống thấp',
          paragraphs: [
            'Tới cầu bảy sắc, Thỏ Lá thấy Rùa Gió đang nhìn xuống khu rừng. Dưới kia, một luống hoa cúi đầu vì khát.',
            'Rùa chỉ tay: “Đường ray màu xanh có một nhánh xuống tận gốc cây.” Thỏ chạy báo Cáo Ga. Bác kéo cần, đường ray kêu “cạch” rồi đổi hướng.'
          ]
        },
        {
          heading: 'Cơn mưa đúng chỗ',
          paragraphs: [
            'Tàu dừng trên luống hoa. Mây Con mở cửa, rắc xuống một cơn mưa nhỏ. Từng bông hoa ngẩng đầu, đón những giọt nước mát.',
            'Lúc về ga, Cáo Ga dán lên ghế một tấm biển: “Dành cho mây.” Bác lót thêm một chiếc khăn. “Lần sau, chúng ta ghé cả vườn rau nhé!”'
          ]
        }
      ]
    },
    scenes: [
      {
        place: 'Ga Gió', guide: 'Sẻ Mây', icon: '🐦',
        line: 'Tàu sắp chạy, nhưng bảng giờ có một chữ sai. Em giúp tớ tìm với!',
        praise: 'Em tìm đúng rồi! Lên toa, tàu mình sắp khởi hành.',
        short: 'Một truyến tàu sắp rời ga.',
        paragraph: 'Gió thổi qua nhà ga. Một truyến tàu sắp rời ga để đưa hạt mầm lên đỉnh núi.',
        bad: 'truyến', good: 'chuyến', hint: 'Tiếng chỉ một lượt đi của tàu bắt đầu bằng ch.'
      },
      {
        place: 'Cầu bảy sắc', guide: 'Rùa Gió', icon: '🐢',
        line: 'Tàu phải qua đúng chiếc cầu. Em sửa tên cầu trên tấm biển nhé.',
        praise: 'Giỏi quá! Bảy màu đã nối liền hai bờ mây.',
        short: 'Tàu đi qua cầu vòng.',
        paragraph: 'Sau cơn mưa, bảy màu hiện trên trời. Tàu đi qua cầu vòng để sang bờ mây bên kia.',
        bad: 'vòng', good: 'vồng', hint: 'Tên dải bảy màu trên trời có tiếng cuối viết với ô, không phải o.'
      },
      {
        place: 'Bến Trên Mây', guide: 'Cáo Ga', icon: '🦊',
        line: 'Em đọc thử lời dặn in trên vé. Có một tiếng chưa đúng.',
        praise: 'Chính xác! Vé này sẽ đưa em về khu rừng khi cần.',
        short: 'Em hãy dữ vé đến cuối hành trình.',
        paragraph: 'Tàu đến bến. Cáo Ga trao vé và dặn: Em hãy dữ vé đến cuối hành trình nhé.',
        bad: 'dữ', good: 'giữ', hint: 'Tiếng có nghĩa là cất cho khỏi mất bắt đầu bằng gi.'
      }
    ]
  },
  {
    id: 'lantern', icon: '🏮', title: 'Đêm hội đom đóm', subtitle: 'Mang ánh sáng tới lễ hội trong rừng.',
    relic: 'Đèn Đom Đóm',
    tale: {
      title: 'Ngôi sao của Cá Bé',
      pages: [
        {
          heading: 'Ánh đèn dưới nước',
          paragraphs: [
            'Đom Đóm Đèn rủ Thỏ Lá ra hồ xem sao. Cá Bé nhô lên khỏi mặt nước, nhìn chiếc đèn trên tay Thỏ rồi gọi: “Tớ có một ngôi sao! Nó vừa trốn dưới bụng tớ!”',
            'Thỏ cúi xuống. Cá Bé quẫy đuôi. Đốm sáng dưới nước vỡ thành những mảnh vàng.'
          ]
        },
        {
          heading: 'Mượn một chiếc đèn',
          paragraphs: [
            'Nhím Kim mang tới một chiếc đèn giấy hình sao. Bạn vừa nhấc đèn lên, một ngôi sao khác cũng nhích lên dưới mặt hồ.',
            'Cá Bé bơi theo rồi ngơ ngác: “Sao của tớ biết bắt chước!” Nhím Kim nghiêng đèn sang trái. Ngôi sao dưới hồ cũng nghiêng sang trái.'
          ]
        },
        {
          heading: 'Hai bầu trời',
          paragraphs: [
            'Nai Sao bảo cả nhóm ngồi yên. Khi mặt hồ phẳng lặng, Cá Bé ngước lên. Trên trời có sao. Dưới nước cũng có sao.',
            'Thỏ Lá định xách đèn về thì nghe Cá Bé gọi: “Mai cậu kể cho tớ nghe chuyện trên bờ nhé! Tớ sẽ kể chuyện dưới hồ.” Thỏ đặt chiếc đèn xuống. Hai bạn còn nhiều chuyện để kể.'
          ]
        }
      ]
    },
    scenes: [
      {
        place: 'Đường đom đóm', guide: 'Đom Đóm Đèn', icon: '✨',
        line: 'Tớ soi biển chỉ đường cho em. Em tìm chữ viết sai trên biển nhé.',
        praise: 'Đúng rồi! Đi theo ánh đèn của tớ để vào rừng nhé.',
        short: 'Con đường nhỏ đi xuyên qua dừng.',
        paragraph: 'Đom Đóm Đèn bay lên và soi tấm biển. Con đường nhỏ đi xuyên qua dừng để đến đêm hội.',
        bad: 'dừng', good: 'rừng', hint: 'Tiếng chỉ nơi có rất nhiều cây mọc gần nhau bắt đầu bằng r.'
      },
      {
        place: 'Vòm đèn giấy', guide: 'Nhím Kim', icon: '🦔',
        line: 'Mình treo đèn theo lời dặn này nhé. Em sửa chữ sai trước đã.',
        praise: 'Đúng rồi! Vòm đèn sáng lên để chỉ lối vào đêm hội.',
        short: 'Nhím Kim treo đèn trên cành che.',
        paragraph: 'Nhím Kim mang chiếc đèn giấy đến vòm cây. Bạn treo đèn trên cành che rồi đợi các bạn.',
        bad: 'che', good: 'tre', hint: 'Tiếng chỉ cây có thân nhiều đốt bắt đầu bằng tr.'
      },
      {
        place: 'Bãi hội dưới trăng', guide: 'Nai Sao', icon: '🦌',
        line: 'Còn một lời mời cuối cùng. Em sửa đúng để cả rừng vào hội nhé!',
        praise: 'Hay lắm! Ba món đồ vừa sáng lên. Có một lối mới phía sau hồ!',
        short: 'Ba bạn cùng dùng một chiếc khay trung.',
        paragraph: 'Nai Sao mang đèn ra bờ hồ. Ba bạn đặt đèn lên một chiếc khay trung rồi cùng ngắm trời sao.',
        bad: 'trung', good: 'chung', hint: 'Tiếng chỉ thứ nhiều người cùng sử dụng bắt đầu bằng ch.'
      }
    ]
  }
];

/* Chương mới có ba chốt, mỗi tranh dùng lại ở trang truyện tương ứng. */
function storyChapter(id, icon, title, subtitle, relic, point, taleTitle, entries) {
  return {
    id, icon, title, subtitle, relic, point,
    scenes: entries.map(([scene]) => scene),
    tale: { title: taleTitle, pages: entries.map(([, heading, ...paragraphs]) => ({ heading, paragraphs })) }
  };
}

window.STORY_ROUTES = [
  {
    id: 'rabbit', name: 'Thỏ Lá', title: 'Dấu chân trong rừng', destination: 'Khu Rừng Bí Mật',
    description: 'Qua thư viện cây già, đi tàu mây và thắp đèn trong đêm hội.',
    map: 'secret', cover: 'seed-1', mapAlt: 'Khu rừng với mầm vàng, tàu mây và hồ đom đóm',
    stride: 'assets/chase-rabbit-stride.webp', skin: 'rabbit', back: 'Về khu rừng',
    chapters: window.VUON_TRUYEN.map((chapter, index) => ({ ...chapter, point: [[11,44], [64,38], [88,32]][index] }))
  },
  {
    id: 'football', name: 'Cầu thủ', title: 'Trận bóng ở Đảo Gió', destination: 'Đảo Gió Bí Mật',
    description: 'Thắp hải đăng, thả diều và vượt hậu vệ để ghi bàn ở trận bóng bên biển.',
    map: 'island-map', cover: 'island-lens-1', mapAlt: 'Bản đồ đảo có hải đăng, đồi diều và sân bóng',
    stride: 'assets/quest/footballer-stride.webp', skin: 'football', back: 'Về Đảo Gió',
    chapters: [
      storyChapter('island-lens', '🐚', 'Ngọn đèn ngoài khơi', 'Đưa một thấu kính lên ngọn hải đăng.', 'Ốc biển phát sáng', [19,25], 'Ai bật đèn cho sóng?', [
        [{
          place: 'Bến thuyền', guide: 'Lan Áo Vàng', icon: '🛟',
          line: 'Tớ nhặt được chiếc ốc này cạnh một mẩu giấy ướt. Em đọc giúp tớ nhé!',
          praise: 'Đúng rồi! Mẩu giấy chỉ đường lên ngọn hải đăng.',
          short: 'Chiếc thuyền đậu gần bải cát.', paragraph: 'Lan gọi Minh ra bờ nước. Chiếc thuyền đậu gần bải cát.',
          bad: 'bải', good: 'bãi', hint: 'Nơi rộng có nhiều cát gọi là bãi cát. Tiếng bãi viết dấu ngã.'
        }, 'Tiếng rì rào trong vỏ ốc',
        'Minh đang chuyền bóng ở bến thì Lan chạy tới, cầm một chiếc ốc trắng. Lan bảo: “Áp vào tai đi, cậu nghe được cả biển đấy!”',
        'Minh áp tai vào vỏ ốc. Giữa tiếng rì rào, cậu nghe một hồi còi. Thuyền của mẹ Lan đang về, còn ngọn đèn trên đảo vẫn tối.'],
        [{
          place: 'Cầu thang xoắn', guide: 'An', icon: '🧤',
          line: 'Hai đứa mình khiêng kính lên. Em kiểm tra lời dặn trước khi bước nhé!',
          praise: 'Giỏi lắm! Mình cùng nâng kính qua khúc cua này.',
          short: 'Hai bạn đi lên cầu thang xoắng.', paragraph: 'An và Minh ôm chiếc kính bằng cả hai tay. Hai bạn đi lên cầu thang xoắng.',
          bad: 'xoắng', good: 'xoắn', hint: 'Cầu thang cuộn theo vòng tròn gọi là cầu thang xoắn, kết thúc bằng n.'
        }, 'Một bậc cho mỗi người',
        'Lan tìm được tấm kính dưới chân cầu thang. Nó nặng hơn cả quả bóng. Minh nhấc một đầu, An đỡ đầu kia. Hai bạn đếm từng bậc để cùng bước.',
        'Đến khúc cua, An gọi Lan đem chiếc ốc lên cùng. Qua ô cửa nhỏ, Minh thấy một chiếc thuyền đang đợi ngoài vịnh.'],
        [{
          place: 'Ban công hải đăng', guide: 'Bà giữ đèn', icon: '🔦',
          line: 'Em sửa giúp bà tấm thẻ bên công tắc. Xong rồi ta bật đèn.',
          praise: 'Đèn sáng rồi! Tàu ngoài vịnh đã nhìn thấy lối về.',
          short: 'Ngọn đèn đưa tàu về bếnh.', paragraph: 'Bà đặt kính vào đúng rãnh và bật công tắc. Ngọn đèn đưa tàu về bếnh.',
          bad: 'bếnh', good: 'bến', hint: 'Nơi tàu cập vào gọi là bến, kết thúc bằng n.'
        }, 'Lối về qua vịnh',
        'Bà giữ đèn lắp tấm kính rồi gật đầu cho Minh bật công tắc. Một vệt sáng quay vòng trên mặt vịnh. Chiếc tàu đáp lại bằng hai hồi còi.',
        'Lan reo lên: “Bây giờ đến lượt biển nghe mình!” Cô bé giơ chiếc ốc ra phía cửa sổ. Minh cười, nghe cả gió và tiếng sóng trong đó.']
      ]),
      storyChapter('island-kite', '🪁', 'Chiếc diều biết nhường', 'Gỡ sợi dây mắc trên đồi.', 'Dải đuôi diều đỏ', [55,35], 'Ba ngón tay giữ gió', [
        [{
          place: 'Xưởng diều giấy', guide: 'Cô Hạnh', icon: '🧵',
          line: 'Em giúp cô tìm tiếng sai trên lời dặn khi làm đuôi diều.',
          praise: 'Đúng rồi! Cô gửi em dải vải đỏ để buộc vào đuôi.',
          short: 'Cô cắt một dãi vải đỏ.', paragraph: 'Cô Hạnh đo vải để làm đuôi diều. Cô cắt một dãi vải đỏ.',
          bad: 'dãi', good: 'dải', hint: 'Một miếng vải dài, hẹp gọi là dải vải, viết dấu hỏi.'
        }, 'Đuôi diều xin thêm một màu',
        'Trong xưởng có diều cá, diều én và một chiếc diều trắng chưa có đuôi. Cô Hạnh hỏi Minh muốn cho nó màu gì.',
        'Minh xin một dải đỏ như màu trời lúc chiều. Lan chọn thêm hai dải nhỏ màu xanh. “Để ai nhìn lên cũng thấy màu của biển,” Lan nói.'],
        [{
          place: 'Đồi cỏ nhiều gió', guide: 'An', icon: '🌾',
          line: 'Dây diều mắc rồi. Em sửa lời nhắc này giúp tớ.',
          praise: 'Em nói đúng. Một bạn giữ cuộn dây, một bạn gỡ nút nhé!',
          short: 'Dây diều mắc vào bụi cõ.', paragraph: 'Gió đổi hướng và kéo chiếc diều xuống thấp. Dây diều mắc vào bụi cõ.',
          bad: 'cõ', good: 'cỏ', hint: 'Cây thấp mọc thành thảm dưới chân là cỏ, viết dấu hỏi.'
        }, 'Nút thắt trên đồi',
        'Một cơn gió mạnh kéo diều chúi xuống bụi cây. Minh giật dây nhưng nút càng chặt. An bảo Minh thả lỏng tay để mình gỡ.',
        'Lan chạy vòng xuống dốc giữ chiếc diều khỏi chạm đất. Lần này mỗi người chỉ kéo theo một hướng. Nút thắt bỗng lỏng ra.'],
        [{
          place: 'Mỏm đá nhìn ra vịnh', guide: 'Lan Áo Vàng', icon: '🌬️',
          line: 'Gió đang lên! Sửa xong, em giúp tớ thả diều nhé.',
          praise: 'Diều lên rồi! Nhìn xem, chiếc đuôi đỏ đang vẫy trong gió.',
          short: 'Gió thổi qua vách đá cao vứt.', paragraph: 'Lan tung diều theo chiều gió. Gió thổi qua vách đá cao vứt.',
          bad: 'vứt', good: 'vút', hint: 'Để tả chiều cao vươn lên, viết cao vút với u.'
        }, 'Một lượt cho mỗi bạn',
        'Lần này, Lan đợi gió vừa đủ rồi mới thả. Chiếc diều vọt lên. Đuôi diều xòe như một con cá đang bơi trong trời xanh.',
        'Minh giữ dây một lúc rồi nhường cho An. An giữ xong lại nhường cho Lan. Trên đồi có ba người giữ dây, nhưng chỉ cần ba ngón tay của một người là đủ.']
      ]),
      storyChapter('island-match', '⚽', 'Trận bóng bên vịnh', 'Chuyền bóng qua sân sau mưa.', 'Huy hiệu Đảo Gió', [81,61], 'Bàn thắng của cả sân', [
        [{
          place: 'Cổng sân bóng', guide: 'Thủ môn Tùng', icon: '🥅',
          line: 'Trận đấu sắp bắt đầu. Em sửa tấm bảng trước cổng giúp tớ nhé!',
          praise: 'Đúng rồi! Hai đội tập trung ở giữa sân nào.',
          short: 'Hai đội đứng trước khung thàn.', paragraph: 'Tùng mang găng tay mới ra sân. Hai đội đứng trước khung thàn.',
          bad: 'thàn', good: 'thành', hint: 'Khung để ghi bàn gọi là khung thành, kết thúc bằng nh.'
        }, 'Khung thành hướng ra biển',
        'Tùng đeo đôi găng màu cam đến sân sớm. Cậu đứng trước khung thành rồi hét chào Minh qua cả khoảng sân.',
        'Đêm qua mưa lớn. Dọc vạch trắng còn một vũng nước. Tùng nói: “Sân có thêm một cái hồ. Đội nào đi vòng khéo hơn thì vào được tới gôn!”'],
        [{
          place: 'Vạch giữa sân', guide: 'Đội trưởng Vy', icon: '👟',
          line: 'Đường thẳng còn nước. Đọc đường bóng tớ vẽ rồi tìm lỗi nhé!',
          praise: 'Đúng rồi! Chuyền qua bên phải để bóng đi trên cỏ khô.',
          short: 'Vy truyền bóng sang phải.', paragraph: 'Trước mặt hai bạn còn một vũng nước. Vy truyền bóng sang phải cho Minh.',
          bad: 'truyền', good: 'chuyền', hint: 'Đưa bóng cho bạn trong trận đấu là chuyền bóng, bắt đầu bằng ch.'
        }, 'Đường vòng qua vũng nước',
        'Vy lách sang phải, kéo theo một hậu vệ. Minh định sút ngay thì thấy một bạn nhỏ đang đứng trống ở cánh trái.',
        'Minh chuyền nhẹ. Bóng lăn qua phần cỏ khô rồi tới chân bạn. Vy reo: “Còn một đường chuyền nữa là tới gôn!”'],
        [{
          place: 'Góc sân treo cờ', guide: 'Đội trưởng Vy', icon: '🚩',
          line: 'Chỉ còn một hậu vệ trước gôn. Sửa chữ cuối để Minh có cơ hội dứt điểm!',
          praise: 'Đúng rồi! Minh vượt hậu vệ rồi lấy đà sút bóng.',
          short: 'Các bạn sẽ reo mừn.', paragraph: 'Minh đưa bóng đến gần khung thành. Nếu Minh ghi bàn, các bạn sẽ reo mừn.',
          bad: 'mừn', good: 'mừng', hint: 'Khi rất vui, ta reo mừng. Tiếng mừng có âm cuối ng.'
        }, 'Bàn thắng vang ra phía vịnh',
        'Minh nghiêng vai sang một phía, chạm bóng sang phía còn lại rồi sút vào góc gôn. Lưới rung lên. Tùng bật cười: “Tớ mải nhìn vai cậu nên chậm một nhịp!”',
        'Cuối buổi, Minh không xin giữ quả bóng. Cậu đặt nó giữa sân. Bọn trẻ vừa tới bến đã xắn tay áo, chuẩn bị chia đội chơi tiếp.']
      ])
    ]
  },
  {
    id: 'royal', name: 'Nhà vua', title: 'Chuyến đi của Nhà vua', destination: 'Vương Quốc Sao',
    description: 'Vượt quân Bóng Tối, mở Cổng Sao và đưa Công chúa Mai về an toàn.',
    map: 'palace-map', cover: 'royal-bell-1', mapAlt: 'Bản đồ vương quốc có lầu chuông, vườn đèn và đài quan sát',
    stride: 'assets/quest/king-stride.webp', skin: 'royal', back: 'Về Vương Quốc Sao',
    chapters: [
      storyChapter('royal-bell', '🔔', 'Tiếng chuông bên sông', 'Giúp người giữ chuông gọi thuyền về bến.', 'Chuông Đồng', [18,54], 'Tiếng chuông đi được bao xa?', [
        [{
          place: 'Lầu chuông gỗ', guide: 'Lính gác Bình', icon: '🛡️',
          line: 'Tờ lịch gác có một chữ chưa đúng. Xin em sửa để mở cửa.',
          praise: 'Đúng rồi! Mời vào lầu chuông.',
          short: 'Chuông reo lúc bình mih.', paragraph: 'Bình mở cửa lầu chuông. Chuông reo lúc bình mih để gọi thuyền về.',
          bad: 'mih', good: 'minh', hint: 'Lúc trời vừa sáng gọi là bình minh. Tiếng minh kết thúc bằng nh.'
        }, 'Một buổi sáng không tiếng chuông',
        'Nhà vua cưỡi ngựa đến lầu chuông. Bình đứng gác đã lâu mà chẳng nghe gì. Ngoài sông, mấy người chèo thuyền vẫn đợi tín hiệu.',
        'Bình chỉ lên xà gỗ: “Dây còn đây. Cháu kéo mãi, chuông chỉ kêu cộc một tiếng.” Nhà vua xuống ngựa rồi cùng Bình leo lên xem.'],
        [{
          place: 'Gian sửa chuông', guide: 'Bà thợ mộc', icon: '🔨',
          line: 'Em sửa chữ trên nhãn rồi giúp bà lấy đúng chiếc búa.',
          praise: 'Đúng rồi! Ta thay đầu búa đã nứt bằng đầu gỗ mới.',
          short: 'Bà làm đầu búa bằng gổ.', paragraph: 'Mưa làm đầu búa cũ bị nứt. Bà làm đầu búa mới bằng gổ.',
          bad: 'gổ', good: 'gỗ', hint: 'Vật liệu lấy từ thân cây là gỗ, viết dấu ngã.'
        }, 'Chiếc búa mới của bà',
        'Bà thợ mộc vỗ nhẹ đầu búa. Nó đã nứt từ mùa mưa. Bà lấy một khúc gỗ khô, gọt tròn rồi buộc lại đúng chỗ.',
        'Nhà vua giữ thang cho bà. Bình kéo thử sợi dây. Tiếng chuông ngân lên, dài tới mức ba người kịp nhìn nhau rồi cùng cười.'],
        [{
          place: 'Bến sông', guide: 'Người lái đò', icon: '🛶',
          line: 'Em sửa lời nhắn này để ta đáp lại tiếng chuông.',
          praise: 'Hay lắm! Thuyền đã vào bến. Em mang theo chiếc chuông nhỏ này nhé.',
          short: 'Con thuyền nhẹ nhàng cặp bến sông.', paragraph: 'Người lái đò nghe tiếng chuông liền đổi hướng. Con thuyền nhẹ nhàng cặp bến.',
          bad: 'cặp', good: 'cập', hint: 'Thuyền ghé sát để dừng gọi là cập bến, viết bằng â và dấu nặng.'
        }, 'Tiếng chuông đi theo dòng nước',
        'Ở khúc sông xa, người lái đò ngẩng đầu khi nghe tiếng chuông. Ông nối hai nhịp chèo, đưa thuyền vào dưới bóng cây.',
        'Bình cứ tưởng tiếng chuông chỉ vang trong sân. Bây giờ cậu đứng trên bờ nghe tiếng hô từ thuyền vọng lại. Cậu vẫy tay, dù người ta đứng xa đến mức chỉ còn thấy chiếc nón.']
      ]),
      storyChapter('royal-lantern', '🏮', 'Vườn đèn ngủ muộn', 'Giữ cho chiếc đèn giấy sáng qua cơn mưa.', 'Đèn Giấy Cung Đình', [51,45], 'Chiếc đèn chờ mặt hồ', [
        [{
          place: 'Sân gấp đèn', guide: 'Công chúa Mai', icon: '👑',
          line: 'Cha giúp con gấp đèn. Em xem lời dặn viết trên mẫu nhé!',
          praise: 'Đúng rồi! Cứ miết nhẹ nếp giấy là thành một cánh hoa.',
          short: 'Mai khéo léo gấc một cánh hoa.', paragraph: 'Mai đặt tờ giấy đỏ lên bàn rồi gấc một cánh hoa.',
          bad: 'gấc', good: 'gấp', hint: 'Bẻ tờ giấy tạo thành nếp là gấp, có âm cuối p.'
        }, 'Bông hoa bằng giấy',
        'Mai muốn làm một chiếc đèn giống hoa sen. Nhà vua gấp cánh thứ nhất, nhưng cánh còn lại cứ bật ra.',
        'Mai giữ giúp nếp giấy, để cha dùng hai tay miết xuống. Hai người gấp xong vừa lúc hạt mưa đầu tiên rơi vào sân.'],
        [{
          place: 'Mái hiên tre', guide: 'Bác làm vườn', icon: '🎋',
          line: 'Đưa đèn vào đây kẻo ướt. Em sửa lời nhắc trên tấm thẻ này nhé!',
          praise: 'Đúng rồi! Mái hiên che mưa cho cả chiếc đèn và chúng mình.',
          short: 'Mái hiên tre che cơn mưa rao.', paragraph: 'Bác làm vườn gọi mọi người vào trú. Mái hiên tre che cơn mưa rao.',
          bad: 'rao', good: 'rào', hint: 'Tên cơn mưa bất chợt thường gọi là mưa rào, viết dấu huyền.'
        }, 'Đợi tiếng mưa nhỏ dần',
        'Bác làm vườn lấy một chiếc rá che đèn. Ba người ngồi dưới mái hiên đếm từng giọt nước rơi từ đầu lá.',
        'Mai hỏi bao giờ mới thả được đèn. Bác chỉ ra hồ: “Khi nước thôi nhăn mặt.” Mai nhìn những vòng nước nhỏ rồi bật cười.'],
        [{
          place: 'Hồ trong cung', guide: 'Công chúa Mai', icon: '🪷',
          line: 'Mặt hồ phẳng rồi. Em sửa câu này trước khi mình thả đèn nhé!',
          praise: 'Đúng rồi! Chiếc đèn trôi êm ra giữa hồ.',
          short: 'Chiếc đèn trôi lặng lẻ trên hồ.', paragraph: 'Mai đặt đèn xuống mặt nước. Chiếc đèn trôi lặng lẻ trên hồ.',
          bad: 'lẻ', good: 'lẽ', hint: 'Trong từ lặng lẽ, tiếng lẽ viết dấu ngã.'
        }, 'Hai bông hoa cùng nở',
        'Khi mặt hồ phẳng lại, Mai đặt hoa giấy xuống. Có một bông sáng trên nước và một bông khác sáng ở dưới.',
        'Nhà vua ngồi cạnh con. Hai người chờ cho chiếc đèn trôi gần bờ bên kia rồi vớt lên, đem hong dưới mái hiên để hôm sau còn thả.']
      ]),
      storyChapter('royal-stars', '🔭', 'Cửa sổ nhìn lên sao', 'Theo dấu Công chúa Mai tới Cổng Sao.', 'Bản Đồ Bầu Trời', [84,22], 'Ai bắt được chiếc đuôi sao?', [
        [{
          place: 'Đài quan sát', guide: 'Cô Ngân ngắm sao', icon: '🌌',
          line: 'Quân Bóng Tối đã chặn lối lên đài. Công chúa Mai để lại lời nhắn này.',
          praise: 'Em sửa đúng rồi! Nhà vua tiến qua quân chắn đường.',
          short: 'Trời đêm có nhiều ngôi xao.', paragraph: 'Cô Ngân kéo rèm cửa sổ. Trời đêm có nhiều ngôi xao.',
          bad: 'xao', good: 'sao', hint: 'Vật sáng nhỏ ta thấy trên trời đêm gọi là ngôi sao, bắt đầu bằng s.'
        }, 'Cửa sổ quay được',
        'Cô Ngân mở cửa đài. Nhà vua ngạc nhiên vì cả mái gỗ có thể xoay. Khi cô đẩy một tay, một khoảng trời mới hiện ra.',
        'Mai đặt ghế dưới kính. Cô Ngân hỏi em muốn nhìn sao nào trước. Mai chỉ ngôi nhỏ nhất, ngay sát đầu mái.'],
        [{
          place: 'Phòng kính thiên văn', guide: 'Cô Ngân ngắm sao', icon: '🔭',
          line: 'Nhìn qua kính, cô thấy Công chúa bị giữ sau Cổng Sao. Hãy sửa lời chỉ dẫn này.',
          praise: 'Đúng rồi! Cổng Sao ở cuối cầu. Nhà vua cưỡi ngựa tới đó.',
          short: 'Mai xoay kín về phía trời đêm.', paragraph: 'Cô Ngân đứng bên cạnh và chỉ hướng. Mai xoay kín về phía trời đêm.',
          bad: 'kín', good: 'kính', hint: 'Dụng cụ nhìn vật ở xa là kính. Tiếng kính kết thúc bằng nh.'
        }, 'Nối sao bằng đầu ngón tay',
        'Qua kính, Mai thấy nhiều sao hơn. Cô Ngân nối vài ngôi sáng bằng đầu ngón tay rồi hỏi Mai thấy hình gì.',
        'Mai bảo giống một con thuyền. Nhà vua thấy giống chiếc muôi. Cô Ngân cười: “Mỗi người vẽ một bức trên cùng một bầu trời.”'],
        [{
          place: 'Cổng Sao', guide: 'Lính gác Bình', icon: '🛡️', preview: 'royal-track',
          line: 'Công chúa đang sau cánh cổng. Sửa chữ cuối để Nhà vua vượt qua Kỵ sĩ Bóng Tối!',
          praise: 'Đúng rồi! Nhà vua giơ khiên và tiến về phía cổng.',
          short: 'Sao chổi kéo theo một chiếc đui sáng.', paragraph: 'Trên tấm thẻ Công chúa để lại có câu: Sao chổi kéo theo một chiếc đui sáng.',
          bad: 'đui', good: 'đuôi', hint: 'Phần kéo dài phía sau là đuôi, viết với uô.'
        }, 'Đuôi sao trong lòng sông',
        'Kỵ sĩ Bóng Tối lùi lại. Hai cánh Cổng Sao mở ra và Mai chạy về phía cha. Công chúa vừa ra ngoài thì một vệt sáng kéo qua trời.',
        'Mai chỉ xuống sông, nơi mặt nước cũng ánh lên. Nhà vua kê một hàng ghế thấp để các bạn nhỏ nhìn qua lan can. Ai xuống đài cũng mang theo một hình sao do mình tự vẽ.']
      ])
    ]
  }
];
