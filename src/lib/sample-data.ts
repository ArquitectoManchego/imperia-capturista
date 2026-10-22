import { NoteData } from './types';

export const SAMPLE_NOTES: NoteData[] = [
  {
    folio: "7903",
    fecha_emision: "22/10/2026",
    metodo_pago: "EFECTIVO",
    cliente: "Dra. Claudia Mendoza Morales",
    telefono: "2291456789",
    rfc: "MEMC850412",
    direccion: "Av. Colon 1204, Reforma",
    items: [
      {
        id: "item-1",
        ped_apa_ent: "P",
        cant: 2,
        concepto: "Filipina Quirurgica Cuello V Dama Azul Marino T-34 c/bordado logo IMSS",
        prenda: "Filipina",
        corte: "Cuello V",
        genero: "Dama",
        talla: "34",
        notas: "c/bordado logo IMSS",
        p_unit: 350.0,
        importe: 700.0
      },
      {
        id: "item-2",
        ped_apa_ent: "P",
        cant: 2,
        concepto: "Pantalon Quirurgico Dama Azul Marino T-34",
        prenda: "Pantalon",
        corte: "Quirurgico",
        genero: "Dama",
        talla: "34",
        notas: "",
        p_unit: 280.0,
        importe: 560.0
      },
      {
        id: "item-3",
        ped_apa_ent: "B",
        cant: 2,
        concepto: "Bordado Nombre Dra. Claudia Mendoza",
        prenda: "Bordado",
        corte: "",
        genero: "",
        talla: "",
        notas: "Dra. Claudia Mendoza",
        p_unit: 50.0,
        importe: 100.0
      }
    ],
    fecha_entrega: "29/10/2026",
    anticipo: 800.0,
    resta: 560.0,
    total: 1360.0,
    motor: "IA_MULTIMODAL",
    validacion_financiera: {
      cuadre_ok: true,
      diferencia: 0.0,
      suma_importes: 1360.0,
      total_coincide: true
    }
  },
  {
    folio: "7904",
    fecha_emision: "22/10/2026",
    metodo_pago: "TRANSFERENCIA",
    cliente: "Dr. Roberto Alcocer",
    telefono: "2299012345",
    rfc: "AOSR800101",
    direccion: "Hospital Beneficencia Espanola",
    items: [
      {
        id: "item-1",
        ped_apa_ent: "P",
        cant: 3,
        clave: "3",
        concepto: "Bata Medica Manga Larga Caballero Blanca T-40",
        prenda: "Bata",
        corte: "Manga Larga",
        genero: "Caballero",
        talla: "40",
        notas: "Cantidad escrita en columna CLAVE corregida por regla",
        p_unit: 420.0,
        importe: 1260.0
      },
      {
        id: "item-2",
        ped_apa_ent: "B",
        cant: 3,
        clave: "3",
        concepto: "Bordado escudo Hospital y nombre Dr. Alcocer",
        prenda: "Bordado",
        corte: "",
        genero: "",
        talla: "",
        notas: "escudo Hospital y nombre Dr. Alcocer",
        p_unit: 60.0,
        importe: 180.0
      }
    ],
    fecha_entrega: "30/10/2026",
    anticipo: 1000.0,
    resta: 440.0,
    total: 1440.0,
    motor: "IA_MULTIMODAL",
    validacion_financiera: {
      cuadre_ok: true,
      diferencia: 0.0,
      suma_importes: 1440.0,
      total_coincide: true
    }
  },
  {
    folio: "7905",
    fecha_emision: "23/10/2026",
    metodo_pago: "TARJETA_DEBITO",
    cliente: "Lic. Sofia Valenzuela",
    telefono: "2293334455",
    rfc: "VASS920718",
    direccion: "Privada Jacarandas 12 Boca del Rio",
    items: [
      {
        id: "item-1",
        ped_apa_ent: "P",
        cant: 1,
        concepto: "Conjunto Quirurgico Dama F-M P-G Verde Quirurgico",
        prenda: "Quirurgico",
        corte: "Conjunto",
        genero: "Dama",
        talla: "",
        talla_filipina: "M",
        talla_pantalon: "G",
        notas: "Verde Quirurgico | P.UNIT inferido de IMPORTE",
        p_unit: 650.0,
        importe: 650.0
      },
      {
        id: "item-2",
        ped_apa_ent: "A",
        cant: 1,
        concepto: "Filipina Medica Estampada Pediatria T-M",
        prenda: "Filipina",
        corte: "Estampada Pediatria",
        genero: "Dama",
        talla: "M",
        notas: "",
        p_unit: 380.0,
        importe: 380.0
      }
    ],
    fecha_entrega: "26/10/2026",
    anticipo: 500.0,
    resta: 530.0,
    total: 1030.0,
    motor: "IA_MULTIMODAL",
    validacion_financiera: {
      cuadre_ok: true,
      diferencia: 0.0,
      suma_importes: 1030.0,
      total_coincide: true
    }
  },
  {
    folio: "7906",
    fecha_emision: "23/10/2026",
    metodo_pago: "EFECTIVO",
    cliente: "Clinica Dental Sonrisas (Dra. Arantza)",
    telefono: "2297788990",
    rfc: "",
    direccion: "Paseo Jardin 45",
    items: [
      {
        id: "item-1",
        ped_apa_ent: "B",
        cant: 4,
        concepto: "Prenda de cliente - dejo 4 filipinas bordar logo pecho izq",
        prenda: "Bordado",
        corte: "",
        genero: "",
        talla: "",
        notas: "Prenda de cliente - dejo 4 filipinas bordar logo pecho izq",
        p_unit: 65.0,
        importe: 260.0
      }
    ],
    fecha_entrega: "25/10/2026 5:00 pm",
    anticipo: 260.0,
    resta: 0.0,
    total: 260.0,
    motor: "IA_MULTIMODAL",
    validacion_financiera: {
      cuadre_ok: true,
      diferencia: 0.0,
      suma_importes: 260.0,
      total_coincide: true
    }
  },
  {
    folio: "7907",
    fecha_emision: "24/10/2026",
    metodo_pago: "TRANSFERENCIA",
    cliente: "Instituto Cardiovascular Veracruzano",
    telefono: "2299887766",
    rfc: "ICV150320AB1",
    direccion: "Zaragoza 890, Centro",
    items: [
      {
        id: "item-1",
        ped_apa_ent: "P",
        cant: 5,
        concepto: "Filipina Quirurgica Unisex Cuello V Azul Real T-L",
        prenda: "Filipina",
        corte: "Cuello V",
        genero: "Unisex",
        talla: "L",
        notas: "Azul Real",
        p_unit: 320.0,
        importe: 1600.0
      },
      {
        id: "item-2",
        ped_apa_ent: "P",
        cant: 5,
        concepto: "Pantalon Quirurgico Unisex Azul Real T-L",
        prenda: "Pantalon",
        corte: "Quirurgico",
        genero: "Unisex",
        talla: "L",
        notas: "Azul Real",
        p_unit: 260.0,
        importe: 1300.0
      },
      {
        id: "item-3",
        ped_apa_ent: "P",
        cant: 3,
        concepto: "Bata Laboratorio Unisex Blanca T-G",
        prenda: "Bata",
        corte: "Laboratorio",
        genero: "Unisex",
        talla: "G",
        notas: "Blanca",
        p_unit: 390.0,
        importe: 1170.0
      },
      {
        id: "item-4",
        ped_apa_ent: "B",
        cant: 13,
        concepto: "Ponchado y bordado logo institucional",
        prenda: "Bordado",
        corte: "Ponchado",
        genero: "",
        talla: "",
        notas: "Ponchado y bordado logo institucional",
        p_unit: 45.0,
        importe: 585.0
      }
    ],
    fecha_entrega: "04/11/2026",
    anticipo: 2500.0,
    resta: 2155.0,
    total: 4655.0,
    motor: "IA_MULTIMODAL",
    validacion_financiera: {
      cuadre_ok: true,
      diferencia: 0.0,
      suma_importes: 4655.0,
      total_coincide: true
    }
  }
];
