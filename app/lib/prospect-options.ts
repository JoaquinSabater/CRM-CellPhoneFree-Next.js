export const TIPOS_COMERCIO = [
  { value: 'kiosco', label: 'Kiosco' },
  { value: 'tienda_fisica', label: 'Tienda física' },
  { value: 'distribuidor', label: 'Distribuidor' },
  { value: 'cadena', label: 'Cadena' },
  { value: 'online', label: 'Online' },
  { value: 'otro', label: 'Otro' },
] as const;

export const MOTIVOS_NO_COMPRA = [
  { value: 'minimo_compra', label: 'Mínimo de compra' },
  { value: 'precio_margen', label: 'Precio / margen' },
  { value: 'sin_stock', label: 'Sin stock' },
  { value: 'plazo_entrega', label: 'Plazo de entrega' },
  { value: 'consumidor_final', label: 'Consumidor final' },
  { value: 'sin_respuesta', label: 'Sin respuesta' },
  { value: 'otro_proveedor', label: 'Otro proveedor' },
  { value: 'formas_pago', label: 'Formas de pago' },
  { value: 'otro', label: 'Otro' },
] as const;

export const ESTADOS_PROSPECTO = [
  { value: 'nuevo', label: 'Nuevo' },
  { value: 'seguimiento', label: 'Seguimiento' },
  { value: 'estancado', label: 'Estancado' },
  { value: 'inactivo', label: 'Inactivo' },
  { value: 'ganado', label: 'Ganado' },
  { value: 'perdido', label: 'Perdido' },
] as const;

export type TipoComercio = (typeof TIPOS_COMERCIO)[number]['value'];
export type MotivoNoCompra = (typeof MOTIVOS_NO_COMPRA)[number]['value'];
export type EstadoProspecto = (typeof ESTADOS_PROSPECTO)[number]['value'];
