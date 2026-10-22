import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, collection, addDoc, doc, setDoc, serverTimestamp } from 'firebase/firestore';

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
