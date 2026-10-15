import clsx from 'clsx';
import type { Mensaje } from '@/app/lib/mensajes';

const ETIQUETA = 'mb-0.5 text-[10px] font-semibold not-italic uppercase tracking-wide';

export function Spinner({ className }: { className?: string }) {
  return (
    <svg className={clsx('animate-spin', className)} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="3" className="opacity-25" />
      <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

// `enviando` marca la burbuja de un mensaje humano que todavia no fue confirmado por WhatsApp.
export function MessageBubble({ mensaje, enviando = false }: { mensaje: Mensaje; enviando?: boolean }) {
  const hora = mensaje.timestamp
    ? new Date(mensaje.timestamp).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit', hour12: false })
    : null;

  if (mensaje.remitente_tipo === 'vendedor') {
    return (
      <div className="flex justify-end">
        <div
          className={clsx(
            'max-w-[75%] rounded-2xl rounded-br-sm bg-brand-600 px-4 py-2 text-white transition-opacity',
            enviando && 'opacity-70',
          )}
        >
          <p className={clsx(ETIQUETA, 'text-brand-100')}>Humano</p>
          <p className="whitespace-pre-wrap text-sm">{mensaje.contenido}</p>
          {enviando ? (
            <p className="mt-1 flex items-center justify-end gap-1 text-[10px] text-brand-100">
              <Spinner className="h-3 w-3" />
              Enviando…
            </p>
          ) : (
            hora && <p className="mt-1 text-right text-[10px] text-brand-100">{hora}</p>
          )}
        </div>
      </div>
    );
  }

  const esBot = mensaje.remitente_tipo === 'bot';

  return (
    <div className="flex justify-start">
      <div
        className={clsx(
          'max-w-[75%] rounded-2xl rounded-bl-sm px-4 py-2',
          esBot ? 'bg-slate-100 text-slate-600 italic' : 'border border-slate-200 bg-white text-slate-800',
        )}
      >
        <p className={clsx(ETIQUETA, 'text-slate-400')}>{esBot ? 'Bot' : 'Cliente'}</p>
        <p className="whitespace-pre-wrap text-sm">{mensaje.contenido}</p>
        {hora && <p className="mt-1 text-[10px] text-slate-400">{hora}</p>}
      </div>
    </div>
  );
}
