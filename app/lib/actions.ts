'use server';

import { z } from 'zod';
import postgres from 'postgres';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { signIn } from 'app/auth';
import { AuthError } from 'next-auth';
import { crearEtiqueta } from './etiquetas';
import { clientes } from './placeholder-data';


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

export async function createEtiquetaOnServer(nombre: string, vendedorId: number) {
  await crearEtiqueta(nombre, vendedorId);
  revalidatePath('/dashboard/etiquetas');
}

export async function deleteFiltroById(id: number) {
  try {
    await sql`DELETE FROM filtros WHERE id = ${id};`;
  } catch (error) {
    console.error('Error al eliminar el filtro:', error);
    throw error;
  }
}

export async function updateCliente(id: string, formData: FormData) {
  const observaciones = formData.get('observaciones') as string | null;

  await sql`
    UPDATE clientes
    SET observaciones = ${observaciones}
    WHERE id = ${id};
  `;

  // 2. Procesar los filtros dinámicos
  const keys = Array.from(formData.keys());
  const filtroKeys = keys.filter((key) => key.startsWith('filtro-'));

  for (const key of filtroKeys) {
    const filtroId = key.replace('filtro-', '');
    const value = formData.get(key) as string;

    // Validación opcional: si querés evitar insertar valores vacíos
    if (!value) continue;

    await sql`
      INSERT INTO filtros_clientes (cliente_id, filtro_id, valor)
      VALUES (${id}, ${filtroId}, ${value})
      ON CONFLICT (cliente_id, filtro_id)
      DO UPDATE SET valor = EXCLUDED.valor;
    `;
  }

  // Redirección y revalidación
  revalidatePath('/dashboard/invoices');
  redirect('/dashboard/invoices');
}
export async function createEtiqueta(formData: FormData) {
  const nombre = formData.get('nombre')?.toString().trim();

  if (!nombre) {
    throw new Error('El nombre de la etiqueta es requerido.');
  }

  try {
    await sql`
      INSERT INTO filtros (nombre)
      VALUES (${nombre})
    `;
    revalidatePath('/dashboard/invoices'); // o donde quieras refrescar los datos
  } catch (error) {
    console.error('Error creando la etiqueta:', error);
    throw new Error('No se pudo crear la etiqueta.');
  }
}

export async function updateProspecto(id: number, formData: FormData) {
  const getString = (key: string) => String(formData.get(key) ?? '');
  const getNumberOrNull = (key: string) => {
    const value = formData.get(key);
    const parsed = Number(value);
    return isNaN(parsed) ? null : parsed;
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
  };

  // ✅ Debug: Mostrar los valores del form
  console.log('🔍 Campos recibidos para actualizar prospecto:', fields);

    await sql`
      UPDATE prospectos
      SET
        fecha_contacto = ${fields.fecha_contacto},
        por_donde_llego = ${fields.por_donde_llego},
        nombre = ${fields.nombre},
        email = ${fields.email},
        telefono = ${fields.telefono},
        negocio = ${fields.negocio},
        provincia_id = ${fields.provincia_id},
        localidad_id = ${fields.localidad_id},
        cuit = ${fields.cuit},
        anotaciones = ${fields.anotaciones},
        fecha_pedido_asesoramiento = ${fields.fecha_pedido_asesoramiento},
        url = ${fields.url}
      WHERE id = ${id};
    `;

    revalidatePath('/dashboard/invoices');
    redirect('/dashboard/invoices');
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