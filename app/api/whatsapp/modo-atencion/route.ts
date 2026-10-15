import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { actualizarModoAtencion, MODOS_ATENCION } from '@/app/lib/mensajes';
import { errorWhatsapp, phoneSchema, rechazarSiNoAutorizado } from '../_shared';

const bodySchema = z.object({
  phone: phoneSchema,
  modo_atencion: z.enum(MODOS_ATENCION),
});

export async function PATCH(request: NextRequest) {
  const rechazo = await rechazarSiNoAutorizado();
  if (rechazo) return rechazo;

  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return errorWhatsapp('invalid_body', 400);
  }

  const body = bodySchema.safeParse(json);
  if (!body.success) return errorWhatsapp('invalid_body', 400);

  try {
    const actualizada = await actualizarModoAtencion(body.data.phone, body.data.modo_atencion);
    if (!actualizada) return errorWhatsapp('conversation_not_found', 404);

    return NextResponse.json({ success: true, modo_atencion: body.data.modo_atencion });
  } catch (error) {
    console.error('[whatsapp/modo-atencion] Error:', error);
    return errorWhatsapp('internal_error', 500);
  }
}
