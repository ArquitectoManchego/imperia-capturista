export type ItemStatus = 'P' | 'A' | 'E' | 'B';

export interface NoteItem {
  id: string;
  ped_apa_ent: ItemStatus;
  cant: number;
  clave?: string;
  concepto: string;
  prenda: string;
  corte: string;
  genero: string;
  talla: string;
  talla_filipina?: string;
  talla_pantalon?: string;
  notas: string;
  p_unit: number;
  importe: number;
}

export type PaymentMethod = 
  | 'TRANSFERENCIA' 
  | 'EFECTIVO' 
  | 'TARJETA_DEBITO' 
  | 'TARJETA_CREDITO' 
  | 'NO_ESPECIFICADO';

export interface FinancialValidation {
  cuadre_ok: boolean;
  diferencia: number;
  suma_importes: number;
  total_coincide: boolean;
}

export interface NoteData {
  id?: string;
  folio: string;
  fecha_emision: string;
  metodo_pago: PaymentMethod;
  cliente: string;
  telefono: string;
  rfc: string;
  direccion: string;
  items: NoteItem[];
  fecha_entrega: string;
  anticipo: number;
  resta: number;
  total: number;
  motor: 'OCR_TRADICIONAL_CV' | 'IA_MULTIMODAL' | 'SUPERIOR_ADVERSARIAL_ENSEMBLE';
  validacion_financiera: FinancialValidation;
  cuota_creditos?: {
    usados_esta_hora: number;
    limite_por_hora: number;
    disponibles: number;
    total_acumulado: number;
  };
  auditoria_adversarial?: {
    anomalias_detectadas: number;
    registro_correcciones: Array<{ tipo: string; detalle: string; fila?: number }>;
    pase_verificacion: string;
  };
  imageUrl?: string;
  syncedToDb?: boolean;
  archivada?: boolean;
  firestoreId?: string;
}

export type EngineType = 'ocr' | 'ai' | 'superior';
