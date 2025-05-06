'use server';

import { z } from 'zod';
import postgres from 'postgres';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { signIn } from '@/app/lib/auth';
import { AuthError } from 'next-auth';
import { auth } from '@/app/lib/auth';
import {db} from "../lib/mysql";

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;


const FormSchema = z.object({
    id: z.string(),
    customerId: z.string(),
    amount: z.coerce.number(),
    status: z.enum(['pending', 'paid']),
    date: z.string(),
  });
 
const sql = postgres(process.env.POSTGRES_URL!, { ssl: 'require' });

const UpdateInvoice = FormSchema.omit({ id: true, date: true });

const ClienteFormSchema = z.object({
  id: z.string(),
  razon_social: z.string().min(1, 'La razón social es obligatoria'),
  modalidad_de_pago: z.string().min(1, 'La modalidad de pago es obligatoria'),
  contactar: z.boolean(),
});

const UpdateCliente = ClienteFormSchema.omit({ id: true });

export async function createRecordatorio(formData: FormData) {
  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) {
    return { success: false, error: 'No autenticado' };
  }

  const mensaje = formData.get('mensaje') as string;
  const fecha = formData.get('fecha') as string;

  if (!fecha) {
    return { success: false, error: 'La fecha es requerida' };
  }

  const fechaCompleta = new Date(fecha);

  if (isNaN(fechaCompleta.getTime())) {
    return { success: false, error: 'Fecha inválida' };
  }

  if (!BOT_TOKEN) {
    console.error('❌ BOT_TOKEN no está definido en el .env');
    return { success: false, error: 'Error interno del servidor (BOT_TOKEN faltante)' };
  }

  const fechaEnvio = fechaCompleta.toISOString();

  const [rows]: any = await db.query(
    'SELECT chat_id_crm FROM usuarios WHERE id = ?',
    [userId]
  );
  const usuario = rows[0];
  const chat_id = usuario?.chat_id_crm;
  
  console.log('chat_id:', chat_id);

  if (!chat_id) {
    return {
      success: false,
      error: 'Falta el chat_id del usuario para enviar el recordatorio.',
    };
  }

  await db.query(
    'INSERT INTO recordatorios (mensaje, fecha_envio, chat_id, bot_token) VALUES (?, ?, ?, ?)',
    [mensaje, fechaEnvio, chat_id, BOT_TOKEN]
  );

  console.log(`✅ Recordatorio creado para el ${fechaEnvio} con mensaje: "${mensaje}"`);

  return { success: true };
}


export async function deleteFiltroById(id: number) {
  try {
    await db.query('DELETE FROM filtros WHERE id = ?', [id]);
  } catch (error) {
    console.error('Error al eliminar el filtro:', error);
    throw error;
  }
}

export async function altaCliente(prospectoId: number, formData: FormData) {
  const vendedorId = formData.get('vendedor_id');

  if (!vendedorId) {
    throw new Error('Debe seleccionar un vendedor.');
  }

  try {
    await db.query(
      `INSERT INTO clientes (
        nombre,
        email,
        telefono,
        localidad_id,
        cuit_dni,
        observaciones,
        vendedor_id,
        fecha_creacion
      )
      SELECT 
        nombre,
        email,
        telefono,
        localidad_id,
        cuit,
        anotaciones,
        ?,
        CURDATE()
      FROM prospectos 
      WHERE id = ?`,
      [vendedorId, prospectoId]
    );

    await db.query(
      `UPDATE prospectos SET activo = false, convertido = 1 WHERE id = ?`,
      [prospectoId]
    );
    
  } catch (err) {
    console.error('❌ Error al dar de alta cliente:', err);
    throw err;
  }
}



export async function updateCliente(id: string, formData: FormData) {
  const observaciones = formData.get('observaciones') as string | null;

  // 1. Actualizar campo fijo
  await db.query(
    'UPDATE clientes SET observaciones = ? WHERE id = ?',
    [observaciones, id]
  );

  // 2. Procesar los filtros dinámicos
  const keys = Array.from(formData.keys());
  const filtroKeys = keys.filter((key) => key.startsWith('filtro-'));

  for (const key of filtroKeys) {
    const filtroId = key.replace('filtro-', '');
    const value = formData.get(key) as string;

    if (!value) continue;

    // Inserta o actualiza si ya existe
    await db.query(
      `INSERT INTO filtros_clientes (cliente_id, filtro_id, valor)
       VALUES (?, ?, ?)
       ON DUPLICATE KEY UPDATE valor = VALUES(valor)`,
      [id, filtroId, value]
    );
  }

  revalidatePath('/dashboard/invoices');
  redirect('/dashboard/invoices');
}



export async function createEtiqueta(formData: FormData) {
  const nombre = formData.get('nombre')?.toString().trim();

  if (!nombre) {
    throw new Error('El nombre de la etiqueta es requerido.');
  }

  try {
    await db.query(
      'INSERT INTO filtros (nombre) VALUES (?)',
      [nombre]
    );
    revalidatePath('/dashboard/invoices'); // o el path que necesites refrescar
  } catch (error) {
    console.error('Error creando la etiqueta:', error);
    throw new Error('No se pudo crear la etiqueta.');
  }
}


//YA CAMBIE ESTA 
export async function updateProspecto(id: number, formData: FormData) {
  const getString = (key: string) => String(formData.get(key) ?? '');
  const getNumberOrNull = (key: string) => {
    const value = formData.get(key);
    const parsed = Number(value);
    return !value || parsed === 0 || isNaN(parsed) ? null : parsed;
  };

  const fields = {
    fecha_contacto: getString('fecha_contacto'),
    por_donde_llego: getString('por_donde_llego'),
    nombre: getString('nombre'),
    email: getString('email'),
    telefono: getString('telefono'),
    negocio: getString('negocio'),
    provincia_id: getNumberOrNull('provincia_id'),
    localidad_id: getNumberOrNull('localidad_id'),
    cuit: getString('cuit'),
    anotaciones: getString('anotaciones'),
    fecha_pedido_asesoramiento: getString('fecha_pedido_asesoramiento'),
    url: getString('url'),
    seguimiento: getString('seguimiento'),
  };

  const updateQuery = `
    UPDATE prospectos SET
      fecha_contacto = ?,
      por_donde_llego = ?,
      nombre = ?,
      email = ?,
      telefono = ?,
      negocio = ?,
      provincia_id = ?,
      localidad_id = ?,
      cuit = ?,
      anotaciones = ?,
      fecha_pedido_asesoramiento = ?,
      url = ?
    WHERE id = ?
  `;

  const values = [
    fields.fecha_contacto,
    fields.por_donde_llego,
    fields.nombre,
    fields.email,
    fields.telefono,
    fields.negocio,
    fields.provincia_id,
    fields.localidad_id,
    fields.cuit,
    fields.anotaciones,
    fields.fecha_pedido_asesoramiento,
    fields.url,
    id,
  ];

  await db.query(updateQuery, values);

  // 🔁 Seguimiento → crear recordatorio
  if (fields.seguimiento) {
    let diasExtra = 0;

    if (fields.seguimiento === '2') diasExtra = 1;
    if (fields.seguimiento === '3') diasExtra = 7;
    if (fields.seguimiento === '4') diasExtra = 15;

    const now = new Date();
    const fechaEnvio = new Date(now);
    fechaEnvio.setDate(now.getDate() + diasExtra);

    const fecha = fechaEnvio.toISOString().slice(0, 10);

    const mensaje = `📌 Seguimiento ${fields.seguimiento} para el prospecto: ${fields.nombre}`;

    const recordatorioForm = new FormData();
    recordatorioForm.append('mensaje', mensaje);
    recordatorioForm.append('fecha', fecha);

    await createRecordatorio(recordatorioForm);
  }

  revalidatePath('/dashboard/invoices');
  redirect('/dashboard/invoices');
}


//YA CAMBIE ESTA
export async function desactivarProspecto(id: number) {
  try {
    const query = `
      UPDATE prospectos
      SET activo = false
      WHERE id = ?
    `;
    await db.query(query, [id]);
  } catch (error) {
    console.error('❌ Error al desactivar el prospecto:', error);
    throw new Error('No se pudo desactivar el prospecto');
  }
}




//YA CAMBIE ESTA
export async function createProspecto(formData: FormData) {
  const session = await auth();
  const captadorId = session?.user?.captador_id;

  const fields = {
    fecha_contacto: formData.get('fecha_contacto')?.toString() || null,
    por_donde_llego: formData.get('por_donde_llego')?.toString() || null,
    nombre: formData.get('nombre')?.toString() || null,
    email: formData.get('email')?.toString() || null,
    telefono: formData.get('telefono')?.toString() || null,
    negocio: formData.get('negocio')?.toString() || null,
    provincia_id: Number(formData.get('provincia_id')) || null,
    localidad_id: Number(formData.get('localidad_id')) || null,
    cuit: formData.get('cuit')?.toString() || null,
    anotaciones: formData.get('anotaciones')?.toString() || null,
    fecha_pedido_asesoramiento: formData.get('fecha_pedido_asesoramiento')?.toString() || null,
    url: formData.get('url')?.toString() || null,
    captador_id: captadorId || null,
  };

  try {
    const query = `
      INSERT INTO prospectos (
        fecha_contacto,
        por_donde_llego,
        nombre,
        email,
        telefono,
        negocio,
        provincia_id,
        localidad_id,
        cuit,
        anotaciones,
        fecha_pedido_asesoramiento,
        url,
        captador_id
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    const values = [
      fields.fecha_contacto,
      fields.por_donde_llego,
      fields.nombre,
      fields.email,
      fields.telefono,
      fields.negocio,
      fields.provincia_id,
      fields.localidad_id,
      fields.cuit,
      fields.anotaciones,
      fields.fecha_pedido_asesoramiento,
      fields.url,
      fields.captador_id,
    ];

    let diasExtra = 0;

    diasExtra = 1;

    const now = new Date();
    const fechaEnvio = new Date(now);
    fechaEnvio.setDate(now.getDate() + diasExtra);

    const fecha = fechaEnvio.toISOString().slice(0, 10);

    const mensaje = `📌 Seguimiento 2 para el prospecto: ${fields.nombre}`;

    const recordatorioForm = new FormData();
    recordatorioForm.append('mensaje', mensaje);
    recordatorioForm.append('fecha', fecha);

    await createRecordatorio(recordatorioForm);

    await db.query(query, values);
    
  } catch (error) {
    console.error('❌ Error al crear el prospecto:', error);
    throw new Error('Error al crear el prospecto');
  }
}


  export async function authenticate(
    prevState: string | undefined,
    formData: FormData,
  ) {
    try {
      await signIn('credentials', formData);
    } catch (error) {
      if (error instanceof AuthError) {
        switch (error.type) {
          case 'CredentialsSignin':
            return 'Invalid credentials.';
          default:
            return 'Something went wrong.';
        }
      }
      throw error;
    }
  }