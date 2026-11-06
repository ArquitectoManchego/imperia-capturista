import { db } from './firebase';
import { collection, getDocs, addDoc, serverTimestamp } from 'firebase/firestore';
import { CatalogProduct, NoteItem } from './types';

export type { CatalogProduct };

// Catálogo base precargado con los 37 productos existentes en la base de datos de Software Imperia
export const INITIAL_PRODUCTS_CATALOG: CatalogProduct[] = [
  {
    id: "5Y7lI6CaQwxnLuFn9w7W",
    nombre: "FILIPINA CLINICA UV ENFRA DAMA",
    prenda: "FILIPINA",
    precio: 425,
    sku_base: "FILCLINUVENFRADAM",
    ramo: "MEDICINA",
    escuela: "CVC",
    descripcion: "FILIPINA CLINICA PARA LA UV FAC. DE ENFERMERIA DAMA"
  },
  {
    id: "5h8pM1qeVkL0lFyI8w2P",
    nombre: "PLAYERA DIARIO CVC",
    prenda: "PLAYERA",
    precio: 379,
    sku_base: "POLOCVC",
    ramo: "ESCOLAR",
    escuela: "CVC",
    descripcion: "PLAYERA POLO DE UNIFORME ESCOLAR PARA EL COLEGIO CVC"
  },
  {
    id: "6h3Dk3yIth1LD5awyfDG",
    nombre: "FILIPINA REYNA AMPARO DEL CASTILLO",
    prenda: "FILIPINA",
    precio: 425,
    sku_base: "FILREYAMPC",
    ramo: "MEDICINA",
    escuela: "AMPARO DEL CASTILLO",
    descripcion: "FILIPINA REYNA PARA LA ESCUELA DE ENFERMERIA AMPARO DEL CASTILLO"
  },
  {
    id: "7zLe6KaA8uJKNlZ2Rwu3",
    nombre: "FILIPINA QUIRURGICA UV ENFRA CABALLERO",
    prenda: "FILIPINA",
    precio: 525,
    sku_base: "FILQXUVENFRACAB",
    ramo: "MEDICINA",
    escuela: "CVC",
    descripcion: "FILIPINA QUIRURGICA PARA LA UV FAC. DE ENFERMERIA CABALLERO"
  },
  {
    id: "B49JGRLBNf4a6Oc625k3",
    nombre: "Mandil de Arte Manga Larga",
    prenda: "MANDIL",
    precio: 0,
    sku_base: "MANLAR",
    ramo: "ESCOLAR",
    escuela: "NIC",
    descripcion: "MANDIL DE ARTE ESCOLAR MANGA LARGA"
  },
  {
    id: "B6TT7WGmQihTfq2mJZ4o",
    nombre: "Mandil de Arte",
    prenda: "MANDIL",
    precio: 0,
    sku_base: "MAN",
    ramo: "ESCOLAR",
    escuela: "",
    descripcion: "MANDIL DE ARTE ESTANDAR"
  },
  {
    id: "CeXBOWV7uKVT4Wmy6o4i",
    nombre: "PANTALON QUIRURGICO AMPARO DEL CASTILLO LIC",
    prenda: "PANTALON",
    precio: 525,
    sku_base: "PANTQXAMPCLIC",
    ramo: "MEDICINA",
    escuela: "AMPARO DEL CASTILLO",
    descripcion: "PANTALON QUIRURGICO PARA LICENCIATURA AMPARO DEL CASTILLO"
  },
  {
    id: "Chk7s0TsnM3gpUX2Yul4",
    nombre: "PANTS CVC",
    prenda: "PANTALON",
    precio: 395,
    sku_base: "PANTCVC",
    ramo: "ESCOLAR",
    escuela: "CVC",
    descripcion: "PANTS DEPORTIVO OFICIAL CVC"
  },
  {
    id: "G9xRUeZO5HMHESnDRVha",
    nombre: "PLAYERA DEPORTES CVC",
    prenda: "PLAYERA",
    precio: 290,
    sku_base: "PLADEPCVC",
    ramo: "ESCOLAR",
    escuela: "CVC",
    descripcion: "PLAYERA DEPORTIVA DEL COLEGIO CVC"
  },
  {
    id: "KdyTV3WlXOHUYwbNu4tj",
    nombre: "SHORT DEPORTES CVC",
    prenda: "SHORT",
    precio: 249,
    sku_base: "SHORDEPCVC",
    ramo: "ESCOLAR",
    escuela: "CVC",
    descripcion: "SHORT DEPORTIVO OFICIAL CVC"
  },
  {
    id: "M7Iust0snw3w5snAJP9K",
    nombre: "FILIPINA CLINICA UV ENFRA CABALLERO",
    prenda: "FILIPINA",
    precio: 425,
    sku_base: "FILCLINUVENFRACAB",
    ramo: "MEDICINA",
    escuela: "CVC",
    descripcion: "FILIPINA CLINICA PARA LA UV FAC. DE ENFERMERIA CABALLERO"
  },
  {
    id: "Uuq1ku3Ez8F0oK3PivIF",
    nombre: "SHORT DIARIO CVC",
    prenda: "SHORT",
    precio: 359,
    sku_base: "SHORDIACVC",
    ramo: "ESCOLAR",
    escuela: "CVC",
    descripcion: "SHORT DE DIARIO OFICIAL CVC"
  },
  {
    id: "WWNUSeNQAl3PD6t1Q9nh",
    nombre: "CHAMARRA CVC",
    prenda: "CHAMARRA",
    precio: 395,
    sku_base: "CHAMCVC",
    ramo: "ESCOLAR",
    escuela: "CVC",
    descripcion: "CHAMARRA ESCOLAR OFICIAL CVC"
  },
  {
    id: "Wjg5GOMnYX7pTMCZVGiG",
    nombre: "PLAYERA POLO PREMIUM DAMA",
    prenda: "PLAYERA",
    precio: 0,
    sku_base: "POLEURPREMDAM",
    ramo: "GENERAL",
    escuela: "",
    descripcion: "PLAYERA POLO 50/50 ALGODON POLIESTER DAMA"
  },
  {
    id: "XPdGtb1M6qwHSbv6JoeD",
    nombre: "PLAYERA POLO PREMIUM CABALLERO",
    prenda: "PLAYERA",
    precio: 0,
    sku_base: "POLEURPRMCAB",
    ramo: "GENERAL",
    escuela: "",
    descripcion: "PLAYERA POLO CABALLERO 50/50 ALGODON Y POLIESTER"
  },
  {
    id: "dm0LCOgRUvYbloRwDdQ4",
    nombre: "FILIPINA COMUNITARIA UV ENFRA DAMA",
    prenda: "FILIPINA",
    precio: 425,
    sku_base: "FILCOMUVENFRADAM",
    ramo: "MEDICINA",
    escuela: "CVC",
    descripcion: "FILIPINA COMUNITARIA PARA LA UV FAC. DE ENFERMERIA DAMA"
  },
  {
    id: "gjbuz1MnmCgsJJqUmD0W",
    nombre: "FILIPINA QUIRURGICA UV ENFRA DAMA",
    prenda: "FILIPINA",
    precio: 525,
    sku_base: "FILQXUVENFRADAM",
    ramo: "MEDICINA",
    escuela: "CVC",
    descripcion: "FILIPINA QUIRURGICA PARA LA UV FAC. DE ENFERMERIA DAMA"
  },
  {
    id: "kuwiXETbXDanLaq56fyB",
    nombre: "FALDA SHORT DIARIO CVC",
    prenda: "FALDA",
    precio: 379,
    sku_base: "FALDIACVC",
    ramo: "ESCOLAR",
    escuela: "CVC",
    descripcion: "FALDA SHORT DE UNIFORME DIARIO DEL COLEGIO CVC"
  },
  {
    id: "lARbAaGsOFaskYWY7xT1",
    nombre: "PANTALON QUIRURGICO UV ENFRA",
    prenda: "PANTALON",
    precio: 525,
    sku_base: "PANTQXUVENFRA",
    ramo: "MEDICINA",
    escuela: "CVC",
    descripcion: "PANTALON QUIRURGICO UV ENFERMERIA"
  },
  {
    id: "pmq3FhPxqocMmI0z4prn",
    nombre: "GORRO QUIRURGICO",
    prenda: "GORRO",
    precio: 0,
    sku_base: "GORQX",
    ramo: "MEDICINA",
    escuela: "AMPARO DEL CASTILLO",
    descripcion: "GORRO QUIRURGICO DE TELA"
  },
  {
    id: "prod_chamarra_yazbek_dtf",
    "nombre": "Chamarra / Sudadera Yazbek Personalizada DTF",
    prenda: "CHAMARRA",
    precio: 485,
    sku_base: "CHAM-YAZ-DTF",
    ramo: "PERSONALIZADO",
    escuela: "",
    descripcion: "Chamarra sudadera Yazbek de alta calidad personalizada con impresión DTF"
  },
  {
    id: "prod_noordwijk_olympic_games",
    nombre: "Playera Olympic Games - Colegio Noordwijk (Abril)",
    prenda: "PLAYERA",
    precio: 220,
    sku_base: "PLA-NOORD-OLYMPIC",
    ramo: "ESCOLAR",
    escuela: "COLEGIO NOORDWIJK",
    descripcion: "Playera oficial de cuello redondo para Olympic Games"
  },
  {
    id: "prod_pantalon_franela_escocesa",
    nombre: "Pantalón de Franela Escocesa a Cuadros",
    prenda: "PANTALON",
    precio: 295,
    sku_base: "PANT-FRAN-ESC",
    ramo: "TEMPORADA",
    escuela: "",
    descripcion: "Pantalón cómodo de franela suave con patrones escoceses a cuadros"
  },
  {
    id: "prod_pijama_navidena_escocesa",
    nombre: "Set Pijama Navideña Personalizada (Franela Escocesa)",
    prenda: "PIJAMA",
    precio: 495,
    sku_base: "PIJ-NAV-ESC",
    ramo: "TEMPORADA",
    escuela: "",
    descripcion: "Pijama navideña y de año nuevo con pantalón de franela"
  },
  {
    id: "prod_playera_dia_de_la_madre",
    nombre: "Playera Personalizada Día de la Madre",
    prenda: "PLAYERA",
    precio: 245,
    sku_base: "PLA-PERS-MADRE",
    ramo: "PERSONALIZADO",
    escuela: "",
    descripcion: "Playera personalizada para el Día de la Madre"
  },
  {
    id: "prod_playera_dia_del_padre",
    nombre: "Playera Personalizada Día del Padre",
    prenda: "PLAYERA",
    precio: 245,
    sku_base: "PLA-PERS-PADRE",
    ramo: "PERSONALIZADO",
    escuela: "",
    descripcion: "Playera personalizada para el Día del Padre"
  },
  {
    id: "prod_playera_independencia_fiestas_patrias",
    nombre: "Playera Fiestas Patrias (15 y 16 de Septiembre)",
    prenda: "PLAYERA",
    precio: 235,
    sku_base: "PLA-PERS-PATRIA",
    ramo: "PERSONALIZADO",
    escuela: "",
    descripcion: "Playeras patrióticas mexicanas con diseños alusivos a la Independencia"
  },
  {
    id: "prod_polo_restaurante_bordada",
    nombre: "Playera Polo Uniforme Restaurante con Bordado (9-10 cm)",
    prenda: "POLO",
    precio: 295,
    sku_base: "POLO-REST-BORD",
    ramo: "RESTAURANTE",
    escuela: "",
    descripcion: "Playera tipo polo fresca y resistente para restaurantes"
  },
  {
    id: "prod_polo_uniforme_empresarial_bordada",
    nombre: "Playera Polo Uniforme Empresarial con Bordado (9-10 cm)",
    prenda: "POLO",
    precio: 295,
    sku_base: "POLO-EMP-BORD",
    ramo: "EMPRESARIAL",
    escuela: "",
    descripcion: "Playera tipo polo con bordado institucional para empresas"
  },
  {
    id: "prod_trajes_escolares_eventos",
    nombre: "Trajes y Vestuarios Escolares Personalizados (Por Evento)",
    prenda: "TRAJE",
    precio: 385,
    sku_base: "TRAJE-ESC-EVENTO",
    ramo: "ESCOLAR",
    escuela: "",
    descripcion: "Fabricación de vestuarios escolares cotizados por evento"
  },
  {
    id: "sUR720oRwUEVVr4FEIut",
    nombre: "FILIPINA COMUNITARIA UV ENFRA CABALLERO",
    prenda: "FILIPINA",
    precio: 425,
    sku_base: "FILCOMUVENFRACAB",
    ramo: "MEDICINA",
    escuela: "CVC",
    descripcion: "FILIPINA COMUNITARIA DE LA UV FAC. DE ENFERMERIA DE CABALLERO"
  },
  {
    id: "v1doy7SHQdSuw0iYO2lf",
    nombre: "MANDIL CVC",
    prenda: "MANDIL",
    precio: 0,
    sku_base: "MANCVC",
    ramo: "ESCOLAR",
    escuela: "CVC",
    descripcion: "MANDIL ESCOLAR COLEGIO CVC"
  },
  {
    id: "vdiEzOOubqsaeo7OGeE1",
    nombre: "PANTALON CASUAL CABALLERO",
    prenda: "PANTALON",
    precio: 465,
    sku_base: "PANTCASCAB",
    ramo: "MEDICINA",
    escuela: "",
    descripcion: "PANTALON CASUAL CORTE CABALLERO"
  },
  {
    id: "xJwIHmLMQ95we7s4iVFz",
    nombre: "FILIPINA JOSE CABALLERO",
    prenda: "FILIPINA",
    precio: 425,
    sku_base: "FILJOSCAB",
    ramo: "MEDICINA",
    escuela: "",
    descripcion: "FILIPINA MODELO JOSE PARA CABALLERO"
  },
  {
    id: "zA41O2lCVNtb0XmZiZiI",
    nombre: "PANTALON MIXTO",
    prenda: "PANTALON",
    precio: 425,
    sku_base: "PANTMIX",
    ramo: "MEDICINA",
    escuela: "",
    descripcion: "PANTALON MIXTO UNISEX"
  },
  {
    id: "zapREBgZTgY2Wm03Tsta",
    nombre: "FILIPINA QUIRURGICA AMPARO DEL CASTILLO LIC",
    prenda: "FILIPINA",
    precio: 525,
    sku_base: "FILQXAMPDELCLIC",
    ramo: "MEDICINA",
    escuela: "AMPARO DEL CASTILLO",
    descripcion: "FILIPINA QUIRURGICA PARA LICENCIATURA AMPARO DEL CASTILLO"
  }
];

// Función para normalizar texto eliminando acentos, puntuación y expandiendo sinónimos del dominio
export function normalizeConcept(text: string): string {
  if (!text) return '';
  let str = text.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  str = str.replace(/[^a-z0-9\s]/g, ' ');
  
  // Expansión de sinónimos y abreviaturas comunes de Imperia Uniformes
  str = str.replace(/\benfra\b/g, 'enfermeria');
  str = str.replace(/\benf\b/g, 'enfermeria');
  str = str.replace(/\bqx\b/g, 'quirurgico');
  str = str.replace(/\bquirurgica\b/g, 'quirurgico');
  str = str.replace(/\bquir\b/g, 'quirurgico');
  str = str.replace(/\bclinica\b/g, 'clinico');
  str = str.replace(/\bclin\b/g, 'clinico');
  str = str.replace(/\bdam\b/g, 'dama');
  str = str.replace(/\bcab\b/g, 'caballero');
  str = str.replace(/\bfil\b/g, 'filipina');
  str = str.replace(/\bpant\b/g, 'pantalon');
  str = str.replace(/\bconj\b/g, 'conjunto');
  str = str.replace(/\bpol\b/g, 'polo');
  str = str.replace(/\btalla\b/g, '');
  str = str.replace(/\bcon cierre\b/g, '');
  str = str.replace(/\bcierre\b/g, '');
  str = str.replace(/\bcuello v\b/g, '');

  return str.replace(/\s+/g, ' ').trim();
}

// Extrae tokens significativos descartando conectores
function getSignificantTokens(str: string): Set<string> {
  const words = normalizeConcept(str).split(' ').filter(w => {
    return w.length > 1 && !['de', 'la', 'el', 'los', 'las', 'en', 'para', 'por', 'y', 'con', 'sin', 'un', 'una'].includes(w);
  });
  return new Set(words);
}

export interface MatchResult {
  bestProduct: CatalogProduct | null;
  score: number; // 0 a 1
  isExactMatch: boolean;
  matchType: 'exact_text' | 'exact_tokens' | 'partial' | 'none';
}

// Calcula similitud entre el concepto extraído por la IA y un producto del catálogo
export function calculateProductSimilarity(
  concepto: string,
  prod: CatalogProduct,
  prendaSugerida?: string
): { score: number; isExactMatch: boolean; matchType: 'exact_text' | 'exact_tokens' | 'partial' | 'none' } {
  const normConcepto = normalizeConcept(concepto);
  const normProd = normalizeConcept(prod.nombre);

  if (!normConcepto || !normProd) {
    return { score: 0, isExactMatch: false, matchType: 'none' };
  }

  // 1. Coincidencia exacta de texto normalizado
  if (normConcepto === normProd) {
    return { score: 1.0, isExactMatch: true, matchType: 'exact_text' };
  }

  const tokensConcepto = getSignificantTokens(concepto);
  const tokensProd = getSignificantTokens(prod.nombre);

  if (tokensConcepto.size === 0 || tokensProd.size === 0) {
    return { score: 0, isExactMatch: false, matchType: 'none' };
  }

  let intersection = 0;
  tokensConcepto.forEach(t => {
    if (tokensProd.has(t)) intersection++;
  });

  const unionTokens = new Set<string>();
  tokensConcepto.forEach(t => unionTokens.add(t));
  tokensProd.forEach(t => unionTokens.add(t));
  const unionSize = unionTokens.size;
  const jaccard = unionSize > 0 ? intersection / unionSize : 0;

  // 2. Coincidencia exacta de tokens (mismo conjunto de palabras clave significativas)
  if (intersection === tokensConcepto.size && intersection === tokensProd.size) {
    return { score: 1.0, isExactMatch: true, matchType: 'exact_tokens' };
  }

  // Bonus si la prenda (FILIPINA, PANTALON, etc.) coincide exactamente
  let bonus = 0;
  if (prendaSugerida && prod.prenda) {
    if (normalizeConcept(prendaSugerida) === normalizeConcept(prod.prenda)) {
      bonus += 0.15;
    }
  }

  // Si todos los tokens del producto están contenidos en el concepto
  if (tokensProd.size > 0 && intersection === tokensProd.size && tokensConcepto.size <= tokensProd.size + 2) {
    bonus += 0.25;
  }

  const finalScore = Math.min(Math.round((jaccard + bonus) * 100) / 100, 0.99);

  return {
    score: finalScore,
    isExactMatch: false,
    matchType: finalScore >= 0.35 ? 'partial' : 'none'
  };
}

// Encuentra el producto de la base de datos que más se parece a lo adivinado por la IA
export function findBestProductMatch(
  concepto: string,
  prenda?: string,
  catalog: CatalogProduct[] = INITIAL_PRODUCTS_CATALOG
): MatchResult {
  if (!concepto || !catalog || catalog.length === 0) {
    return { bestProduct: null, score: 0, isExactMatch: false, matchType: 'none' };
  }

  let best: CatalogProduct | null = null;
  let maxScore = -1;
  let bestExact = false;
  let bestType: 'exact_text' | 'exact_tokens' | 'partial' | 'none' = 'none';

  for (const prod of catalog) {
    const res = calculateProductSimilarity(concepto, prod, prenda);
    
    // Si encontramos coincidencia exacta de inmediato, es el match definitivo
    if (res.isExactMatch) {
      return {
        bestProduct: prod,
        score: 1.0,
        isExactMatch: true,
        matchType: res.matchType
      };
    }

    if (res.score > maxScore) {
      maxScore = res.score;
      best = prod;
      bestExact = res.isExactMatch;
      bestType = res.matchType;
    }
  }

  return {
    bestProduct: best,
    score: Math.max(maxScore, 0),
    isExactMatch: bestExact,
    matchType: bestType
  };
}

// Enriquecer una partida (NoteItem) con la información de match del catálogo
export function enrichItemWithCatalogMatch(
  item: NoteItem,
  catalog: CatalogProduct[] = INITIAL_PRODUCTS_CATALOG
): NoteItem {
  // Si ya tiene una acción manual del usuario o coincidencia previa respetarla
  if (item.matchAction === 'use_existing' && item.matchedProductId) {
    return item;
  }
  if (item.matchAction === 'create_new') {
    return item;
  }

  const match = findBestProductMatch(item.concepto || item.prenda || '', item.prenda, catalog);

  if (match.isExactMatch && match.bestProduct) {
    return {
      ...item,
      matchedProductId: match.bestProduct.id,
      matchedProductName: match.bestProduct.nombre,
      suggestedProductId: match.bestProduct.id,
      suggestedProductName: match.bestProduct.nombre,
      similarityScore: 1.0,
      isExactMatch: true,
      matchAction: 'use_existing'
    };
  }

  if (match.bestProduct) {
    return {
      ...item,
      suggestedProductId: match.bestProduct.id,
      suggestedProductName: match.bestProduct.nombre,
      matchedProductId: undefined,
      matchedProductName: undefined,
      similarityScore: match.score,
      isExactMatch: false,
      matchAction: undefined // Pendiente de que el usuario elija
    };
  }

  return {
    ...item,
    similarityScore: 0,
    isExactMatch: false,
    matchAction: undefined
  };
}

// Enriquecer una nota completa con matching de productos para todas sus partidas
export function enrichNoteWithCatalogMatches(
  note: any,
  catalog: CatalogProduct[] = INITIAL_PRODUCTS_CATALOG
): any {
  if (!note || !note.items) return note;
  const enrichedItems = note.items.map((it: any) => enrichItemWithCatalogMatch(it, catalog));
  return {
    ...note,
    items: enrichedItems
  };
}

// Consultar el catálogo de productos actualizado en tiempo real desde Firestore
export async function fetchProductsFromSoftwareImperia(): Promise<CatalogProduct[]> {
  try {
    const snap = await getDocs(collection(db, 'products'));
    if (snap.empty) {
      return INITIAL_PRODUCTS_CATALOG;
    }
    const products: CatalogProduct[] = snap.docs.map(docSnap => {
      const d = docSnap.data();
      return {
        id: docSnap.id,
        nombre: d.nombre || 'Producto sin nombre',
        prenda: d.prenda || '',
        precio: Number(d.precio || d.precioBase) || 0,
        sku_base: d.sku_base || '',
        ramo: d.ramo || '',
        escuela: d.escuela || '',
        descripcion: d.descripcion || '',
        esPropio: d.esPropio ?? true
      };
    });
    return products;
  } catch (err) {
    console.warn("Aviso al consultar productos de Firestore, usando catálogo base:", err);
    return INITIAL_PRODUCTS_CATALOG;
  }
}

// Registrar un nuevo producto en la colección 'products' de Software Imperia
export async function createNewProductInSoftwareImperia(
  productData: Partial<CatalogProduct>
): Promise<CatalogProduct> {
  const newProductDoc = {
    nombre: (productData.nombre || 'Nuevo Producto').trim(),
    prenda: productData.prenda || 'PRENDA',
    precio: Number(productData.precio) || 0,
    sku_base: productData.sku_base || `IMP-${(productData.nombre || 'PROD').slice(0, 8).toUpperCase().replace(/[^A-Z0-9]/g, '')}`,
    ramo: productData.ramo || 'GENERAL',
    escuela: productData.escuela || '',
    descripcion: productData.descripcion || `Concepto generado desde Capturista IA`,
    esPropio: true,
    origen: 'Capturista IA WebApp',
    createdAt: serverTimestamp()
  };

  const docRef = await addDoc(collection(db, 'products'), newProductDoc);
  return {
    id: docRef.id,
    ...newProductDoc
  };
}
