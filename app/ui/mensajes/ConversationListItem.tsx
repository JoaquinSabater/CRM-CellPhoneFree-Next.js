import clsx from 'clsx';
import type { Conversacion } from '@/app/lib/mensajes';
import { EstadoChatBadge } from '@/app/ui/mensajes/EstadoChatBadge';
import { formatRelativeTime } from '@/app/ui/mensajes/formatRelativeTime';

function iniciales(nombre: string): string {
  return nombre
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((parte) => parte[0]?.toUpperCase())
    .join('');
}

export function ConversationListItem({
  conversacion,
  selected,
  onClick,
}: {
  conversacion: Conversacion;
  selected: boolean;
  onClick: () => void;
}) {
  const ultimoMensaje = conversacion.mensajes.at(-1);

  return (
    <button
      onClick={onClick}
      className={clsx(
        'flex w-full items-start gap-3 border-b border-slate-100 px-4 py-3 text-left transition-colors',
        selected ? 'bg-brand-50' : 'hover:bg-slate-50',
      )}
    >
      <div className="flex h-10 w-10 flex-none items-center justify-center rounded-full bg-brand-100 text-sm font-semibold text-brand-700">
        {iniciales(conversacion.nombre)}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <p className="truncate text-sm font-medium text-slate-900">{conversacion.nombre}</p>
          <span className="flex-none text-xs text-slate-400">
            {formatRelativeTime(conversacion.ultima_actividad)}
          </span>
        </div>
        <div className="mt-0.5 flex items-center justify-between gap-2">
          <p className="truncate text-sm text-slate-500">{ultimoMensaje?.contenido ?? 'Sin mensajes'}</p>
          {conversacion.sin_responder && (
            <span className="h-2 w-2 flex-none rounded-full bg-brand-600" title="Último mensaje del prospecto" />
          )}
        </div>
        <div className="mt-1.5">
          <EstadoChatBadge estado={conversacion.estado} />
        </div>
      </div>
    </button>
  );
}
