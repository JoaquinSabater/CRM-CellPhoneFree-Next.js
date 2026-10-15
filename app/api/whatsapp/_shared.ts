import { NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/app/lib/auth';
import { puedeVerComercial } from '@/app/lib/roles';

// `phone` es la clave primaria de chatbot_whatsapp (varchar(30), solo digitos):
// se normaliza sacando +, espacios y guiones antes de validar.
export const phoneSchema = z
  .string()
  .transform((valor) => valor.replace(/\D/g, ''))
  .pipe(z.string().regex(/^\d{5,30}$/));

export function errorWhatsapp(error: string, status: number) {
  return NextResponse.json({ success: false, error }, { status });
}

// El middleware no cubre /api: cada ruta valida la sesion por su cuenta.
// Devuelve la respuesta de error a enviar, o null si el usuario puede usar Mensajes.
export async function rechazarSiNoAutorizado(): Promise<NextResponse | null> {
  const session = await auth();

  if (!session?.user?.id) return errorWhatsapp('unauthenticated', 401);
  if (!puedeVerComercial(session.user.rol)) return errorWhatsapp('forbidden', 403);

  return null;
}
