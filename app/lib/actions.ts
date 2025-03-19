'use server';

import { z } from 'zod';
import postgres from 'postgres';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

const FormSchema = z.object({
    id: z.string(),
    customerId: z.string(),
    amount: z.coerce.number(),
    status: z.enum(['pending', 'paid']),
    date: z.string(),
  });
 
const sql = postgres(process.env.POSTGRES_URL!, { ssl: 'require' });

const UpdateInvoice = FormSchema.omit({ id: true, date: true });

export async function updateInvoice(id: string, formData: FormData) {
    const invoice = await sql`
      SELECT customer_id, amount
      FROM invoices
      WHERE id = ${id}
    `;
  
    if (!invoice.length) {
      throw new Error('Invoice not found');
    }
  
    const { customer_id: customerId, amount } = invoice[0];
  
    const { status } = UpdateInvoice.parse({
      customerId,
      amount,
      status: formData.get('status'),
    });
  
    const amountInCents = amount * 100;
  
    await sql`
      UPDATE invoices
      SET customer_id = ${customerId}, amount = ${amountInCents}, status = ${status}
      WHERE id = ${id}
    `;
  
    revalidatePath('/dashboard/invoices');
    redirect('/dashboard/invoices');
  }