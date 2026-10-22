// Teléfonos de contacto específicos del cliente (tabla cliente_contactos).
// Hay como máximo uno de cada tipo por cliente.

export const TIPOS_CONTACTO = {
  ventas: 'Contacto de ventas',
  pagos: 'Contacto de pagos',
} as const;

export type TipoContacto = keyof typeof TIPOS_CONTACTO;

export type ContactoCliente = {
  tipo: TipoContacto;
  telefono: string;
  nombre: string | null;
};
