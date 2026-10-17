import Link from 'next/link';
import clsx from 'clsx';

export type SolicitudTab = 'vacaciones' | 'permisos';

export function parseSolicitudTab(value?: string): SolicitudTab {
  return value === 'permisos' ? 'permisos' : 'vacaciones';
}

const tabs: { id: SolicitudTab; label: string }[] = [
  { id: 'vacaciones', label: 'Vacaciones' },
  { id: 'permisos', label: 'Permisos de salida' },
];

export default function SolicitudTabs({ basePath, active }: { basePath: string; active: SolicitudTab }) {
  return (
    <nav className="mx-auto max-w-7xl px-4 pt-6">
      <div className="inline-flex rounded-lg border border-slate-200 bg-white p-1 shadow-sm">
        {tabs.map((tab) => (
          <Link
            key={tab.id}
            href={tab.id === 'vacaciones' ? basePath : `${basePath}?tab=${tab.id}`}
            className={clsx(
              'rounded-md px-4 py-2 text-sm font-semibold transition',
              active === tab.id
                ? 'bg-orange-600 text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900',
            )}
          >
            {tab.label}
          </Link>
        ))}
      </div>
    </nav>
  );
}
