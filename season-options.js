/* Danh sách cảnh nền của máy chủ, trang học và trang giáo viên. */
'use strict';
(function () {
  const options = {
    noel:      { icon: '🎄', name: 'Giáng sinh', meta: '#b31c35', hint: 'Tuyết rơi, cây thông' },
    tet:       { icon: '🧧', name: 'Tết', meta: '#8f1620', hint: 'Cả nhà quây quần bên lửa', art: 'assets/le-hoi-0.webp', fx: 'petal', ax: .55 },
    trungthu:  { icon: '🌕', name: 'Trung thu', meta: '#3a1d6b', hint: 'Trăng rằm, đèn ông sao', art: 'assets/le-hoi-1.webp', fx: 'firefly', ax: .5 },
    khaigiang: { icon: '🏫', name: 'Khai giảng', meta: '#24567a', nightMeta: '#0f2748', hint: 'Sân trường và máy bay giấy', art: 'assets/canh-khai-giang.webp', thumb: 'assets/canh-khai-giang-thumb.webp', fx: 'balloon' },
    nhagiao:   { icon: '💐', name: 'Ngày Nhà giáo', meta: '#673b66', nightMeta: '#4a1330', hint: 'Hiên thư viện và cánh hoa', art: 'assets/canh-nha-giao.webp', thumb: 'assets/canh-nha-giao-thumb.webp', fx: 'rose' },
    thieunhi:  { icon: '🎈', name: 'Thiếu nhi', meta: '#146773', nightMeta: '#07384a', hint: 'Diều và bong bóng bên biển', art: 'assets/canh-thieu-nhi.webp', thumb: 'assets/canh-thieu-nhi-thumb.webp', fx: 'bubble', mobileX: .31 },
    none:      { icon: '🌱', name: 'Vườn xanh', meta: '#235b41', nightMeta: '#112a20', hint: 'Suối, bướm và vườn cây', art: 'assets/canh-vuon-xanh.webp', thumb: 'assets/canh-vuon-xanh-thumb.webp', fx: 'firefly', mobileX: .26 }
  };
  const catalog = Object.freeze({ options: Object.freeze(options), cacheKey: 'vuonchu.publishedSeason' });
  if (typeof module === 'object' && module.exports) module.exports = catalog;
  else window.SeasonCatalog = catalog;
})();
