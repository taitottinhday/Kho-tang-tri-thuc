/* Kịch bản gốc của Vườn truyện. Mỗi chốt có một đoạn ngắn và một đoạn dài. */
'use strict';
window.VUON_TRUYEN = [
  {
    id: 'seed', icon: '🌱', title: 'Hạt mầm biết đọc', subtitle: 'Theo tấm bản đồ tới thư viện bên suối.',
    relic: 'Hạt mầm Ánh Sáng', discovery: 'Một chồi non bật lên. Cả bờ suối sáng theo từng chiếc lá.',
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
    relic: 'Vé Tàu Mây', discovery: 'Chiếc vé sáng lên. Một đoàn tàu tí hon lướt giữa những tán cây.',
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
    relic: 'Đèn Đom Đóm', discovery: 'Chiếc đèn gọi về cả đàn đom đóm. Chúng vẽ một vì sao trên hồ.',
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
