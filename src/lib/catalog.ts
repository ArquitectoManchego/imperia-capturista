import { db } from './firebase';
import { collection, getDocs, addDoc, serverTimestamp } from 'firebase/firestore';
import { CatalogProduct, NoteItem, KitComponent } from './types';
import productsDump from './products-dump.json';

export type { CatalogProduct, KitComponent };

// Catálogo base con los 47 productos y conjuntos existentes en la base de datos de Software Imperia
export const INITIAL_PRODUCTS_CATALOG: CatalogProduct[] = productsDump as CatalogProduct[];

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

// Función auxiliar para extraer tallas individuales de un texto como "F: M  P: M", "F: 34 P: 36", "F: CH / P: M"
export function parseTallasConjunto(
  tallaStr: string = '',
  tallaFil?: string,
  tallaPant?: string
): { filipina: string; pantalon: string } {
  let fil = (tallaFil || '').trim();
  let pant = (tallaPant || '').trim();

  if (fil && pant) {
    return { filipina: fil.toUpperCase(), pantalon: pant.toUpperCase() };
  }

  const str = (tallaStr || '').trim();
  if (!str) {
    return { filipina: fil || 'M', pantalon: pant || 'M' };
  }

  const matchFil = str.match(/(?:F(?:IL|ILIPINA)?)\s*[:\-\.]?\s*([a-zA-Z0-9~]+(?:\s+[a-zA-Z0-9~]+)*?)(?=\s+(?:P(?:ANT|ANTALON)?\s*[:\-\.]|$)|[,;/]|$)/i);
  const matchPant = str.match(/(?:P(?:ANT|ANTALON)?)\s*[:\-\.]?\s*([a-zA-Z0-9~]+(?:\s+[a-zA-Z0-9~]+)*?)(?=\s+(?:F(?:IL|ILIPINA)?\s*[:\-\.]|$)|[,;/]|$)/i);

  if (matchFil && matchFil[1]) fil = matchFil[1].trim();
  if (matchPant && matchPant[1]) pant = matchPant[1].trim();

  if (!fil && !pant && str.includes('/')) {
    const parts = str.split('/');
    if (parts.length >= 2) {
      fil = parts[0].trim();
      pant = parts[1].trim();
    }
  }

  if (!fil && !pant) {
    fil = str;
    pant = str;
  } else if (!fil && pant) {
    fil = pant;
  } else if (fil && !pant) {
    pant = fil;
  }

  return {
    filipina: (fil || 'M').toUpperCase(),
    pantalon: (pant || 'M').toUpperCase()
  };
}

// Desglosa los componentes individuales (piezas de taller/inventario) de un conjunto comercial
export function desglosarComponentesConjunto(
  item: NoteItem,
  product?: CatalogProduct
): KitComponent[] {
  const parsed = parseTallasConjunto(item.talla, item.talla_filipina, item.talla_pantalon);
  const defaultEstado = item.estado_prenda || (item.ped_apa_ent === 'A' ? 'apartada' : 'por_fabricar');

  // Si no se proporcionó producto o no tiene componentes, buscar en el catálogo
  if (!product || !product.componentes || product.componentes.length === 0) {
    const targetName = item.matchedProductName || item.suggestedProductName || item.concepto || item.prenda || '';
    const match = findBestProductMatch(targetName, item.prenda, INITIAL_PRODUCTS_CATALOG);
    if (match.bestProduct && match.bestProduct.componentes && match.bestProduct.componentes.length > 0) {
      product = match.bestProduct;
    } else {
      // Fallback heurístico si no hay match directo en el catálogo:
      const norm = normalizeConcept(item.concepto || '');
      const isQx = norm.includes('quirurgico');
      const isClin = norm.includes('clinico');
      const isCab = norm.includes('caballero') || (item.genero || '').toLowerCase().includes('caballero');

      if (isQx) {
        return [
          {
            rol: 'filipina',
            prenda: 'FILIPINA',
            productId: isCab ? '7zLe6KaA8uJKNlZ2Rwu3' : 'gjbuz1MnmCgsJJqUmD0W',
            productNombre: isCab ? 'FILIPINA QUIRURGICA UV ENFRA CABALLERO' : 'FILIPINA QUIRURGICA UV ENFRA DAMA',
            genero: isCab ? 'Caballero' : 'Dama',
            tallaClave: 'talla_filipina',
            tallaAsignada: parsed.filipina,
            cantidad: Number(item.cant) || 1,
            estado_prenda: defaultEstado
          },
          {
            rol: 'pantalon',
            prenda: 'PANTALON',
            productId: 'lARbAaGsOFaskYWY7xT1',
            productNombre: 'PANTALON QUIRURGICO UV ENFRA (UNISEX)',
            genero: 'Unisex',
            tallaClave: 'talla_pantalon',
            tallaAsignada: parsed.pantalon,
            cantidad: Number(item.cant) || 1,
            estado_prenda: defaultEstado
          },
          {
            rol: 'gorro',
            prenda: 'GORRO',
            productId: 'pmq3FhPxqocMmI0z4prn',
            productNombre: 'GORRO QUIRURGICO UV ENFRA (UNISEX)',
            genero: 'Unisex',
            tallaClave: 'unitalla',
            tallaAsignada: 'Unitalla',
            cantidad: Number(item.cant) || 1,
            estado_prenda: defaultEstado
          }
        ];
      }

      if (isClin) {
        return [
          {
            rol: 'filipina',
            prenda: 'FILIPINA',
            productId: isCab ? 'M7Iust0snw3w5snAJP9K' : '5Y7lI6CaQwxnLuFn9w7W',
            productNombre: isCab ? 'FILIPINA CLINICA CABALLERO' : 'FILIPINA CLINICA UV ENFRA DAMA',
            genero: isCab ? 'Caballero' : 'Dama',
            tallaClave: 'talla_filipina',
            tallaAsignada: parsed.filipina,
            cantidad: Number(item.cant) || 1,
            estado_prenda: defaultEstado
          },
          {
            rol: 'pantalon',
            prenda: 'PANTALON',
            productId: 'zA41O2lCVNtb0XmZiZiI',
            productNombre: 'PANTALON MIXTO BLANCO (UNISEX)',
            genero: 'Unisex',
            tallaClave: 'talla_pantalon',
            tallaAsignada: parsed.pantalon,
            cantidad: Number(item.cant) || 1,
            estado_prenda: defaultEstado
          }
        ];
      }

      return [];
    }
  }

  const existingComps = item.componentesDesglosados || [];

  return (product.componentes || []).map((comp, idx) => {
    const existingComp = existingComps.find(ec => ec.rol === comp.rol) || existingComps[idx];
    let tallaAsignada = existingComp?.tallaAsignada;

    if (!tallaAsignada) {
      if (comp.rol === 'filipina') {
        tallaAsignada = item.talla_filipina || parsed.filipina || 'M';
      } else if (comp.rol === 'pantalon') {
        tallaAsignada = item.talla_pantalon || parsed.pantalon || 'M';
      } else if (comp.rol === 'gorro') {
        tallaAsignada = 'Unitalla';
      } else {
        tallaAsignada = item.talla || 'Unitalla';
      }
    }

    return {
      ...comp,
      tallaAsignada: (tallaAsignada || 'M').trim().toUpperCase(),
      cantidad: (comp.cantidad || 1) * (Number(item.cant) || 1),
      estado_prenda: existingComp?.estado_prenda || comp.estado_prenda || defaultEstado
    };
  });
}

// Enriquecer una partida (NoteItem) con la información de match del catálogo y desglose de conjuntos
export function enrichItemWithCatalogMatch(
  item: NoteItem,
  catalog: CatalogProduct[] = INITIAL_PRODUCTS_CATALOG
): NoteItem {
  const parsedTallas = parseTallasConjunto(item.talla, item.talla_filipina, item.talla_pantalon);
  const baseTallaFil = item.talla_filipina || parsedTallas.filipina;
  const baseTallaPant = item.talla_pantalon || parsedTallas.pantalon;

  // Si ya tiene una acción manual del usuario o coincidencia previa respetarla
  if (item.matchAction === 'use_existing' && item.matchedProductId) {
    const existingProd = catalog.find(p => p.id === item.matchedProductId);
    const esConj = existingProd?.tipo_producto === 'CONJUNTO' || (existingProd?.componentes && existingProd.componentes.length > 0) || normalizeConcept(item.concepto).includes('conjunto') || Boolean(item.esConjunto);
    const componentes = esConj ? desglosarComponentesConjunto(item, existingProd) : item.componentesDesglosados;
    return {
      ...item,
      talla_filipina: esConj ? baseTallaFil : item.talla_filipina,
      talla_pantalon: esConj ? baseTallaPant : item.talla_pantalon,
      esConjunto: esConj,
      componentesDesglosados: componentes
    };
  }
  if (item.matchAction === 'create_new') {
    const esConj = normalizeConcept(item.concepto).includes('conjunto') || Boolean(item.esConjunto);
    return {
      ...item,
      talla_filipina: esConj ? baseTallaFil : item.talla_filipina,
      talla_pantalon: esConj ? baseTallaPant : item.talla_pantalon,
      esConjunto: esConj,
      componentesDesglosados: esConj ? desglosarComponentesConjunto(item) : item.componentesDesglosados
    };
  }

  const match = findBestProductMatch(item.concepto || item.prenda || '', item.prenda, catalog);

  if (match.isExactMatch && match.bestProduct) {
    const esConj = match.bestProduct.tipo_producto === 'CONJUNTO' || (match.bestProduct.componentes && match.bestProduct.componentes.length > 0) || normalizeConcept(item.concepto).includes('conjunto');
    return {
      ...item,
      talla_filipina: esConj ? baseTallaFil : item.talla_filipina,
      talla_pantalon: esConj ? baseTallaPant : item.talla_pantalon,
      matchedProductId: match.bestProduct.id,
      matchedProductName: match.bestProduct.nombre,
      suggestedProductId: match.bestProduct.id,
      suggestedProductName: match.bestProduct.nombre,
      similarityScore: 1.0,
      isExactMatch: true,
      matchAction: 'use_existing',
      esConjunto: esConj,
      componentesDesglosados: esConj ? desglosarComponentesConjunto(item, match.bestProduct) : undefined
    };
  }

  if (match.bestProduct) {
    const esConj = match.bestProduct.tipo_producto === 'CONJUNTO' || (match.bestProduct.componentes && match.bestProduct.componentes.length > 0) || normalizeConcept(item.concepto).includes('conjunto');
    return {
      ...item,
      talla_filipina: esConj ? baseTallaFil : item.talla_filipina,
      talla_pantalon: esConj ? baseTallaPant : item.talla_pantalon,
      suggestedProductId: match.bestProduct.id,
      suggestedProductName: match.bestProduct.nombre,
      matchedProductId: undefined,
      matchedProductName: undefined,
      similarityScore: match.score,
      isExactMatch: false,
      matchAction: undefined, // Pendiente de que el usuario elija
      esConjunto: esConj,
      componentesDesglosados: esConj ? desglosarComponentesConjunto(item, match.bestProduct) : undefined
    };
  }

  const esConj = normalizeConcept(item.concepto).includes('conjunto');
  return {
    ...item,
    talla_filipina: esConj ? baseTallaFil : item.talla_filipina,
    talla_pantalon: esConj ? baseTallaPant : item.talla_pantalon,
    similarityScore: 0,
    isExactMatch: false,
    matchAction: undefined,
    esConjunto: esConj,
    componentesDesglosados: esConj ? desglosarComponentesConjunto(item) : undefined
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
    const products: CatalogProduct[] = snap.docs
      .filter(d => d.id !== 'placeholder-product')
      .map(docSnap => {
        const d = docSnap.data();
        return {
          id: docSnap.id,
          nombre: d.nombre || d.nombre_producto || 'Producto sin nombre',
          nombre_producto: d.nombre_producto || d.nombre || '',
          codigo_producto: d.codigo_producto || '',
          codigo_barras: d.codigo_barras || d.barcode || '',
          prenda: d.prenda || d.tipo_prenda || '',
          tipo_prenda: d.tipo_prenda || d.prenda || '',
          tipo_producto: d.tipo_producto || (d.componentes && d.componentes.length > 0 ? 'CONJUNTO' : 'PRENDA_SIMPLE'),
          modelo: d.modelo || '',
          variante: d.variante || '',
          genero: d.genero || 'Unisex',
          tallas_disponibles: d.tallas_disponibles || [],
          tipo_tela: d.tipo_tela || '',
          color_tela: d.color_tela || '',
          precio: Number(d.precio || d.precioBase) || 0,
          sku_base: d.sku_base || '',
          ramo: d.ramo || '',
          escuela: d.escuela || '',
          descripcion: d.descripcion || '',
          esPropio: d.esPropio ?? true,
          componentes: d.componentes || []
        };
      });
    return products;
  } catch (err) {
    console.warn("Aviso al consultar productos de Firestore, usando catálogo base:", err);
    return INITIAL_PRODUCTS_CATALOG;
  }
}

// Registrar un nuevo producto en la colección 'products' evitando duplicados
export async function createNewProductInSoftwareImperia(
  productData: Partial<CatalogProduct>
): Promise<CatalogProduct> {
  const cleanName = (productData.nombre || 'Nuevo Producto').trim();
  const existingSnap = await getDocs(collection(db, 'products'));
  const normTarget = normalizeConcept(cleanName);
  const existing = existingSnap.docs.find(d => normalizeConcept(d.data().nombre || '') === normTarget);
  if (existing) {
    const ed = existing.data();
    return { id: existing.id, ...ed } as CatalogProduct;
  }

  const skuBase = (productData.sku_base || `PRAGO-${cleanName.slice(0, 8).toUpperCase().replace(/[^A-Z0-9]/g, '')}`).trim();
  const prenda = (productData.prenda || productData.tipo_prenda || 'PRENDA').toUpperCase();
  const genero = productData.genero || 'Unisex';
  const tipoTela = productData.tipo_tela || 'Tergal / Microfibra';
  const colorTela = productData.color_tela || 'Blanco';
  const newProductDoc = {
    codigo_producto: productData.codigo_producto || `PRG-${skuBase.slice(0, 8)}`,
    sku_base: skuBase,
    sku: skuBase,
    codigo_barras: productData.codigo_barras || '',
    tipo_producto: productData.tipo_producto || 'PRENDA_SIMPLE',
    nombre: cleanName,
    nombre_producto: cleanName,
    prenda,
    tipo_prenda: prenda,
    modelo: productData.modelo || 'Estándar',
    variante: `${tipoTela} • ${colorTela} • ${genero}`,
    genero,
    tallas_disponibles: productData.tallas_disponibles || ['XS', 'S', 'M', 'L', 'XL'],
    tipo_tela: tipoTela,
    color_tela: colorTela,
    precio: Number(productData.precio) || 0,
    ramo: productData.ramo || 'GENERAL',
    escuela: productData.escuela || '',
    descripcion: productData.descripcion || `Concepto generado desde Capturista IA`,
    marca: 'PRAGO',
    esPropio: true,
    origen: 'Capturista IA WebApp',
    createdAt: serverTimestamp()
  };

  const docRef = await addDoc(collection(db, 'products'), newProductDoc);
  return {
    id: docRef.id,
    ...newProductDoc
  } as CatalogProduct;
}
