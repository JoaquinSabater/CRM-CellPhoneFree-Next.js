import clsx from 'clsx';
import type { Mensaje } from '@/app/lib/mensajes';

export function MessageBubble({ mensaje }: { mensaje: Mensaje }) {
  const hora = mensaje.timestamp
    ? new Date(mensaje.timestamp).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit', hour12: false })
    : null;

  if (mensaje.remitente_tipo === 'vendedor') {
    return (
      <div className="flex justify-end">
        <div className="max-w-[75%] rounded-2xl rounded-br-sm bg-brand-600 px-4 py-2 text-white">
          <p className="whitespace-pre-wrap text-sm">{mensaje.contenido}</p>
          {hora && <p className="mt-1 text-right text-[10px] text-brand-100">{hora}</p>}
        </div>
      </div>
    );
  }

  return (
    <div className="flex justify-start">
      <div
        className={clsx(
          'max-w-[75%] rounded-2xl rounded-bl-sm px-4 py-2',
          mensaje.remitente_tipo === 'bot'
            ? 'bg-slate-100 text-slate-600 italic'
            : 'border border-slate-200 bg-white text-slate-800',
        )}
      >
        {mensaje.remitente_tipo === 'bot' && (
          <p className="mb-0.5 text-[10px] font-semibold not-italic uppercase tracking-wide text-slate-400">Bot</p>
        )}
        <p className="whitespace-pre-wrap text-sm">{mensaje.contenido}</p>
        {hora && <p className="mt-1 text-[10px] text-slate-400">{hora}</p>}
      </div>
    </div>
  );
}
