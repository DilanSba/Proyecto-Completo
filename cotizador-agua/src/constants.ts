import { Product } from './types';

export const PRODUCTS: Product[] = [
  // Sistemas de tratamiento (Water products first as requested)
  { 
    id: 'trat-ro', 
    category: 'Sistemas de tratamiento', 
    name: 'Reverse Osmosis', 
    personas: null, 
    description: 'Agua pura para beber directamente del grifo. Elimina sedimentos, cloro y contaminantes.', 
    imageUrl: 'https://i.postimg.cc/Jz5g2W36/Reverse-Osmosis.png', 
    prices: { cash: 3201.17, synchrony: null, m18: null, m61: null }, 
    cashSinIvu: 2871.00, 
    ivuCash: 330.17 
  },
  { 
    id: 'trat-poe', 
    category: 'Sistemas de tratamiento', 
    name: 'Suavizador POE', 
    personas: null, 
    description: 'Tratamiento para toda la casa. Protege tuberías, electrodomésticos y mejora la calidad del agua.', 
    imageUrl: 'https://i.postimg.cc/7P5FYdDn/Suavizador-POE.png', 
    prices: { cash: 5509.22, synchrony: null, m18: null, m61: null }, 
    cashSinIvu: 4941.00, 
    ivuCash: 568.22 
  },
  // Calentadores
  { 
    id: 'cal-80-1p', 
    category: 'Calentadores', 
    name: '80Gal / 1 Panel', 
    personas: '1 a 2', 
    description: 'Ideal para parejas o personas solas. Alta eficiencia térmica con panel solar de alta absorción.', 
    imageUrl: 'https://i.postimg.cc/d1xjx5SW-/80Gal-1-Panel.png', 
    prices: { cash: 3301.52, synchrony: 3668.35, m18: 203.80, m61: 73.00 }, 
    synchronySinIvu: 3290.00, 
    ivu: 378.35, 
    cashSinIvu: 2961.00, 
    ivuCash: 340.52 
  },
  { 
    id: 'cal-80-2p', 
    category: 'Calentadores', 
    name: '80Gal / 2 Paneles', 
    personas: '3 a 4', 
    description: 'El estándar para familias pequeñas. Recuperación rápida de calor. Mayor capacidad de captación solar.', 
    imageUrl: 'https://i.postimg.cc/1XVrhDkw/80Gal-2-Paneles.png', 
    prices: { cash: 3602.57, synchrony: 4002.85, m18: 222.38, m61: 80.00 }, 
    synchronySinIvu: 3590.00, 
    ivu: 412.85, 
    cashSinIvu: 3231.00, 
    ivuCash: 371.57 
  },
  { 
    id: 'cal-120-3p', 
    category: 'Calentadores', 
    name: '120Gal / 3 Paneles', 
    personas: '5 a 6', 
    description: 'Capacidad superior para hogares con alto consumo de agua caliente. Ideal para familias medianas.', 
    imageUrl: 'https://i.postimg.cc/MHfm21CK/120Gal-3-Paneles.png', 
    prices: { cash: 6412.37, synchrony: 7124.85, m18: 395.82, m61: 143.00 }, 
    synchronySinIvu: 6390.00, 
    ivu: 734.85, 
    cashSinIvu: 5751.00, 
    ivuCash: 661.37 
  },
  { 
    id: 'cal-120-4p', 
    category: 'Calentadores', 
    name: '120Gal / 4 Paneles', 
    personas: '+7', 
    description: 'Máxima potencia solar. Diseñado para residencias grandes o con alto consumo diario.', 
    imageUrl: 'https://i.postimg.cc/Vv0WQXxC/120Gal-4-Paneles.png', 
    prices: { cash: 6813.77, synchrony: 7570.85, m18: 420.60, m61: 151.00 }, 
    synchronySinIvu: 6790.00, 
    ivu: 780.85, 
    cashSinIvu: 6111.00, 
    ivuCash: 702.77 
  },
  // Cisternas
  { 
    id: 'cis-eco-500', 
    category: 'Cisternas', 
    name: 'Eco 500 Gal', 
    personas: null, 
    description: 'Reserva confiable para emergencias o cortes de servicio. Instalación compacta.', 
    imageUrl: 'https://i.postimg.cc/wBFVhq51/Eco-500-Gal.png', 
    prices: { cash: 4606.07, synchrony: 5117.85, m18: 284.33, m61: 102.00 }, 
    synchronySinIvu: 4590.00, 
    ivu: 527.85, 
    cashSinIvu: 4131.00, 
    ivuCash: 475.07 
  },
  { 
    id: 'cis-herc-600', 
    category: 'Cisternas', 
    name: 'Herc 600 Gal', 
    personas: null, 
    description: 'Construcción reforzada para mayor durabilidad y capacidad. Material de alta resistencia UV.', 
    imageUrl: 'https://i.postimg.cc/4380XbSb/Herc-600-Gal.png', 
    prices: { cash: 4606.07, synchrony: 5117.85, m18: 284.33, m61: 102.00 }, 
    synchronySinIvu: 4590.00, 
    ivu: 527.85, 
    cashSinIvu: 4131.00, 
    ivuCash: 475.07 
  },
  { 
    id: 'cis-eco-150', 
    category: 'Cisternas', 
    name: 'Eco 150 Gal', 
    personas: null, 
    description: 'Solución compacta y eficiente para almacenamiento de agua en espacios reducidos. Ideal para apartamentos.', 
    imageUrl: 'https://i.postimg.cc/jtfCZBYW/Tanque.png', 
    prices: { cash: 2900.12, synchrony: 3222.35, m18: 179.02, m61: 64.45 }, 
    synchronySinIvu: 2890.00, 
    ivu: 332.35, 
    cashSinIvu: 2601.00, 
    ivuCash: 299.12 
  }
];

export const MODE_LABELS: Record<string, string> = { 
  cash: 'Cash', 
  synchrony: 'Synchrony', 
  m18: '18 Meses', 
  m61: '61 Meses' 
};
