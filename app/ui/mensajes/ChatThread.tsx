'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { ArrowLeftIcon, PaperAirplaneIcon, PencilSquareIcon } from '@heroicons/react/24/outline';
import type { Conversacion } from '@/app/lib/mensajes';
import { EstadoChatBadge } from '@/app/ui/mensajes/EstadoChatBadge';
import { MessageBubble } from '@/app/ui/mensajes/MessageBubble';
import { Button } from '@/app/ui/button';

export function ChatThread({
  conversacion,
  onSend,
  onBack,
}: {
  conversacion: Conversacion;
  onSend: (contenido: string) => void;
  onBack?: () => void;
}) {
  const [texto, setTexto] = useState('');
  const finRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    finRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [conversacion.mensajes.length, conversacion.id]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const contenido = texto.trim();
    if (!contenido) return;
    onSend(contenido);
    setTexto('');
  };

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-3 border-b border-slate-200 px-4 py-3">
        {onBack && (
          <button onClick={onBack} className="rounded-md p-1.5 text-slate-500 hover:bg-slate-100 md:hidden">
            <ArrowLeftIcon className="h-5 w-5" />
          </button>
        )}
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-slate-900">{conversacion.nombre}</p>
          <p className="truncate text-xs text-slate-500">
            {conversacion.telefono}
            {conversacion.localidad && ` · ${conversacion.localidad}`}
          </p>
        </div>
        <EstadoChatBadge estado={conversacion.estado} />
        {conversacion.prospecto_id && (
          <Link
            href={`/dashboard/prospects/${conversacion.prospecto_id}/edit`}
            className="rounded-md p-1.5 text-slate-500 hover:bg-slate-100"
            title="Ver ficha del prospecto"
          >
            <PencilSquareIcon className="h-5 w-5" />
          </Link>
        )}
      </div>

      {conversacion.observaciones && (
        <p className="border-b border-slate-200 bg-amber-50 px-4 py-2 text-xs text-amber-800">
          {conversacion.observaciones}
        </p>
      )}

      <div className="flex-1 space-y-3 overflow-y-auto bg-slate-50 p-4">
        {conversacion.mensajes.map((m) => (
          <MessageBubble key={m.id} mensaje={m} />
        ))}
        <div ref={finRef} />
      </div>

      <form onSubmit={handleSubmit} className="flex items-center gap-2 border-t border-slate-200 p-3">
        <input
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          placeholder="Escribí un mensaje..."
          className="flex-1 rounded-full border border-slate-300 px-4 py-2 text-sm placeholder:text-slate-400 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
        />
        <Button type="submit" disabled={!texto.trim()} className="!h-10 !w-10 !px-0 justify-center">
          <PaperAirplaneIcon className="h-5 w-5" />
          <span className="sr-only">Enviar</span>
        </Button>
      </form>
    </div>
  );
}
