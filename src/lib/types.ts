export type ItemStatus = 'P' | 'A' | 'F' | 'E' | 'B';
export type EstadoPrenda = 'por_fabricar' | 'apartada' | 'fabricada' | 'en_bordado' | 'entregada';

export interface KitComponent {
  rol: 'filipina' | 'pantalon' | 'gorro' | 'accesorio';
  prenda: string;
  productId: string;
  productNombre: string;
  genero?: string; // 'Dama' | 'Caballero' | 'Unisex'
  tallaClave?: 'talla_filipina' | 'talla_pantalon' | 'talla_gorro' | 'unitalla';
  tallaAsignada?: string; // Talla calculada para producción (ej. 'M')
  cantidad?: number;
  estado_prenda?: EstadoPrenda; // 'por_fabricar' | 'apartada' | 'fabricada' | 'en_bordado' | 'entregada'
}

export interface CatalogProduct {
  id: string;
  nombre: string;
  nombre_producto?: string;
  codigo_producto?: string;
  codigo_barras?: string;
  prenda?: string;
  tipo_prenda?: string;
  tipo_producto?: 'PRODUCTO' | 'CONJUNTO' | 'PRENDA_SIMPLE' | 'PAQUETE' | 'ACCESORIO' | 'SERVICIO';
  modelo?: string;
  variante?: string;
  genero?: string;
  tallas_disponibles?: string[];
  tipo_tela?: string;
  color_tela?: string;
  precio?: number;
  sku_base?: string;
  ramo?: string;
  escuela?: string;
  descripcion?: string;
  esPropio?: boolean;
  componentes?: KitComponent[];
}

export interface NoteItem {
  id: string;
  ped_apa_ent: ItemStatus;
  estado_prenda?: EstadoPrenda;
  cant: number;
  clave?: string;
  codigo_producto?: string;
  codigo_barras?: string;
  concepto: string;
  prenda: string;
  corte: string;
  genero: string;
  talla: string;
  tipo_tela?: string;
  color_tela?: string;
  talla_filipina?: string;
  talla_pantalon?: string;
  notas: string;
  p_unit: number;
  importe: number;
  // Campos de validación y matching contra Base de Datos Software Imperia
  matchedProductId?: string;
  matchedProductName?: string;
  suggestedProductId?: string;
  suggestedProductName?: string;
  similarityScore?: number; // 0 a 1
  isExactMatch?: boolean;
  matchAction?: 'use_existing' | 'create_new';
  // Soporte para Kit / Conjuntos de múltiples prendas
  esConjunto?: boolean;
  componentesDesglosados?: KitComponent[];
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
