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
      SELECT razon_social, modalidad_de_pago, contactar
      FROM clientes
      WHERE id = ${id}
    `;

    if (!cliente.length) {
      throw new Error('Cliente no encontrado');
    }

    const updatedCliente = {
      razon_social: formData.get('razon_social') as string | null,
      modalidad_de_pago: formData.get('modalidad_de_pago') as string | null,
      contactar: formData.get('contactar') === 'true',
    };

    if (!updatedCliente.razon_social || !updatedCliente.modalidad_de_pago) {
      throw new Error('Invalid form data');
    }

    await sql`
      UPDATE clientes
      SET 
        razon_social = ${updatedCliente.razon_social},
        modalidad_de_pago = ${updatedCliente.modalidad_de_pago},
        contactar = ${updatedCliente.contactar}
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