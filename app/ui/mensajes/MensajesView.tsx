'use client';

import { useState } from 'react';
import clsx from 'clsx';
import type { Conversacion } from '@/app/lib/mensajes';
import { Card } from '@/app/ui/components/Card';
import { ConversationList } from '@/app/ui/mensajes/ConversationList';
import { ChatThread } from '@/app/ui/mensajes/ChatThread';
import { EmptyState } from '@/app/ui/mensajes/EmptyState';

export function MensajesView({ conversaciones: initialConversaciones }: { conversaciones: Conversacion[] }) {
  // Sembrado desde el server component (getConversaciones), que lee chatbot_whatsapp.
  const [conversaciones, setConversaciones] = useState(initialConversaciones);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [mobileView, setMobileView] = useState<'list' | 'thread'>('list');

  const conversacionSeleccionada = conversaciones.find((c) => c.id === selectedId) ?? null;

  const handleSelect = (id: string) => {
    setSelectedId(id);
    setMobileView('thread');
  };

  const handleSend = (contenido: string) => {
    if (!conversacionSeleccionada) return;
    // TODO: no existe todavia el envio saliente del chatbot; el mensaje queda solo en
    // el estado local y no se persiste en chatbot_whatsapp.
    setConversaciones((prev) =>
      prev.map((c) => {
        if (c.id !== conversacionSeleccionada.id) return c;
        const nuevoMensaje = {
          id: `${c.id}-local-${Date.now()}`,
          conversacion_id: c.id,
          remitente_tipo: 'vendedor' as const,
          contenido,
          timestamp: new Date().toISOString(),
        };
        return { ...c, mensajes: [...c.mensajes, nuevoMensaje], sin_responder: false };
      }),
    );
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
          <ChatThread
            conversacion={conversacionSeleccionada}
            onSend={handleSend}
            onBack={() => setMobileView('list')}
          />
        ) : (
          <EmptyState />
        )}
      </div>
    </Card>
  );
}
