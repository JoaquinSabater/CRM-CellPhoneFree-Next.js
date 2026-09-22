'use client';

import { useState } from 'react';
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import type { Conversacion } from '@/app/lib/mensajes';
import { ConversationListItem } from '@/app/ui/mensajes/ConversationListItem';

export function ConversationList({
  conversaciones,
  selectedId,
  onSelect,
}: {
  conversaciones: Conversacion[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  const [query, setQuery] = useState('');

  const filtradas = conversaciones.filter((c) => {
    const texto = query.trim().toLowerCase();
    if (!texto) return true;
    return c.nombre.toLowerCase().includes(texto) || c.telefono.toLowerCase().includes(texto);
  });

  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-slate-200 p-3">
        <div className="relative">
          <MagnifyingGlassIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar conversación..."
            className="w-full rounded-md border border-slate-200 py-2 pl-9 pr-3 text-sm placeholder:text-slate-400 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
          />
        </div>
      </div>
      <div className="flex-1 overflow-y-auto">
        {conversaciones.length === 0 ? (
          <p className="p-4 text-center text-sm text-slate-400">Todavía no hay conversaciones del chatbot.</p>
        ) : filtradas.length === 0 ? (
          <p className="p-4 text-center text-sm text-slate-400">No se encontraron conversaciones.</p>
        ) : (
          filtradas.map((c) => (
            <ConversationListItem
              key={c.id}
              conversacion={c}
              selected={c.id === selectedId}
              onClick={() => onSelect(c.id)}
            />
          ))
        )}
      </div>
    </div>
  );
}
