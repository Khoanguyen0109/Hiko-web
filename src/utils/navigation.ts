// An array of links for navigation bar
const navBarLinks = [
  { name: 'Trang Chủ', url: '/' },
  { name: 'Cửa hàng', url: '/store' },
  { name: 'Câu Chuyện', url: '/story' },
  { name: 'Liên Hệ', url: '/contact' },
];
// An array of links for footer
const footerLinks = [
  {
    section: 'Khám Phá',
    links: [
      { name: 'Menu', url: '/products' },
      { name: 'Cửa hàng', url: '/store' },
      { name: 'Đặt qua GrabFood', url: 'https://food.grab.com/vn/vi/restaurant/hiko-matcha-delivery/5-C7NHN6CWJPBTAA' },
    ],
  },
  {
    section: 'Hiko Matcha',
    links: [
      { name: 'Câu Chuyện', url: '/story' },
      { name: 'Liên Hệ', url: '/contact' },
      { name: 'TikTok', url: 'https://www.tiktok.com/@hikomatchacorner' },
      { name: 'Facebook', url: 'https://www.facebook.com/profile.php?id=61575083366149' },
    ],
  },
];
// An object of links for social icons
const socialLinks = {
  facebook: 'https://www.facebook.com/profile.php?id=61575083366149',
  x: '#',
  github: '#',
  google: 'https://maps.app.goo.gl/Akt6yLFQ7qmyftWG7',
  slack: '#',
};

export default {
  navBarLinks,
  footerLinks,
  socialLinks,
};
