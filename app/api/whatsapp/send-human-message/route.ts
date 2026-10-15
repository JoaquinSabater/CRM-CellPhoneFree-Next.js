import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getModoAtencion } from '@/app/lib/mensajes';
import { errorWhatsapp, phoneSchema, rechazarSiNoAutorizado } from '../_shared';

// Limite de un mensaje de texto en WhatsApp Cloud API.
const MAX_LARGO_MENSAJE = 4096;
const TIMEOUT_N8N_MS = 20_000;

const bodySchema = z.object({
  phone: phoneSchema,
  message: z.string().trim().min(1).max(MAX_LARGO_MENSAJE),
});

const respuestaN8nSchema = z.object({
  success: z.literal(true),
  meta_message_id: z.string().nullish(),
});

// CRM -> Next.js -> n8n (workflow humano) -> Meta. Este endpoint no escribe en chatbot_whatsapp:
// n8n agrega el turno "Humano: ..." recien cuando Meta acepta el mensaje.
export async function POST(request: NextRequest) {
  const rechazo = await rechazarSiNoAutorizado();
  if (rechazo) return rechazo;

  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return errorWhatsapp('invalid_body', 400);
  }

  const body = bodySchema.safeParse(json);
  if (!body.success) {
    const campo = body.error.issues[0]?.path[0];
    return errorWhatsapp(campo === 'message' ? 'invalid_message' : campo === 'phone' ? 'invalid_phone' : 'invalid_body', 400);
  }

  const { phone, message } = body.data;

  let modo;
  try {
    modo = await getModoAtencion(phone);
  } catch (error) {
    console.error('[whatsapp/send-human-message] Error consultando la conversacion:', error);
    return errorWhatsapp('internal_error', 500);
  }

  if (modo === null) return errorWhatsapp('conversation_not_found', 404);
  if (modo !== 'humano') return errorWhatsapp('conversation_is_in_bot_mode', 409);

  const webhookUrl = process.env.N8N_HUMAN_MESSAGE_WEBHOOK_URL?.trim();

  if (!webhookUrl) {
    console.error('[whatsapp/send-human-message] Falta la variable de entorno N8N_HUMAN_MESSAGE_WEBHOOK_URL.');
    return errorWhatsapp('n8n_webhook_url_missing', 500);
  }

  try {
    const respuesta = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone, message }),
      cache: 'no-store',
      signal: AbortSignal.timeout(TIMEOUT_N8N_MS),
    });

    const resultado = respuestaN8nSchema.safeParse(await respuesta.json().catch(() => null));

    if (!respuesta.ok || !resultado.success) {
      console.error('[whatsapp/send-human-message] n8n rechazo el envio. Status:', respuesta.status);
      return errorWhatsapp('n8n_rejected', 502);
    }

    return NextResponse.json({ success: true, meta_message_id: resultado.data.meta_message_id ?? null });
  } catch (error) {
    const timeout = error instanceof Error && error.name === 'TimeoutError';
    console.error('[whatsapp/send-human-message] Error llamando a n8n:', error);
    return errorWhatsapp(timeout ? 'n8n_timeout' : 'n8n_unreachable', timeout ? 504 : 502);
  }
}
