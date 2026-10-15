import { NextRequest, NextResponse } from 'next/server';
import { getConversacion, getConversaciones } from '@/app/lib/mensajes';
import { errorWhatsapp, phoneSchema, rechazarSiNoAutorizado } from '../_shared';

export const dynamic = 'force-dynamic';

// Sin parametros devuelve todas las conversaciones; con ?phone= solo esa (lista vacia si no existe).
export async function GET(request: NextRequest) {
  const rechazo = await rechazarSiNoAutorizado();
  if (rechazo) return rechazo;

  const phoneParam = request.nextUrl.searchParams.get('phone');

  try {
    if (phoneParam === null) {
      return NextResponse.json({ success: true, conversaciones: await getConversaciones() });
    }

    const phone = phoneSchema.safeParse(phoneParam);
    if (!phone.success) return errorWhatsapp('invalid_phone', 400);

    const conversacion = await getConversacion(phone.data);
    return NextResponse.json({ success: true, conversaciones: conversacion ? [conversacion] : [] });
  } catch (error) {
    console.error('[whatsapp/conversaciones] Error:', error);
    return errorWhatsapp('internal_error', 500);
  }
}
