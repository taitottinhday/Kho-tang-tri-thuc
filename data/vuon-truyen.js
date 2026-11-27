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
