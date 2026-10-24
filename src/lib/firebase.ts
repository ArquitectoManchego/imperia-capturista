import { initializeApp, getApps, getApp } from 'firebase/app';
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
  orderBy, 
  limit 
} from 'firebase/firestore';
import { NoteData, NoteItem, ItemStatus, PaymentMethod } from './types';

export const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyBW3nlhDa6_As07gcxqS98LzE_4LIFihS8",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "html-dashboard-integrator.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "html-dashboard-integrator",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "html-dashboard-integrator.appspot.com",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "1084644965062",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:1084644965062:web:6e1871286c1527e0d635c7"
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
export const db = getFirestore(app);

export interface SyncResult {
  pedidoId: string;
  clienteId?: string;
  success: boolean;
  message: string;
}

export async function syncOrderToSoftwareImperia(orderData: any): Promise<SyncResult> {
  try {
    // 1. Guardar o actualizar datos de cliente si existen
    let clienteId = "cliente_directo";
    if (orderData.cliente && orderData.cliente.trim()) {
      const clientDoc = {
        nombre: orderData.cliente.trim(),
        telefono: orderData.telefono || "",
        tags: ["Captura Nota Remision"],
        isUser: false,
        datosFiscales: {
          rfc: orderData.rfc || "",
          direccion: orderData.direccion || ""
        },
        updatedAt: serverTimestamp()
      };
      const clientRef = await addDoc(collection(db, "clientes"), clientDoc);
      clienteId = clientRef.id;
    }

    // 2. Normalizar partidas para la colección 'pedidos' de Software Imperia
    const itemsFormatted = (orderData.items || []).map((it: any, index: number) => ({
      productId: `prod_manual_${index}`,
      variantId: `var_${it.talla || 'STD'}`,
      sku: it.clave || (it.talla_filipina ? `FIL-${it.talla_filipina}-PANT-${it.talla_pantalon}` : `IMP-${it.prenda || 'GEN'}-${it.talla || 'U'}`),
      nombre: it.concepto || `${it.prenda || 'Prenda'} ${it.talla || ''}`.trim(),
      cantidad: Number(it.cant) || 1,
      precioUnitario: Number(it.p_unit) || 0,
      importe: Number(it.importe) || 0,
      estadoPartida: it.ped_apa_ent || 'P',
      prenda: it.prenda || '',
      corte: it.corte || '',
      genero: it.genero || '',
      talla: it.talla || (it.talla_filipina ? `F:${it.talla_filipina} P:${it.talla_pantalon}` : ''),
      notas: it.notas || ''
    }));

    // 3. Documento del Pedido
    const pedidoDoc = {
      numeroNota: String(orderData.folio || "SIN_FOLIO"),
      clienteId: clienteId,
      clienteNombre: orderData.cliente || "Cliente Mostrador",
      telefono: orderData.telefono || "",
      fechaPedido: serverTimestamp(),
      fechaEntregaTexto: orderData.fecha_entrega || "",
      metodoPago: orderData.metodo_pago || "NO_ESPECIFICADO",
      tipo_pedido: orderData.items?.some((i: any) => i.ped_apa_ent === 'B') ? 'bordado' : 'tienda',
      items: itemsFormatted,
      total: Number(orderData.total) || 0,
      montoPagado: Number(orderData.anticipo) || 0,
      saldoPendiente: Number(orderData.resta) || 0,
      pagado: Number(orderData.resta) <= 0.01,
      estado_produccion: 'Pendiente',
      origenCaptura: 'App Capturista Imperia',
      motorAnalisis: orderData.motor || 'IA_MULTIMODAL',
      createdAt: serverTimestamp()
    };

    const docRef = await addDoc(collection(db, "pedidos"), pedidoDoc);
    return {
      pedidoId: docRef.id,
      clienteId: clienteId,
      success: true,
      message: `Pedido #${orderData.folio} subido con éxito a Software Imperia (ID: ${docRef.id})`
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
    const q = query(collection(db, "pedidos"), orderBy("createdAt", "desc"), limit(100));
    let snapshot;
    try {
      snapshot = await getDocs(q);
    } catch {
      // Si el índice orderBy aún no está listo, hacer fetch directo de la colección
      snapshot = await getDocs(collection(db, "pedidos"));
    }

    const notes: NoteData[] = [];
    snapshot.forEach(docSnap => {
      const d = docSnap.data();
      const items: NoteItem[] = (d.items || []).map((it: any, idx: number) => ({
        id: it.productId || `item-${docSnap.id}-${idx}`,
        ped_apa_ent: (it.estadoPartida || 'P') as ItemStatus,
        cant: Number(it.cantidad) || 1,
        clave: it.sku || undefined,
        concepto: it.nombre || `${it.prenda || 'Prenda'} ${it.talla || ''}`.trim(),
        prenda: it.prenda || 'Prenda',
        corte: it.corte || '',
        genero: it.genero || 'Dama',
        talla: it.talla || '',
        talla_filipina: it.talla_filipina,
        talla_pantalon: it.talla_pantalon,
        notas: it.notas || '',
        p_unit: Number(it.precioUnitario) || 0,
        importe: Number(it.importe) || 0
      }));

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
        archivada: Boolean(d.archivada),
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

