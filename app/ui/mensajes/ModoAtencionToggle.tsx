import clsx from 'clsx';
import type { ModoAtencion } from '@/app/lib/mensajes';

const OPCIONES: { valor: ModoAtencion; label: string; activo: string }[] = [
  { valor: 'bot', label: 'Bot', activo: 'bg-slate-700 text-white' },
  { valor: 'humano', label: 'Humano', activo: 'bg-brand-600 text-white' },
];

export function ModoAtencionToggle({
  modo,
  disabled = false,
  onChange,
}: {
  modo: ModoAtencion;
  disabled?: boolean;
  onChange: (modo: ModoAtencion) => void;
}) {
  return (
    <div className="flex flex-none flex-col items-center gap-0.5">
      <div
        role="group"
        aria-label="Modo de atención"
        className={clsx('inline-flex rounded-lg border border-slate-300 bg-white p-0.5', disabled && 'opacity-60')}
      >
        {OPCIONES.map((opcion) => (
          <button
            key={opcion.valor}
            type="button"
            disabled={disabled}
            aria-pressed={modo === opcion.valor}
            onClick={() => modo !== opcion.valor && onChange(opcion.valor)}
            className={clsx(
              'rounded-md px-3 py-1 text-xs font-semibold uppercase tracking-wide transition-colors disabled:cursor-not-allowed',
              modo === opcion.valor ? opcion.activo : 'text-slate-500 hover:bg-slate-100',
            )}
          >
            {opcion.label}
          </button>
        ))}
      </div>
      <span className="text-[10px] font-medium text-slate-500">
        {modo === 'humano' ? 'Modo humano' : 'Modo bot'}
      </span>
    </div>
  );
}
