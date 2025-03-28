// This file contains type definitions for your data.
// It describes the shape of the data, and what data type each property should accept.
// For simplicity of teaching, we're manually defining these types.
// However, these types are generated automatically if you're using an ORM such as Prisma.

export type User = {
  id: string;
  name: string;
  email: string;
  password: string;
};

export type PaymentMode = 'Deposito' | 'Efectivo' | 'Transferencia' | 'Tarjeta de Crédito' | 'Cheque' | 'e-Check';
export type CustomerType = 'Grande' | 'Chico' | 'Mediano';

export type Customer = {
  id: string;
  name: string;
  email: string;
  image_url: string;
  limits_check: number;
  customer_type: CustomerType;
};

export type Invoice = {
  id: string;
  customer_id: string;
  amount: number;
  date: string;
  // In TypeScript, this is called a string union type.
  // It means that the "status" property can only be one of the two strings: 'pending' or 'paid'.
  status: 'pending' | 'paid';
};

export type Revenue = {
  month: string;
  revenue: number;
};

export type LatestInvoice = {
  id: string;
  name: string;
  image_url: string;
  email: string;
  amount: string;
};

// The database returns a number for amount, but we later format it to a string with the formatCurrency function
export type LatestInvoiceRaw = Omit<LatestInvoice, 'amount'> & {
  amount: number;
};

export type InvoicesTable = {
  id: string;
  customer_id: string;
  name: string;
  email: string;
  image_url: string;
  date: string;
  amount: number;
  status: 'pending' | 'paid';
  limits_check: number;
  customer_type: string;
};

export type CustomersTableType = {
  id: string;
  name: string;
  email: string;
  image_url: string;
  total_invoices: number;
  total_pending: number;
  total_paid: number;
};

export type FormattedCustomersTable = {
  id: string;
  name: string;
  email: string;
  image_url: string;
  total_invoices: number;
  total_pending: string;
  total_paid: string;
};

export type CustomerField = {
  id: string;
  name: string;
};

export type InvoiceForm = {
  id: string;
  customer_id: string;
  amount: number;
  status: 'pending' | 'paid';
};

export type provincia = {
  id: number;
  nombre: string;
  codigo31662: string;
  realizar_percepcion: boolean;
  tipo_percepcion: string;
  tasa_percepcion: number;
};

export type localidad = {
  id: number;
  provincia_id: number;
  nombre: string;
  codigopostal: string;
};

export type vendedor = {
  id: number;
  nombre: string;
  cuil: string;
  telefono: string;
  domicilio: string;
  fecha_inicio: string;
  excluir_informes: boolean;
  url_imagen: string;
  contraseña: string;
  email: string;
};

export type usuario = {
  id: number;
  username: string;
  password: string;
  email: string;
  created_at: string;
  updated_at: string;
  vendedor_id: number;
};

export type cliente = {
  id: number;
  razon_social: string;
  email: string;
  nombre: string;
  apellido: string;
  contacto: string;
  telefono: string;
  domicilio: string;
  cuit_dni: string;
  vendedor_id: number;
  localidad_id: number;
  condicion_iva_id: number;
  condicion_iibb_id: number;
  observaciones: string;
  facebook: string;
  instagram: string;
  fecha_creacion: string;
  modalidad_de_pago: string;
  contactar: boolean;
  tipo_de_cliente: string;
  cumpleaños: string;
  cantidad_de_dias: number;
  cuenta_corriente: boolean;
  monto: number;
  moroso: boolean;
};

export type clienteForm = {
  id: number;
  razon_social: string;
  email: string;
  nombre: string;
  apellido: string;
  contacto: string;
  telefono: string;
  domicilio: string;
  cuit_dni: string;
  vendedor_id: number;
  localidad_id: number;
  condicion_iva_id: number;
  condicion_iibb_id: number;
  observaciones: string | null;
  facebook: string | null;
  instagram: string | null;
  fecha_creacion: string;
  modalidad_de_pago: string;
  contactar: boolean;
  tipo_de_cliente: string;
  cumpleaños: string | null;
  cantidad_de_dias: number;
  cuenta_corriente: boolean;
  monto: number;
  localidad_nombre: string;     // LEFT JOIN
  provincia_nombre: string;     // LEFT JOIN
};


export type pedido = {
  id: number;
  vendedor_id: number;
  cliente_id: number;
  fecha_creacion: string;
  estado: string;
  hora_inicio_armado: string;
  hora_fin_armado: string;
  armador_id: number;
  hora_inicio_control: string;
  hora_fin_control: string;
  controlador_id: number;
  remito: string;
  consolidado_id: number;
};