'use client';

import { useEffect, useState } from 'react';
import clsx from 'clsx';
import {
  CheckIcon,
  ClockIcon,
  UserGroupIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import { TIPOS_PERMISO, type PermisoStatus, type TipoPermiso } from '@/app/lib/permisos';
import { formatPermisoDate, formatPermisoHorario, tipoBarStyles, tipoStyles } from './SolicitudPermisosView';

type PermisoRequest = {
  id: number;
  usuario_id: number;
  tipo: TipoPermiso;
  fecha: string;
  dia_completo: boolean;
  hora_desde: string | null;
  hora_hasta: string | null;
  comentario: string;
  estado: PermisoStatus;
  motivo_rechazo: string;
  usuario?: {
    username: string;
    email: string;
    rol: string;
  };
};

const statusStyles: Record<PermisoStatus, string> = {
  pendiente: 'border-amber-200 bg-amber-50 text-amber-700',
  aprobada: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  rechazada: 'border-rose-200 bg-rose-50 text-rose-700',
  cancelada: 'border-slate-200 bg-slate-100 text-slate-600',
};

const statusLabels: Record<PermisoStatus, string> = {
  pendiente: 'Pendiente',
  aprobada: 'Aprobado',
  rechazada: 'Rechazado',
  cancelada: 'Cancelado',
};

const avatarTones = [
  'bg-orange-500',
  'bg-indigo-500',
  'bg-emerald-500',
  'bg-violet-500',
  'bg-teal-500',
  'bg-rose-500',
];

function getUserName(request: PermisoRequest) {
  return request.usuario?.username || request.usuario?.email || `Usuario ${request.usuario_id}`;
}

function getInitials(name: string) {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('') || 'U';
}

async function readApiError(response: Response) {
  try {
    const data = await response.json();
    return data?.error ?? 'Ocurrio un error.';
  } catch {
    return 'Ocurrio un error.';
  }
}

export default function AdminPermisosView() {
  const [requests, setRequests] = useState<PermisoRequest[]>([]);
  const [today, setToday] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [actionId, setActionId] = useState<number | null>(null);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const pendingRequests = requests
    .filter((request) => request.estado === 'pendiente')
    .sort((a, b) => a.fecha.localeCompare(b.fecha) || (a.hora_desde ?? '').localeCompare(b.hora_desde ?? ''));
  const todayRequests = requests.filter((request) => request.estado === 'aprobada' && request.fecha === today);
  const historyRequests = requests.filter((request) => request.estado !== 'pendiente').slice(0, 20);

  const loadAdminData = async () => {
    setIsLoading(true);

    try {
      const response = await fetch('/api/admin/permisos/solicitudes', { cache: 'no-store' });

      if (!response.ok) {
        throw new Error(await readApiError(response));
      }

      const data = await response.json();
      setRequests(Array.isArray(data.solicitudes) ? data.solicitudes : []);
      setToday(data.hoy ?? '');
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'No se pudieron cargar los permisos.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadAdminData();
  }, []);

  const updateStatus = async (id: number, estado: 'aprobada' | 'rechazada') => {
    setSuccessMessage('');
    setErrorMessage('');

    const motivo = estado === 'rechazada'
      ? window.prompt('Motivo de rechazo opcional')
      : '';

    // Cerrar el prompt con "Cancelar" no rechaza la solicitud
    if (motivo === null) return;

    setActionId(id);

    try {
      const response = await fetch(`/api/admin/permisos/solicitudes/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ estado, motivo_rechazo: motivo.trim() }),
      });

      if (!response.ok) {
        throw new Error(await readApiError(response));
      }

      setSuccessMessage(estado === 'aprobada' ? 'Permiso aprobado.' : 'Permiso rechazado.');
      await loadAdminData();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'No se pudo actualizar la solicitud.');
    } finally {
      setActionId(null);
    }
  };

  const summaryItems = [
    { label: 'Pendientes', value: pendingRequests.length, icon: ClockIcon, tone: 'bg-amber-50 text-amber-600' },
    { label: 'Fuera hoy', value: todayRequests.length, icon: UserGroupIcon, tone: 'bg-orange-50 text-orange-600' },
    { label: 'Aprobados', value: requests.filter((r) => r.estado === 'aprobada').length, icon: CheckIcon, tone: 'bg-emerald-50 text-emerald-600' },
  ];

  return (
    <main className="min-h-full bg-slate-50 px-4 py-6 text-slate-950">
      <div className="mx-auto max-w-7xl space-y-6">
        <header className="border-b border-slate-200 pb-6">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-orange-600">Administracion</p>
          <h1 className="mt-2 text-3xl font-semibold text-slate-950">Permisos de salida</h1>
          <p className="mt-2 max-w-2xl text-sm text-slate-600">
            Revisá los permisos pedidos y mirá quién está fuera hoy.
          </p>
        </header>

        {successMessage && (
          <div className="rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800">
            {successMessage}
          </div>
        )}

        {errorMessage && (
          <div className="rounded-md border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
            {errorMessage}
          </div>
        )}

        <section className="grid gap-4 md:grid-cols-3">
          {summaryItems.map((item) => {
            const Icon = item.icon;
            return (
              <article key={item.label} className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium text-slate-500">{item.label}</p>
                    <p className="mt-2 text-3xl font-semibold text-slate-950">{isLoading ? '-' : item.value}</p>
                  </div>
                  <span className={clsx('rounded-md p-3', item.tone)}>
                    <Icon className="h-6 w-6" />
                  </span>
                </div>
              </article>
            );
          })}
        </section>

        <section className="rounded-lg border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-col gap-2 border-b border-slate-200 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-xl font-semibold text-slate-950">Fuera hoy</h2>
              <p className="mt-1 text-sm text-slate-500">Permisos aprobados para el día de hoy.</p>
            </div>
            <span className="rounded-full bg-orange-50 px-3 py-1 text-sm font-semibold text-orange-700">
              {todayRequests.length} hoy
            </span>
          </div>

          <div className="grid gap-4 p-6 lg:grid-cols-2">
            {!isLoading && todayRequests.length === 0 && (
              <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-6 text-center lg:col-span-2">
                <p className="font-semibold text-slate-700">Nadie tiene permiso aprobado para hoy.</p>
              </div>
            )}

            {todayRequests.map((request) => {
              const name = getUserName(request);
              return (
                <article key={request.id} className={clsx('rounded-lg border border-l-4 border-slate-200 bg-slate-50 p-4', tipoBarStyles[request.tipo])}>
                  <div className="flex items-start gap-3">
                    <span className={clsx('flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white', avatarTones[request.usuario_id % avatarTones.length])}>
                      {getInitials(name)}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-semibold text-slate-950">{name}</h3>
                        <span className={clsx('rounded-full border px-3 py-1 text-xs font-semibold', tipoStyles[request.tipo])}>
                          {TIPOS_PERMISO[request.tipo]}
                        </span>
                      </div>
                      <p className="mt-2 text-sm font-semibold text-slate-800">{formatPermisoHorario(request)}</p>
                      {request.comentario && <p className="mt-1 text-sm text-slate-500">{request.comentario}</p>}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </section>

        <section className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 px-6 py-5">
            <h2 className="text-xl font-semibold text-slate-950">Solicitudes pendientes</h2>
            <p className="mt-1 text-sm text-slate-500">Ordenadas por fecha del permiso, las más próximas primero.</p>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
              <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-6 py-4">Usuario</th>
                  <th className="px-6 py-4">Día</th>
                  <th className="px-6 py-4">Horario</th>
                  <th className="px-6 py-4">Motivo</th>
                  <th className="px-6 py-4">Comentario</th>
                  <th className="px-6 py-4">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 bg-white">
                {!isLoading && pendingRequests.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-sm text-slate-500">
                      No hay solicitudes pendientes.
                    </td>
                  </tr>
                )}

                {isLoading && (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-sm text-slate-500">
                      Cargando solicitudes...
                    </td>
                  </tr>
                )}

                {pendingRequests.map((request) => {
                  const name = getUserName(request);
                  const isActing = actionId === request.id;

                  return (
                    <tr key={request.id} className="align-top">
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-3">
                          <span className={clsx('flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white', avatarTones[request.usuario_id % avatarTones.length])}>
                            {getInitials(name)}
                          </span>
                          <div>
                            <p className="font-semibold text-slate-950">{name}</p>
                            <p className="mt-1 text-xs font-medium uppercase tracking-wide text-slate-500">{request.usuario?.rol || 'Sin rol'}</p>
                          </div>
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-6 py-5 capitalize text-slate-700">{formatPermisoDate(request.fecha)}</td>
                      <td className="whitespace-nowrap px-6 py-5 font-semibold text-slate-700">{formatPermisoHorario(request)}</td>
                      <td className="px-6 py-5">
                        <span className={clsx('inline-flex rounded-full border px-3 py-1 text-xs font-semibold', tipoStyles[request.tipo])}>
                          {TIPOS_PERMISO[request.tipo]}
                        </span>
                      </td>
                      <td className="max-w-xs px-6 py-5 text-slate-600">{request.comentario || 'Sin comentario.'}</td>
                      <td className="px-6 py-5">
                        <div className="flex flex-wrap gap-2">
                          <button
                            type="button"
                            disabled={isActing}
                            onClick={() => updateStatus(request.id, 'aprobada')}
                            className="inline-flex items-center gap-2 rounded-md bg-emerald-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-slate-300"
                          >
                            <CheckIcon className="h-4 w-4" />
                            Aprobar
                          </button>
                          <button
                            type="button"
                            disabled={isActing}
                            onClick={() => updateStatus(request.id, 'rechazada')}
                            className="inline-flex items-center gap-2 rounded-md border border-rose-200 bg-white px-3 py-2 text-xs font-semibold text-rose-700 transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:border-slate-200 disabled:text-slate-400"
                          >
                            <XMarkIcon className="h-4 w-4" />
                            Rechazar
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>

        <section className="rounded-lg border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 px-6 py-5">
            <h2 className="text-xl font-semibold text-slate-950">Historial reciente</h2>
            <p className="mt-1 text-sm text-slate-500">Últimos 20 permisos resueltos o cancelados.</p>
          </div>
          <div className="divide-y divide-slate-200">
            {!isLoading && historyRequests.length === 0 && (
              <div className="px-6 py-8 text-center text-sm text-slate-500">Todavía no hay permisos resueltos.</div>
            )}

            {historyRequests.map((request) => (
              <article key={request.id} className="grid gap-2 px-6 py-4 text-sm md:grid-cols-[1fr_1fr_1.2fr_110px] md:items-center">
                <p className="font-semibold text-slate-950">{getUserName(request)}</p>
                <p className="capitalize text-slate-600">{formatPermisoDate(request.fecha)}</p>
                <p className="text-slate-600">{formatPermisoHorario(request)} · {TIPOS_PERMISO[request.tipo]}</p>
                <span className={clsx('w-fit rounded-full border px-3 py-1 text-xs font-semibold', statusStyles[request.estado])}>
                  {statusLabels[request.estado]}
                </span>
              </article>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
