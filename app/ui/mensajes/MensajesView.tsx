'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import clsx from 'clsx';
import type { Conversacion, ModoAtencion } from '@/app/lib/mensajes';
import { Card } from '@/app/ui/components/Card';
import { ConversationList } from '@/app/ui/mensajes/ConversationList';
import { ChatThread } from '@/app/ui/mensajes/ChatThread';
import { EmptyState } from '@/app/ui/mensajes/EmptyState';

const INTERVALO_CONVERSACION_MS = 2500;
const INTERVALO_LISTA_MS = 10000;

const ERROR_ENVIO_GENERICO = 'No se pudo enviar el mensaje. Intentá de nuevo.';
const ERRORES_ENVIO: Record<string, string> = {
  unauthenticated: 'Tu sesión expiró. Volvé a iniciar sesión.',
  forbidden: 'No tenés permiso para enviar mensajes.',
  invalid_message: 'El mensaje está vacío o es demasiado largo.',
  conversation_not_found: 'La conversación ya no existe.',
  conversation_is_in_bot_mode: 'La conversación está en modo bot. Cambiá a modo humano para responder.',
  n8n_webhook_url_missing:
    'Error del servidor: falta la variable.',
  n8n_rejected: 'WhatsApp no aceptó el mensaje. Intentá de nuevo.',
  n8n_unreachable: 'No se pudo conectar con el servicio de WhatsApp. Intentá de nuevo.',
  n8n_timeout: 'El servicio de WhatsApp tardó demasiado en responder. Revisá el historial antes de reintentar.',
};

type RespuestaApi = { success: boolean; error?: string; conversaciones?: Conversacion[] };

async function fetchConversaciones(signal?: AbortSignal, phone?: string): Promise<Conversacion[]> {
  const query = phone ? `?phone=${encodeURIComponent(phone)}` : '';
  const response = await fetch(`/api/whatsapp/conversaciones${query}`, { cache: 'no-store', signal });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  const data: RespuestaApi = await response.json();
  return data.conversaciones ?? [];
}

function sonIguales(a: unknown, b: unknown): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}

// Ejecuta `tarea` cada `intervaloMs`, encadenando timeouts para que nunca haya dos pedidos
// en vuelo a la vez. Se reinicia cuando cambia `clave` y se corta al desmontar.
function usePolling(tarea: (signal: AbortSignal) => Promise<void>, intervaloMs: number, clave: string | null = '') {
  const tareaRef = useRef(tarea);
  useEffect(() => {
    tareaRef.current = tarea;
  });

  useEffect(() => {
    if (clave === null) return;

    const controller = new AbortController();
    let timer: ReturnType<typeof setTimeout>;

    const ciclo = async () => {
      // Con la pestaña oculta no se consulta: se retoma sola al volver.
      if (!document.hidden) {
        try {
          await tareaRef.current(controller.signal);
        } catch {
          // Un fallo puntual no corta la sincronizacion: se reintenta en el proximo ciclo.
        }
      }
      if (!controller.signal.aborted) timer = setTimeout(ciclo, intervaloMs);
    };

    timer = setTimeout(ciclo, intervaloMs);

    return () => {
      controller.abort();
      clearTimeout(timer);
    };
  }, [intervaloMs, clave]);
}

export function MensajesView({ conversaciones: initialConversaciones }: { conversaciones: Conversacion[] }) {
  // Sembrado desde el server component (getConversaciones) y despues sincronizado por polling
  // contra chatbot_whatsapp, que es donde escribe n8n.
  const [conversaciones, setConversaciones] = useState(initialConversaciones);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [mobileView, setMobileView] = useState<'list' | 'thread'>('list');
  // Cambia al empezar y al terminar cada cambio de modo: una respuesta de polling pedida antes
  // puede traer el modo viejo y se descarta para no pisar lo que el usuario acaba de elegir.
  const mutaciones = useRef(0);

  const conversacionSeleccionada = conversaciones.find((c) => c.id === selectedId) ?? null;

  const aplicarConversacion = useCallback((nueva: Conversacion) => {
    setConversaciones((prev) => {
      const actual = prev.find((c) => c.id === nueva.id);
      if (!actual || sonIguales(actual, nueva)) return prev;
      return prev.map((c) => (c.id === nueva.id ? nueva : c));
    });
  }, []);

  usePolling(async (signal) => {
    const marca = mutaciones.current;
    const nuevas = await fetchConversaciones(signal);
    if (signal.aborted || marca !== mutaciones.current) return;
    setConversaciones((prev) => (sonIguales(prev, nuevas) ? prev : nuevas));
  }, INTERVALO_LISTA_MS);

  usePolling(
    async (signal) => {
      if (!selectedId) return;
      const marca = mutaciones.current;
      const [nueva] = await fetchConversaciones(signal, selectedId);
      if (!nueva || signal.aborted || marca !== mutaciones.current) return;
      aplicarConversacion(nueva);
    },
    INTERVALO_CONVERSACION_MS,
    selectedId,
  );

  const handleSelect = (id: string) => {
    setSelectedId(id);
    setMobileView('thread');
  };

  const setModo = (id: string, modo: ModoAtencion) =>
    setConversaciones((prev) => prev.map((c) => (c.id === id ? { ...c, modo_atencion: modo } : c)));

  const handleCambiarModo = async (id: string, anterior: ModoAtencion, modo: ModoAtencion): Promise<string | null> => {
    mutaciones.current += 1;
    setModo(id, modo);

    try {
      const response = await fetch('/api/whatsapp/modo-atencion', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: id, modo_atencion: modo }),
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return null;
    } catch {
      setModo(id, anterior);
      return 'No se pudo cambiar el modo de atención. Intentá de nuevo.';
    } finally {
      mutaciones.current += 1;
    }
  };

  const handleSend = async (id: string, contenido: string): Promise<string | null> => {
    try {
      const response = await fetch('/api/whatsapp/send-human-message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: id, message: contenido }),
      });
      const data: RespuestaApi | null = await response.json().catch(() => null);

      if (!response.ok || !data?.success) {
        return (data?.error && ERRORES_ENVIO[data.error]) || ERROR_ENVIO_GENERICO;
      }
    } catch {
      return 'No se pudo conectar con el servidor. Intentá de nuevo.';
    }

    // El mensaje no se agrega a mano: se vuelve a leer lo que n8n guardo en chatbot_whatsapp.
    // Si todavia no llego, lo trae el polling.
    try {
      const [nueva] = await fetchConversaciones(undefined, id);
      if (nueva) aplicarConversacion(nueva);
    } catch {
      // Lo resuelve el proximo ciclo de polling.
    }
    return null;
  };

  return (
    <Card className="flex h-[calc(100vh-8rem)] overflow-hidden">
      <div
        className={clsx(
          'w-full flex-none border-slate-200 md:block md:w-80 md:border-r',
          mobileView === 'thread' ? 'hidden' : 'block',
        )}
      >
        <ConversationList
          conversaciones={conversaciones}
          selectedId={selectedId}
          onSelect={handleSelect}
        />
      </div>
      <div className={clsx('min-w-0 flex-1 md:block', mobileView === 'list' ? 'hidden' : 'block')}>
        {conversacionSeleccionada ? (
          // La key reinicia borrador, errores y scroll al cambiar de conversacion (no en cada polling).
          <ChatThread
            key={conversacionSeleccionada.id}
            conversacion={conversacionSeleccionada}
            onSend={(contenido) => handleSend(conversacionSeleccionada.id, contenido)}
            onCambiarModo={(modo) =>
              handleCambiarModo(conversacionSeleccionada.id, conversacionSeleccionada.modo_atencion, modo)
            }
            onBack={() => setMobileView('list')}
          />
        ) : (
          <EmptyState />
        )}
      </div>
    </Card>
  );
}
