// This file contains placeholder data that you'll be replacing with real data in the Data Fetching chapter:
// https://nextjs.org/learn/dashboard-app/fetching-data

export const provincias = [
  { id: 1, nombre: 'Buenos Aires', codigo31662: 'AR-B', realizar_percepcion: true, tipo_percepcion: 'IVA', tasa_percepcion: 21.0 },
  { id: 2, nombre: 'Córdoba', codigo31662: 'AR-X', realizar_percepcion: false, tipo_percepcion: 'Ganancias', tasa_percepcion: 15.0 },
];

export const localidades = [
  { id: 1, provincia_id: 1, nombre: 'La Plata', codigopostal: '1900' },
  { id: 2, provincia_id: 2, nombre: 'Córdoba Capital', codigopostal: '5000' },
];

export const vendedores = [
  {
    id: 1,
    nombre: 'Juan Pérez',
    cuil: '20-12345678-9',
    telefono: '123456789',
    domicilio: 'Calle Falsa 123, Buenos Aires',
    fecha_inicio: '2020-01-01',
    excluir_informes: false,
    url_imagen: 'https://example.com/juan.jpg',
    contraseña: 'password123',
  },
  {
    id: 2,
    nombre: 'María López',
    cuil: '27-98765432-1',
    telefono: '987654321',
    domicilio: 'Avenida Siempre Viva 456, Córdoba',
    fecha_inicio: '2018-05-15',
    excluir_informes: false,
    url_imagen: 'https://example.com/maria.jpg',
    contraseña: 'securepassword',
  },
];

export const usuarios = [
  {
    id: 1,
    username: 'juanperez',
    password: 'password123',
    email: 'juan.perez@example.com',
    created_at: '2023-01-01T10:00:00Z',
    updated_at: '2023-01-01T10:00:00Z',
    vendedor_id: 1,
  },
  {
    id: 2,
    username: 'marialopez',
    password: 'securepassword',
    email: 'maria.lopez@example.com',
    created_at: '2023-01-02T10:00:00Z',
    updated_at: '2023-01-02T10:00:00Z',
    vendedor_id: 2,
  },
];

export const clientes = [
  {
    id: 1,
    razon_social: 'Cliente 1 SA',
    email: 'cliente1@example.com',
    nombre: 'Carlos',
    apellido: 'Gómez',
    contacto: 'Carlos Gómez',
    telefono: '1122334455',
    domicilio: 'Calle 1 123, La Plata',
    cuit_dni: '20-12345678-9',
    vendedor_id: 1,
    localidad_id: 1,
    condicion_iva_id: 1,
    condicion_iibb_id: 1,
    observaciones: 'Cliente frecuente.',
    facebook: 'facebook.com/cliente1',
    instagram: 'instagram.com/cliente1',
    fecha_creacion: '2023-01-01',
    modalidad_de_pago: 'Efectivo',
    contactar: true,
    tipo_de_cliente: 'Mayorista',
    cumpleaños: '1980-05-15',
    cantidad_de_dias: 30,
    cuenta_corriente: true,
    monto: 5000.0,
    moroso: false,
  },
  {
    id: 2,
    razon_social: 'Cliente 2 SRL',
    email: 'cliente2@example.com',
    nombre: 'Ana',
    apellido: 'Martínez',
    contacto: 'Ana Martínez',
    telefono: '2233445566',
    domicilio: 'Calle 2 456, Córdoba Capital',
    cuit_dni: '27-98765432-1',
    vendedor_id: 2,
    localidad_id: 2,
    condicion_iva_id: 2,
    condicion_iibb_id: 2,
    observaciones: 'Cliente nuevo.',
    facebook: 'facebook.com/cliente2',
    instagram: 'instagram.com/cliente2',
    fecha_creacion: '2023-02-01',
    modalidad_de_pago: 'Transferencia',
    contactar: false,
    tipo_de_cliente: 'Minorista',
    cumpleaños: '1990-10-20',
    cantidad_de_dias: 15,
    cuenta_corriente: false,
    monto: 2000.0,
    moroso: true,
  },
];

export const pedidos = [
  {
    id: 1,
    vendedor_id: 1,
    cliente_id: 1,
    fecha_creacion: '2023-03-01T10:00:00Z',
    estado: 'Pendiente',
    hora_inicio_armado: '10:00:00',
    hora_fin_armado: '11:00:00',
    armador_id: 1,
    hora_inicio_control: '11:30:00',
    hora_fin_control: '12:00:00',
    controlador_id: 2,
    remito: 'R001',
    consolidado_id: 1,
  },
  {
    id: 2,
    vendedor_id: 2,
    cliente_id: 2,
    fecha_creacion: '2023-03-02T10:00:00Z',
    estado: 'Completado',
    hora_inicio_armado: '09:00:00',
    hora_fin_armado: '10:00:00',
    armador_id: 2,
    hora_inicio_control: '10:30:00',
    hora_fin_control: '11:00:00',
    controlador_id: 1,
    remito: 'R002',
    consolidado_id: 2,
  },
];

