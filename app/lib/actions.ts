'use server';

import { z } from 'zod';
import postgres from 'postgres';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { signIn } from 'app/auth';
import { AuthError } from 'next-auth';
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

export async function updateCliente(id: string, formData: FormData) {
  const cliente = await sql`
    SELECT id FROM clientes WHERE id = ${id}
  `;

  if (!cliente.length) {
    throw new Error('Cliente no encontrado');
  }

  const updatedCliente = {
    modalidad_de_pago: formData.get('modalidad_de_pago') as string | null,
    tipo_de_cliente: formData.get('tipo_de_cliente') as string | null,
    cantidad_de_dias: Number(formData.get('cantidad_de_dias')),
    monto: Number(formData.get('monto')),
    contactar: formData.get('contactar') === 'on',
    cuenta_corriente: formData.get('cuenta_corriente') === 'on',
  };

  if (!updatedCliente.modalidad_de_pago || !updatedCliente.tipo_de_cliente) {
    throw new Error('Faltan campos obligatorios');
  }

  await sql`
    UPDATE clientes
    SET 
      modalidad_de_pago = ${updatedCliente.modalidad_de_pago},
      tipo_de_cliente = ${updatedCliente.tipo_de_cliente},
      cantidad_de_dias = ${updatedCliente.cantidad_de_dias},
      monto = ${updatedCliente.monto},
      contactar = ${updatedCliente.contactar},
      cuenta_corriente = ${updatedCliente.cuenta_corriente}
    WHERE id = ${id}
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