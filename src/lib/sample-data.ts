import { NoteData } from './types';

export const SAMPLE_NOTES: NoteData[] = [
  {
    id: "real-1",
    folio: "7951",
    fecha_emision: "01/09/2026",
    metodo_pago: "TARJETA_CREDITO",
    cliente: "Monserrat Gómez Nava",
    telefono: "2292306838",
    rfc: "",
    direccion: "",
    imageUrl: "/samples/real/caso_real_1.jpg",
    items: [
      {
        id: "item-1",
        ped_apa_ent: "P",
        cant: 1,
        concepto: "Conjunto Qx. Blanco dama CEPAV sobre medida ~ XL",
        prenda: "Conjunto Quirúrgico",
        corte: "CEPAV sobre medida",
        genero: "Dama",
        talla: "XL",
        notas: "CEPAV sobre medida ~ XL, Pagado",
        p_unit: 865.0,
        importe: 865.0
      }
    ],
    fecha_entrega: "22/09/2026",
    anticipo: 865.0,
    resta: 0.0,
    total: 865.0,
    motor: "IA_MULTIMODAL",
    validacion_financiera: {
      cuadre_ok: true,
      diferencia: 0.0,
      suma_importes: 865.0,
      total_coincide: true
    },
    cuota_creditos: {
      usados_esta_hora: 1,
      limite_por_hora: 500,
      disponibles: 499,
      total_acumulado: 1
    }
  },
  {
    id: "real-2",
    folio: "7953",
    fecha_emision: "02/09/2026",
    metodo_pago: "TARJETA_CREDITO",
    cliente: "Sara Molina Prieto",
    telefono: "2294477760",
    rfc: "",
    direccion: "",
    imageUrl: "/samples/real/caso_real_2.jpg",
    items: [
      {
        id: "item-1",
        ped_apa_ent: "P",
        cant: 1,
        concepto: "Pantalón mixto marino, tiro alto sobre medida ~ 36",
        prenda: "Pantalón",
        corte: "Tiro alto",
        genero: "Dama",
        talla: "36",
        notas: "Marino, tiro alto sobre medida ~ 36",
        p_unit: 425.0,
        importe: 425.0
      }
    ],
    fecha_entrega: "23/09/2026",
    anticipo: 225.0,
    resta: 200.0,
    total: 425.0,
    motor: "IA_MULTIMODAL",
    validacion_financiera: {
      cuadre_ok: true,
      diferencia: 0.0,
      suma_importes: 425.0,
      total_coincide: true
    },
    cuota_creditos: {
      usados_esta_hora: 2,
      limite_por_hora: 500,
      disponibles: 498,
      total_acumulado: 2
    }
  },
  {
    id: "real-3",
    folio: "7954",
    fecha_emision: "02/09/2026",
    metodo_pago: "TARJETA_DEBITO",
    cliente: "Enid Quino",
    telefono: "2291091573",
    rfc: "",
    direccion: "",
    imageUrl: "/samples/real/caso_real_3.jpg",
    items: [
      {
        id: "item-1",
        ped_apa_ent: "P",
        cant: 1,
        concepto: "Falda CVC T-14",
        prenda: "Falda",
        corte: "CVC",
        genero: "Dama",
        talla: "14",
        notas: "Pagado",
        p_unit: 385.0,
        importe: 385.0
      }
    ],
    fecha_entrega: "23/09/2026",
    anticipo: 385.0,
    resta: 0.0,
    total: 385.0,
    motor: "IA_MULTIMODAL",
    validacion_financiera: {
      cuadre_ok: true,
      diferencia: 0.0,
      suma_importes: 385.0,
      total_coincide: true
    },
    cuota_creditos: {
      usados_esta_hora: 3,
      limite_por_hora: 500,
      disponibles: 497,
      total_acumulado: 3
    }
  },
  {
    id: "real-4",
    folio: "7901",
    fecha_emision: "06/07/2026",
    metodo_pago: "EFECTIVO",
    cliente: "Frida Farías Cabrera",
    telefono: "2295309979",
    rfc: "",
    direccion: "",
    imageUrl: "/samples/real/caso_real_4.jpg",
    items: [
      {
        id: "item-1",
        ped_apa_ent: "P",
        cant: 1,
        concepto: "Conjunto Clínico CV Enfra dama F: ~36 P: ~36",
        prenda: "Conjunto Clínico",
        corte: "Cuello V",
        genero: "Dama",
        talla: "",
        talla_filipina: "36",
        talla_pantalon: "36",
        notas: "Enfra dama",
        p_unit: 775.0,
        importe: 775.0
      },
      {
        id: "item-2",
        ped_apa_ent: "P",
        cant: 1,
        concepto: "Conjunto Qx. CV Enfra dama F: ~M P: ~M",
        prenda: "Conjunto Quirúrgico",
        corte: "Cuello V",
        genero: "Dama",
        talla: "",
        talla_filipina: "M",
        talla_pantalon: "M",
        notas: "Enfra dama",
        p_unit: 645.0,
        importe: 645.0
      },
      {
        id: "item-3",
        ped_apa_ent: "E",
        cant: 1,
        concepto: "Cofia lisa M",
        prenda: "Cofia",
        corte: "Lisa",
        genero: "Unisex",
        talla: "M",
        notas: "Entregado",
        p_unit: 180.0,
        importe: 180.0
      }
    ],
    fecha_entrega: "20/07/2026",
    anticipo: 1600.0,
    resta: 0.0,
    total: 1600.0,
    motor: "SUPERIOR_ADVERSARIAL_ENSEMBLE",
    validacion_financiera: {
      cuadre_ok: true,
      diferencia: 0.0,
      suma_importes: 1600.0,
      total_coincide: true
    },
    auditoria_adversarial: {
      pase_verificacion: "Completado con éxito (Prueba 4/5)",
      anomalias_detectadas: 2,
      registro_correcciones: [
        { tipo: "TALLA_DIFERENCIADA_DETECTADA", detalle: "Fila 1: Talla Filipina 36 / Pantalón 36 separada con precisión", fila: 0 },
        { tipo: "TALLA_DIFERENCIADA_DETECTADA", detalle: "Fila 2: Talla Filipina M / Pantalón M separada con precisión", fila: 1 }
      ]
    },
    cuota_creditos: {
      usados_esta_hora: 4,
      limite_por_hora: 500,
      disponibles: 496,
      total_acumulado: 4
    }
  },
  {
    id: "real-5",
    folio: "7902",
    fecha_emision: "07/07/2026",
    metodo_pago: "EFECTIVO",
    cliente: "Ana Cristina Ortega",
    telefono: "2295507808",
    rfc: "",
    direccion: "",
    imageUrl: "/samples/real/caso_real_5.jpg",
    items: [
      {
        id: "item-1",
        ped_apa_ent: "P",
        cant: 1,
        concepto: "Conjunto Clínico CV Enfra dama F: ~34 P: ~34",
        prenda: "Conjunto Clínico",
        corte: "Cuello V",
        genero: "Dama",
        talla: "",
        talla_filipina: "34",
        talla_pantalon: "34",
        notas: "Enfra dama",
        p_unit: 775.0,
        importe: 775.0
      },
      {
        id: "item-2",
        ped_apa_ent: "E",
        cant: 1,
        concepto: "Cofia lisa M",
        prenda: "Cofia",
        corte: "Lisa",
        genero: "Unisex",
        talla: "M",
        notas: "Entregado",
        p_unit: 180.0,
        importe: 180.0
      }
    ],
    fecha_entrega: "15/07/2026",
    anticipo: 600.0,
    resta: 355.0,
    total: 955.0,
    motor: "SUPERIOR_ADVERSARIAL_ENSEMBLE",
    validacion_financiera: {
      cuadre_ok: true,
      diferencia: 0.0,
      suma_importes: 955.0,
      total_coincide: true
    },
    auditoria_adversarial: {
      pase_verificacion: "Completado con éxito (Prueba 5/5)",
      anomalias_detectadas: 1,
      registro_correcciones: [
        { tipo: "TALLA_DIFERENCIADA_DETECTADA", detalle: "Fila 1: Talla Filipina 34 / Pantalón 34 separada con precisión", fila: 0 }
      ]
    },
    cuota_creditos: {
      usados_esta_hora: 5,
      limite_por_hora: 500,
      disponibles: 495,
      total_acumulado: 5
    }
  }
];
