export interface MedicineProduct {
  id: number;
  name: string;
  category: string;
  price: string;
  priceNum: number;
  originalPrice?: string;
  discount?: string;
  image: string;
  fallbackImage: string;
  description: string;
}

export const MEDICINE_PRODUCTS: MedicineProduct[] = [
  {
    id: 1,
    name: 'Parasetamol 500 mg',
    category: 'Pereda Nyeri & Demam',
    price: 'Rp 3.500',
    priceNum: 3500,
    image: '/products/parasetamol-500mg.webp',
    fallbackImage: 'https://down-id.img.susercontent.com/file/9f3d8956d62ff7b1b35421f3184b6f56@resize_w450_nl.webp',
    description: 'Parasetamol 500 mg aman untuk meredakan sakit kepala, demam, dan rasa tidak nyaman pada ibu hamil dengan rekomendasi dokter.'
  },
  {
    id: 2,
    name: 'Asam Folat 0,4 mg',
    category: 'Vitamin & Asam Folat',
    price: 'Rp 9.000',
    priceNum: 9000,
    image: '/products/asam-folat-04mg.jpg',
    fallbackImage: 'https://irp.cdn-website.com//0ead930f/dms3rep/multi/opt/Asam+Folat+400+mcg-1920w.jpg',
    description: 'Asam Folat 0,4 mg / 400 mcg esensial untuk pembentukan sel saraf dan mencegah risiko kelainan tabung saraf (NTD) pada janin.'
  },
  {
    id: 3,
    name: 'Zat Besi 300 mg',
    category: 'Mineral & Tambah Darah',
    price: 'Rp 3.000',
    priceNum: 3000,
    image: '/products/zat-besi-300mg.jpg',
    fallbackImage: 'https://down-id.img.susercontent.com/file/a30927c5028d17ec9030f3532b622fa9',
    description: 'Zat Besi 300 mg membantu pembentukan sel darah merah dan mencegah anemia defisiensi besi pada masa kehamilan.'
  },
  {
    id: 4,
    name: 'Kalsium Karbonat 500 mg',
    category: 'Tulang & Gigi',
    price: 'Rp 5.000',
    priceNum: 5000,
    image: '/products/kalsium-karbonat-500mg.jpg',
    fallbackImage: 'https://d3bbrrd0qs69m4.cloudfront.net/images/product/apotek_online_k24klik_20250728013044359225_calcium-carbonate-4.jpg',
    description: 'Kalsium Karbonat 500 mg memenuhi kebutuhan kalsium harian untuk kesehatan tulang ibu dan pembentukan kerangka janin.'
  },
  {
    id: 5,
    name: 'Vitamin D3 1000 IU',
    category: 'Vitamin & Daya Tahan',
    price: 'Rp 4.000',
    priceNum: 4000,
    image: '/products/vitamin-d3-1000iu.webp',
    fallbackImage: 'https://d2qjkwm11akmwu.cloudfront.net/products/183557_22-7-2026_15-48-54.webp',
    description: 'Vitamin D3 1000 IU membantu penyerapan kalsium optimal serta mendukung daya tahan tubuh ibu hamil.'
  },
  {
    id: 6,
    name: 'Vitamin B6 10 mg / 25 mg',
    category: 'Vitamin & Anti Mual',
    price: 'Rp 4.000',
    priceNum: 4000,
    image: '/products/vitamin-b6.jpg',
    fallbackImage: 'https://d3bbrrd0qs69m4.cloudfront.net/images/product/large/apotek_online_k24klik_20210224034032359225_VIT-B6-TRIFA-3.jpg',
    description: 'Vitamin B6 dianjurkan untuk membantu meredakan mual dan muntah (morning sickness) di trimester awal kehamilan.'
  },
  {
    id: 7,
    name: 'Doksilamin',
    category: 'Anti Mual & Sirup',
    price: 'Rp 18.000',
    priceNum: 18000,
    image: '/products/doksilamin.jpg',
    fallbackImage: 'https://d3bbrrd0qs69m4.cloudfront.net/images/product/apotek_online_k24klik_201807201023164677_dexmolex.jpg',
    description: 'Doksilamin sirup membantu meredakan keluhan mual dan muntah berlebih pada ibu hamil sesuai anjuran dan resep dokter.'
  },
  {
    id: 8,
    name: 'Antasida 200 mg',
    category: 'Lambung & Maag',
    price: 'Rp 3.000',
    priceNum: 3000,
    image: '/products/antasida-200mg.jpg',
    fallbackImage: 'https://images.alodokter.com/dk0z4ums3/image/upload/v1710426204/attached_image/antasida-doen.jpg',
    description: 'Antasida 200 mg kunyah untuk menetralkan asam lambung, meredakan nyeri ulu hati dan kembung.'
  },
  {
    id: 9,
    name: 'Laktulosa',
    category: 'Pencernaan & Konstipasi',
    price: 'Rp 46.000',
    priceNum: 46000,
    image: '/products/laktulosa-60ml.jpg',
    fallbackImage: 'https://d3bbrrd0qs69m4.cloudfront.net/images/product/large/apotek_online_k24klik_2025043011472723085_lactulose-1.jpg',
    description: 'Laktulosa sirup bekerja melunakkan feses secara aman tanpa diserap ke dalam darah, ideal untuk mengatasi sembelit pada ibu hamil.'
  }
];
