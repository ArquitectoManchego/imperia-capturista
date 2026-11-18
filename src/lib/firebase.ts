import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, signInAnonymously } from 'firebase/auth';
import {
  getFirestore,
  collection,
  addDoc,
  doc,
  setDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  query,
  where,
  orderBy,
  limit
} from 'firebase/firestore';
import { NoteData, NoteItem, ItemStatus, EstadoPrenda, PaymentMethod } from './types';

export const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyDt5BgYMgdK1yXEWuo0QgBB7yN9pK1WqlI",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "html-dashboard-integrator.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "html-dashboard-integrator",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "html-dashboard-integrator.firebasestorage.app",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "845963956236",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:845963956236:web:aa508b14941fa55f355e29"
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
export const auth = getAuth(app);
export const db = getFirestore(app);

let authReadyPromise: Promise<void> | null = null;
export async function ensureAnonymousAuth(): Promise<void> {
  if (typeof window === 'undefined') return;
  if (auth.currentUser) return;
  if (!authReadyPromise) {
    authReadyPromise = signInAnonymously(auth)
      .then(() => undefined)
      .catch(() => undefined);
  }
  return authReadyPromise;
}

export function statusCodeToEstadoPrenda(code?: ItemStatus | string): EstadoPrenda {
  const u = String(code || 'P').toUpperCase();
  if (u === 'E' || u === 'ENTREGADA') return 'entregada';
  if (u === 'A' || u === 'APARTADA') return 'apartada';
  if (u === 'F' || u === 'FABRICADA') return 'fabricada';
  if (u === 'B' || u === 'EN_BORDADO') return 'en_bordado';
  return 'por_fabricar';
}

export function estadoPrendaToStatusCode(ep?: string): ItemStatus {
  const u = String(ep || 'por_fabricar').toLowerCase();
  if (u === 'entregada' || u === 'e') return 'E';
  if (u === 'apartada' || u === 'a') return 'A';
  if (u === 'fabricada' || u === 'f') return 'F';
  if (u === 'en_bordado' || u === 'b') return 'B';
  return 'P';
}

const normStr = (s: string) =>
  String(s || '').trim().toUpperCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

export interface SyncResult {
  pedidoId: string;
  clienteId?: string;
  success: boolean;
  message: string;
}

export async function syncOrderToSoftwareImperia(orderData: any): Promise<SyncResult> {
  try {
    await ensureAnonymousAuth();

    // 1. Upsert de cliente evitando duplicados en colección unificada 'clientes'
    let clienteId = "cliente_directo";
    const clientName = (orderData.cliente || '').trim();
    const clientPhone = (orderData.telefono || '').trim();
    if (clientName) {
      const cliSnap = await getDocs(collection(db, "clientes"));
      const cleanPhone = clientPhone.replace(/\D/g, '');
      const normName = normStr(clientName);
      const existingCli = cliSnap.docs.find(d => {
        const dd = d.data();
        const dp = String(dd.telefono || '').replace(/\D/g, '');
        return (cleanPhone.length >= 8 && dp === cleanPhone) || normStr(dd.nombre) === normName;
      });

      const clientDoc: Record<string, any> = {
        nombre: clientName,
        telefono: clientPhone,
        tags: ["Capturista"],
        isUser: false,
        datosFiscales: {
          rfc: orderData.rfc || "",
          direccion: orderData.direccion || ""
        },
        updatedAt: serverTimestamp()
      };
      if (existingCli) {
        clienteId = existingCli.id;
        await updateDoc(doc(db, "clientes", clienteId), clientDoc);
      } else {
        const clientRef = await addDoc(collection(db, "clientes"), {
          ...clientDoc,
          createdAt: serverTimestamp()
        });
        clienteId = clientRef.id;
      }
    }

    // 2. Cargar catálogo unificado de 'products' para enlazar los 12 campos PRAGO y evitar duplicados
    const prodSnap = await getDocs(collection(db, 'products'));
    const existingProducts = prodSnap.docs.map(d => ({ id: d.id, ...(d.data() as any) }));

    const itemsFormatted: any[] = [];
    for (let index = 0; index < (orderData.items || []).length; index++) {
      const it = orderData.items[index];
      let matchedProd = it.matchedProductId
        ? existingProducts.find(p => p.id === it.matchedProductId)
        : undefined;

      if (!matchedProd && (it.matchedProductName || it.concepto)) {
        const normConcept = normStr(it.matchedProductName || it.concepto);
        matchedProd = existingProducts.find(p => normStr(p.nombre) === normConcept);
      }

function generateDeterministicBarcode(seedStr: string): string {
  let hash = 0;
  for (let i = 0; i < seedStr.length; i++) {
    hash = (hash * 31 + seedStr.charCodeAt(i)) & 0xffffffff;
  }
  const positive = Math.abs(hash) % 10000;
  const code12 = `20000100${String(positive).padStart(4, '0')}`;
  let sum = 0;
  for (let i = 0; i < 12; i++) {
    const digit = parseInt(code12[i], 10);
    sum += (i % 2 === 0) ? digit : digit * 3;
  }
  const check = (10 - (sum % 10)) % 10;
  return `${code12}${check}`;
}

      if (it.matchAction === 'create_new' && !matchedProd) {
        try {
          const newName = (it.concepto || 'Nuevo Producto').trim();
          const isConjunto = it.esConjunto || newName.toUpperCase().includes('CONJUNTO') || (it.prenda && it.prenda.toUpperCase().includes('CONJUNTO'));
          const prenda = (it.prenda || (isConjunto ? 'CONJUNTO' : 'PRENDA')).toUpperCase();
          const cleanName = newName.toUpperCase().replace(/[^A-Z0-9]/g, '');
          const skuBase = isConjunto ? `CONJ-${cleanName.slice(0, 10)}` : `PRAGO-${cleanName.slice(0, 10)}`;
          const codProd = `PRG-${skuBase.slice(0, 10)}`;
          const barcode = generateDeterministicBarcode(newName + Date.now().toString());
          const tallasStd = ['XXS', 'XS', 'S', 'M', 'L', 'XL', 'XXL', '28', '30', '32', '34', '36', '38', '40', '42', '44'];
          if (it.talla && !tallasStd.includes(it.talla)) {
            tallasStd.push(it.talla);
          }

          const newProductDoc = {
            codigo_producto: codProd,
            sku_base: skuBase,
            sku: skuBase,
            codigo_barras: barcode,
            barcode: barcode,
            tipo_producto: isConjunto ? 'CONJUNTO' : 'PRENDA_SIMPLE',
            nombre: newName,
            nombre_producto: newName,
            prenda,
            tipo_prenda: prenda,
            modelo: it.corte || (isConjunto ? 'Conjunto Clínico' : 'Estándar'),
            variante: `${it.tipo_tela || 'Tergal'} • ${it.color_tela || 'Institucional'} • ${it.genero || 'Unisex'}`,
            genero: it.genero || 'Unisex',
            tallas_disponibles: tallasStd,
            tipo_tela: it.tipo_tela || 'Tergal',
            color_tela: it.color_tela || 'Blanco',
            telas_disponibles: [it.tipo_tela || 'Tergal'],
            colores_disponibles: [it.color_tela || 'Blanco'],
            precio: Number(it.p_unit) || 0,
            ramo: 'MEDICINA',
            escuela: newName.toUpperCase().includes('UO') ? 'UO' : (newName.toUpperCase().includes('UV') ? 'UV' : ''),
            descripcion: `Concepto generado desde Capturista IA (Nota #${orderData.folio})`,
            marca: 'PRAGO',
            fabricante: 'PRAGO',
            proveedor: 'PRAGO',
            esPropio: true,
            activo: true,
            modo_fabricacion: 'HIBRIDO',
            origen: 'Capturista IA WebApp',
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
          };
          const newDocRef = await addDoc(collection(db, 'products'), newProductDoc);
          matchedProd = { id: newDocRef.id, ...newProductDoc };
          existingProducts.push(matchedProd);
        } catch (e) {
          console.warn("No se pudo crear producto en 'products':", e);
        }
      }

      const finalProductId = matchedProd?.id || it.matchedProductId || 'prod_manual';
      const ep: EstadoPrenda = it.estado_prenda || statusCodeToEstadoPrenda(it.ped_apa_ent || 'P');
      const tallaClean = it.talla || (it.talla_filipina ? `F:${it.talla_filipina} P:${it.talla_pantalon}` : 'Unitalla');

      itemsFormatted.push({
        itemId: it.id || `item_${index + 1}`,
        productId: finalProductId,
        variantId: `var_${tallaClean}`,
        codigo_producto: matchedProd?.codigo_producto || it.codigo_producto || '',
        sku: matchedProd?.sku_base || it.clave || `IMP-${it.prenda || 'GEN'}-${tallaClean}`,
        codigo_barras: matchedProd?.codigo_barras || it.codigo_barras || '',
        nombre: matchedProd?.nombre || it.matchedProductName || it.concepto || `${it.prenda || 'Prenda'} ${tallaClean}`.trim(),
        conceptoOriginal: it.concepto || '',
        tipo_producto: matchedProd?.tipo_producto || 'PRENDA_SIMPLE',
        tipo_prenda: matchedProd?.tipo_prenda || it.prenda || 'PRENDA',
        modelo: matchedProd?.modelo || it.corte || '',
        genero: it.genero || matchedProd?.genero || 'Unisex',
        talla: tallaClean,
        tipo_tela: it.tipo_tela || matchedProd?.tipo_tela || '',
        color_tela: it.color_tela || matchedProd?.color_tela || '',
        cantidad: Number(it.cant) || 1,
        precioUnitario: Number(it.p_unit) || 0,
        importe: Number(it.importe) || 0,
        estado_prenda: ep,
        estadoPartida: estadoPrendaToStatusCode(ep),
        prenda: it.prenda || '',
        corte: it.corte || '',
        notas: it.notas || '',
        isExactMatch: Boolean(it.isExactMatch || matchedProd),
        matchAction: it.matchAction || (matchedProd ? 'use_existing' : 'manual'),
        esConjunto: Boolean(it.esConjunto || matchedProd?.tipo_producto === 'CONJUNTO'),
        desglose_componentes: it.componentesDesglosados || [],
        tracking_taller: {
          yaPedido: true,
          fabricado: ep === 'fabricada' || ep === 'entregada',
          listoEnTienda: ep === 'fabricada' || ep === 'apartada' || ep === 'entregada',
          entregado: ep === 'entregada'
        }
      });
    }

    // 3. Upsert del pedido evitando duplicar folios cuando se presiona "Actualizar en BD"
    const folioStr = String(orderData.folio || "SIN_FOLIO").trim();
    const allDelivered = itemsFormatted.length > 0 && itemsFormatted.every(i => i.estado_prenda === 'entregada');

    let targetPedidoId: string | undefined = orderData.firestoreId || (orderData.syncedToDb && orderData.id && !String(orderData.id).startsWith('local') ? String(orderData.id) : undefined);
    if (!targetPedidoId && folioStr !== 'SIN_FOLIO') {
      const dupSnap = await getDocs(
        query(collection(db, "pedidos"), where("numeroNota", "==", folioStr))
      );
      const capMatch = dupSnap.docs.find(d => d.data().origenCaptura === 'App Capturista Imperia' || d.data().serie === 'CAPTURISTA');
      if (capMatch) targetPedidoId = capMatch.id;
    }

    const pedidoDoc: Record<string, any> = {
      numeroNota: folioStr,
      folioUnico: `CAP-${folioStr}`,
      serie: 'CAPTURISTA',
      clienteId: clienteId,
      clienteNombre: clientName || "Cliente Mostrador",
      telefono: clientPhone,
      fechaEntregaTexto: orderData.fecha_entrega || "",
      metodoPago: orderData.metodo_pago || "NO_ESPECIFICADO",
      tipo_pedido: itemsFormatted.some(i => i.estado_prenda === 'en_bordado') ? 'bordado' : 'tienda',
      items: itemsFormatted,
      total: Number(orderData.total) || 0,
      montoPagado: Number(orderData.anticipo) || 0,
      saldoPendiente: Number(orderData.resta) || 0,
      pagado: Number(orderData.resta) <= 0.01,
      estado: allDelivered ? 'Completado' : 'Pendiente',
      estado_produccion: allDelivered ? 'Entregado' : 'Pendiente',
      origenCaptura: 'App Capturista Imperia',
      motorAnalisis: orderData.motor || 'IA_MULTIMODAL',
      updatedAt: serverTimestamp()
    };

    if (targetPedidoId) {
      await updateDoc(doc(db, "pedidos", targetPedidoId), pedidoDoc);
    } else {
      const created = await addDoc(collection(db, "pedidos"), {
        ...pedidoDoc,
        fechaPedido: serverTimestamp(),
        fecha: serverTimestamp(),
        createdAt: serverTimestamp(),
        archivado: false
      });
      targetPedidoId = created.id;
    }

    // Sincronizar ordenes_taller por prenda (desglosando piezas individuales si es un conjunto/kit)
    for (let idx = 0; idx < itemsFormatted.length; idx++) {
      const it = itemsFormatted[idx];

      if (it.esConjunto && it.desglose_componentes && it.desglose_componentes.length > 0) {
        // Para taller y costurera: desglose de prendas individuales (Filipina, Pantalón, Gorro)
        for (let cIdx = 0; cIdx < it.desglose_componentes.length; cIdx++) {
          const comp = it.desglose_componentes[cIdx];
          const compEstado = comp.estado_prenda || it.estado_prenda;
          const tallerCompId = `${targetPedidoId}_${it.itemId}_${comp.rol || cIdx}`.replace(/[^a-zA-Z0-9_\-]/g, '_');
          const tallerRef = doc(db, "ordenes_taller", tallerCompId);

          if (compEstado === 'por_fabricar' || compEstado === 'en_bordado') {
            await setDoc(tallerRef, {
              id: tallerCompId,
              pedidoId: targetPedidoId,
              itemId: `${it.itemId}_${comp.rol || cIdx}`,
              conjuntoOrigen: it.nombre,
              numeroNota: folioStr,
              folioUnico: `CAP-${folioStr}`,
              serie: 'CAPTURISTA',
              clienteId,
              clienteNombre: clientName || "Cliente Mostrador",
              productId: comp.productId || it.productId,
              sku: it.sku,
              codigo_producto: it.codigo_producto,
              codigo_barras: it.codigo_barras,
              nombre_producto: comp.productNombre || it.nombre,
              tipo_prenda: comp.prenda || it.tipo_prenda,
              modelo: it.modelo,
              genero: comp.genero || it.genero,
              talla: comp.tallaAsignada || 'M',
              tipo_tela: it.tipo_tela,
              color_tela: it.color_tela,
              cantidad: comp.cantidad || it.cantidad,
              estado_prenda: compEstado,
              fechaEntregaTexto: orderData.fecha_entrega || '',
              updatedAt: serverTimestamp()
            }, { merge: true });
          } else {
            await deleteDoc(tallerRef).catch(() => {});
          }
        }
      } else {
        const tallerId = `${targetPedidoId}_${it.itemId}`.replace(/[^a-zA-Z0-9_\-]/g, '_');
        const tallerRef = doc(db, "ordenes_taller", tallerId);
        if (it.estado_prenda === 'por_fabricar' || it.estado_prenda === 'en_bordado') {
          await setDoc(tallerRef, {
            id: tallerId,
            pedidoId: targetPedidoId,
            itemId: it.itemId,
            numeroNota: folioStr,
            folioUnico: `CAP-${folioStr}`,
            serie: 'CAPTURISTA',
            clienteId,
            clienteNombre: clientName || "Cliente Mostrador",
            productId: it.productId,
            sku: it.sku,
            codigo_producto: it.codigo_producto,
            codigo_barras: it.codigo_barras,
            nombre_producto: it.nombre,
            tipo_prenda: it.tipo_prenda,
            modelo: it.modelo,
            genero: it.genero,
            talla: it.talla,
            tipo_tela: it.tipo_tela,
            color_tela: it.color_tela,
            cantidad: it.cantidad,
            estado_prenda: it.estado_prenda,
            fechaEntregaTexto: orderData.fecha_entrega || '',
            updatedAt: serverTimestamp()
          }, { merge: true });
        } else {
          await deleteDoc(tallerRef).catch(() => {});
        }
      }
    }

    return {
      pedidoId: targetPedidoId,
      clienteId,
      success: true,
      message: `Pedido #${folioStr} guardado sin duplicados (ID: ${targetPedidoId})`
    };
  } catch (err: any) {
    console.error("Error al sincronizar con Software Imperia:", err);
    return {
      pedidoId: "",
      success: false,
      message: err.message || "Error al conectar con la base de datos de Software Imperia"
    };
  }
}

export async function fetchOrdersFromSoftwareImperia(): Promise<NoteData[]> {
  try {
    await ensureAnonymousAuth();
    const q = query(collection(db, "pedidos"), orderBy("createdAt", "desc"), limit(150));
    let snapshot;
    try {
      snapshot = await getDocs(q);
    } catch {
      snapshot = await getDocs(collection(db, "pedidos"));
    }

    const notes: NoteData[] = [];
    snapshot.forEach(docSnap => {
      const d = docSnap.data();
      const items: NoteItem[] = (d.items || []).map((it: any, idx: number) => {
        const ep = statusCodeToEstadoPrenda(it.estado_prenda || it.estadoPartida || (d.estado === 'Completado' ? 'E' : 'P'));
        const code = estadoPrendaToStatusCode(ep);
        return {
          id: it.itemId || it.productId || `item-${docSnap.id}-${idx}`,
          ped_apa_ent: code,
          estado_prenda: ep,
          cant: Number(it.cantidad) || 1,
          clave: it.sku || undefined,
          codigo_producto: it.codigo_producto || undefined,
          codigo_barras: it.codigo_barras || undefined,
          concepto: it.nombre || `${it.prenda || 'Prenda'} ${it.talla || ''}`.trim(),
          prenda: it.tipo_prenda || it.prenda || 'Prenda',
          corte: it.modelo || it.corte || '',
          genero: it.genero || 'Dama',
          talla: it.talla || '',
          tipo_tela: it.tipo_tela || '',
          color_tela: it.color_tela || '',
          talla_filipina: it.talla_filipina,
          talla_pantalon: it.talla_pantalon,
          notas: it.notas || '',
          p_unit: Number(it.precioUnitario) || 0,
          importe: Number(it.importe) || 0,
          matchedProductId: it.productId && it.productId !== 'prod_manual' ? it.productId : undefined,
          matchedProductName: it.nombre || undefined,
          isExactMatch: Boolean(it.productId && it.productId !== 'prod_manual'),
          matchAction: it.productId && it.productId !== 'prod_manual' ? 'use_existing' : undefined,
          esConjunto: Boolean(it.esConjunto),
          componentesDesglosados: it.desglose_componentes || []
        };
      });

      const sumImportes = items.reduce((acc, it) => acc + (Number(it.importe) || 0), 0);
      const total = Number(d.total) || sumImportes;
      const anticipo = Number(d.montoPagado) || 0;
      const resta = Number(d.saldoPendiente) || 0;
      const diferencia = Math.round((total - anticipo - resta) * 100) / 100;

      let fechaEmision = new Date().toLocaleDateString('es-MX');
      if (d.createdAt?.toDate) {
        fechaEmision = d.createdAt.toDate().toLocaleDateString('es-MX');
      } else if (d.fechaPedido?.toDate) {
        fechaEmision = d.fechaPedido.toDate().toLocaleDateString('es-MX');
      }

      notes.push({
        id: docSnap.id,
        firestoreId: docSnap.id,
        folio: String(d.numeroNota || 'S/F'),
        fecha_emision: fechaEmision,
        metodo_pago: (d.metodoPago || 'EFECTIVO') as PaymentMethod,
        cliente: d.clienteNombre || 'Cliente Mostrador',
        telefono: d.telefono || '',
        rfc: '',
        direccion: '',
        imageUrl: d.imageUrl || undefined,
        items,
        fecha_entrega: d.fechaEntregaTexto || '',
        anticipo,
        resta,
        total,
        motor: d.motorAnalisis || 'IA_MULTIMODAL',
        syncedToDb: true,
        archivada: Boolean(d.archivada || d.archivado),
        validacion_financiera: {
          cuadre_ok: Math.abs(diferencia) < 0.05,
          diferencia,
          suma_importes: sumImportes,
          total_coincide: Math.abs(sumImportes - total) < 0.05
        },
        cuota_creditos: {
          usados_esta_hora: 1,
          limite_por_hora: 500,
          disponibles: 499,
          total_acumulado: 1
        }
      });
    });

    return notes;
  } catch (err) {
    console.error("Error al consultar pedidos en Firestore:", err);
    return [];
  }
}

export async function archiveOrderInSoftwareImperia(pedidoId: string, archivada: boolean): Promise<boolean> {
  try {
    const docRef = doc(db, "pedidos", pedidoId);
    await updateDoc(docRef, { archivada });
    return true;
  } catch (err) {
    console.error("Error al archivar en Firestore:", err);
    return false;
  }
}

export async function deleteOrderFromSoftwareImperia(pedidoId: string): Promise<boolean> {
  try {
    const docRef = doc(db, "pedidos", pedidoId);
    await deleteDoc(docRef);
    return true;
  } catch (err) {
    console.error("Error al borrar en Firestore:", err);
    return false;
  }
}

