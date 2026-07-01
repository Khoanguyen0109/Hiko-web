import ogImageSrc from '@images/social.png';

export const SITE = {
  title: 'Hiko Matcha',
  tagline: 'Matcha Tươi, Pha Theo Cách Của Bạn',
  description:
    'Hiko Matcha – thưởng thức matcha tươi pha theo order tại 2 cửa hàng ở Tân Bình & Gò Vấp, TP.HCM. Đặt hàng qua GrabFood hoặc ghé trực tiếp.',
  description_short:
    'Hiko Matcha – matcha tươi pha theo order, 2 cửa hàng tại Tân Bình & Gò Vấp, TP.HCM.',
  url: 'https://hikomatcha.vn',
  author: 'Hiko Matcha',
};

export const SEO = {
  title: SITE.title,
  description: SITE.description,
  structuredData: {
    '@context': 'https://schema.org',
    '@type': 'CafeOrCoffeeShop',
    name: 'Hiko Matcha',
    description: SITE.description,
    url: SITE.url,
    '@id': SITE.url,
    inLanguage: 'vi-VN',
    priceRange: '₫₫',
    servesCuisine: ['Matcha', 'Beverages', 'Fruit Latte', 'Cacao'],
    openingHoursSpecification: [
      {
        '@type': 'OpeningHoursSpecification',
        dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
        opens: '06:30',
        closes: '22:15',
      },
    ],
    location: [
      {
        '@type': 'Place',
        name: 'Hiko Matcha – Tân Bình',
        address: {
          '@type': 'PostalAddress',
          streetAddress: '281/25/1 Lê Văn Sỹ, Phường 1',
          addressLocality: 'Quận Tân Bình',
          addressRegion: 'TP. Hồ Chí Minh',
          addressCountry: 'VN',
        },
      },
      {
        '@type': 'Place',
        name: 'Hiko Matcha – Gò Vấp',
        address: {
          '@type': 'PostalAddress',
          streetAddress: '101 Lê Lợi, Phường Hạnh Thông',
          addressLocality: 'Quận Gò Vấp',
          addressRegion: 'TP. Hồ Chí Minh',
          addressCountry: 'VN',
        },
        geo: {
          '@type': 'GeoCoordinates',
          latitude: 10.8192724,
          longitude: 106.6857471,
        },
      },
    ],
    sameAs: [
      'https://www.facebook.com/profile.php?id=61575083366149',
      'https://www.tiktok.com/@hikomatchacorner',
      'https://food.grab.com/vn/vi/restaurant/hiko-matcha-delivery/5-C7NHN6CWJPBTAA',
    ],
  },
};

export const OG = {
  locale: 'vi_VN',
  type: 'website',
  url: SITE.url,
  title: 'Hiko Matcha – Matcha Coco & Trái Cây Tươi | TP.HCM',
  description:
    'Thưởng thức matcha tươi pha theo order — Matcha Coco, Cold Whisk, fruit lattes. Hai cửa hàng tại Tân Bình & Gò Vấp. Đặt qua Grab ngay!',
  image: ogImageSrc,
};

export const partnersData = [
  {
    icon: `<img
      src="/logos/grabfood.jpg"
      alt="GrabFood"
      class="mx-auto h-16 w-auto object-contain py-1 sm:mx-0 lg:h-20"
    />`,
    name: 'GrabFood',
    href: 'https://food.grab.com/vn/vi/restaurant/hiko-matcha-delivery/5-C7NHN6CWJPBTAA',
  },
  {
    icon: `<img
      src="/logos/shopeefood.png"
      alt="ShopeeFood"
      class="mx-auto h-16 w-auto object-contain py-1 sm:mx-0 lg:h-20"
    />`,
    name: 'ShopeeFood',
    href: 'https://www.foody.vn/ho-chi-minh/hiko-matcha-le-van-sy',
  },
  {
    icon: `<img
      src="/logos/befood.png"
      alt="beFood"
      class="mx-auto h-16 w-auto object-contain py-1 sm:mx-0 lg:h-20"
    />`,
    name: 'beFood',
    href: '#',
  },
];
