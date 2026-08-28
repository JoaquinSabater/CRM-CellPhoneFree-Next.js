'use client';

import { useEffect, useState } from 'react';
import clsx from 'clsx';
import {
  CalendarDaysIcon,
  CheckIcon,
  ClockIcon,
  UserGroupIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';

type VacationStatus = 'pendiente' | 'aprobada' | 'rechazada' | 'cancelada';

type VacationRequest = {
  id: number;
  usuario_id: number;
  fecha_desde: string;
  fecha_hasta: string;
  cantidad_dias: number;
  comentario: string;
  estado: VacationStatus;
  motivo_rechazo: string;
  usuario?: {
    username: string;
    email: string;
    rol: string;
  };
};

const statusStyles: Record<VacationStatus | 'en_curso', string> = {
  pendiente: 'border-amber-200 bg-amber-50 text-amber-700',
  aprobada: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  rechazada: 'border-rose-200 bg-rose-50 text-rose-700',
  cancelada: 'border-slate-200 bg-slate-100 text-slate-600',
  en_curso: 'border-orange-200 bg-orange-50 text-orange-700',
};

const statusLabels: Record<VacationStatus | 'en_curso', string> = {
  pendiente: 'Pendiente',
  aprobada: 'Aprobada',
  rechazada: 'Rechazada',
  cancelada: 'Cancelada',
  en_curso: 'En curso',
};

const avatarTones = [
  'bg-orange-500',
  'bg-indigo-500',
  'bg-emerald-500',
  'bg-violet-500',
  'bg-teal-500',
  'bg-rose-500',
];

function formatShortDate(value: string) {
  if (!value) return '-';
  return new Intl.DateTimeFormat('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date(`${value.slice(0, 10)}T00:00:00`));
}

function getUserName(request: VacationRequest) {
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

function getAvatarTone(id: number) {
  return avatarTones[id % avatarTones.length];
}

async function readApiError(response: Response) {
  try {
    const data = await response.json();
    return data?.error ?? 'Ocurrio un error.';
  } catch {
    return 'Ocurrio un error.';
  }
}

export default function AdminVacacionesView() {
  const [requests, setRequests] = useState<VacationRequest[]>([]);
  const [activeVacations, setActiveVacations] = useState<VacationRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [actionId, setActionId] = useState<number | null>(null);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const pendingRequests = requests.filter((request) => request.estado === 'pendiente');
  const approvedCount = requests.filter((request) => request.estado === 'aprobada').length;
  const rejectedCount = requests.filter((request) => request.estado === 'rechazada').length;

  const loadAdminData = async () => {
    setIsLoading(true);
    setErrorMessage('');

    try {
      const [requestsResponse, activeResponse] = await Promise.all([
        fetch('/api/admin/vacaciones/solicitudes', { cache: 'no-store' }),
        fetch('/api/admin/vacaciones/activas', { cache: 'no-store' }),
      ]);

      if (!requestsResponse.ok) {
        throw new Error(await readApiError(requestsResponse));
      }

      if (!activeResponse.ok) {
        throw new Error(await readApiError(activeResponse));
      }

      const requestsData = await requestsResponse.json();
      const activeData = await activeResponse.json();

      setRequests(Array.isArray(requestsData.solicitudes) ? requestsData.solicitudes : []);
      setActiveVacations(Array.isArray(activeData.vacaciones) ? activeData.vacaciones : []);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'No se pudo cargar administracion de vacaciones.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadAdminData();
  }, []);

  const updateStatus = async (id: number, status: 'aprobada' | 'rechazada') => {
    setSuccessMessage('');
    setErrorMessage('');
    setActionId(id);

    const motivo = status === 'rechazada'
      ? window.prompt('Motivo de rechazo opcional')?.trim() ?? ''
      : '';

    try {
      const response = await fetch(`/api/admin/vacaciones/solicitudes/${id}/${status === 'aprobada' ? 'aprobar' : 'rechazar'}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: status === 'rechazada' ? JSON.stringify({ motivo_rechazo: motivo }) : undefined,
      });

      if (!response.ok) {
        throw new Error(await readApiError(response));
      }

      setSuccessMessage(status === 'aprobada' ? 'Solicitud aprobada.' : 'Solicitud rechazada.');
      await loadAdminData();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'No se pudo actualizar la solicitud.');
    } finally {
      setActionId(null);
    }
  };

  const summaryItems = [
    { label: 'Pendientes', value: pendingRequests.length, icon: ClockIcon, tone: 'bg-amber-50 text-amber-600' },
    { label: 'Aprobadas', value: approvedCount, icon: CheckIcon, tone: 'bg-emerald-50 text-emerald-600' },
    { label: 'Rechazadas', value: rejectedCount, icon: XMarkIcon, tone: 'bg-rose-50 text-rose-600' },
  ];

  return (
    <main className="min-h-full bg-slate-50 px-4 py-6 text-slate-950">
      <div className="mx-auto max-w-7xl space-y-6">
        <header className="flex flex-col gap-4 border-b border-slate-200 pb-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-orange-600">Administracion</p>
            <h1 className="mt-2 text-3xl font-semibold text-slate-950">Solicitudes de vacaciones</h1>
            <p className="mt-2 max-w-2xl text-sm text-slate-600">
              Vista simple para revisar solicitudes y ver quien tiene vacaciones cargadas.
            </p>
          </div>
          <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 shadow-sm">
            <UserGroupIcon className="h-5 w-5 text-orange-600" />
            {requests.length} solicitudes cargadas
          </div>
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
              <h2 className="text-xl font-semibold text-slate-950">Personas actualmente de vacaciones</h2>
              <p className="mt-1 text-sm text-slate-500">Usuarios con solicitud aprobada y fecha actual dentro del rango.</p>
            </div>
            <span className="rounded-full bg-orange-50 px-3 py-1 text-sm font-semibold text-orange-700">
              {activeVacations.length} en curso
            </span>
          </div>

          <div className="grid gap-4 p-6 lg:grid-cols-2">
            {!isLoading && activeVacations.length === 0 && (
              <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-6 text-center lg:col-span-2">
                <p className="font-semibold text-slate-700">No hay personas de vacaciones actualmente.</p>
                <p className="mt-1 text-sm text-slate-500">Cuando existan vacaciones aprobadas en curso, se van a mostrar aca.</p>
              </div>
            )}

            {isLoading && (
              <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-6 text-center text-sm text-slate-500 lg:col-span-2">
                Cargando vacaciones activas...
              </div>
            )}

            {activeVacations.map((request) => {
              const name = getUserName(request);
              return (
                <article key={request.id} className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                  <div className="flex items-start gap-3">
                    <span className={clsx('flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white', getAvatarTone(request.usuario_id))}>
                      {getInitials(name)}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-semibold text-slate-950">{name}</h3>
                        <span className={clsx('rounded-full border px-3 py-1 text-xs font-semibold', statusStyles.en_curso)}>
                          {statusLabels.en_curso}
                        </span>
                      </div>
                      <p className="mt-1 text-sm font-medium text-slate-500">{request.usuario?.rol || 'Sin rol'}</p>
                      <div className="mt-4 grid gap-3 sm:grid-cols-3">
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Desde</p>
                          <p className="mt-1 text-sm font-semibold text-slate-800">{formatShortDate(request.fecha_desde)}</p>
                        </div>
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Hasta</p>
                          <p className="mt-1 text-sm font-semibold text-slate-800">{formatShortDate(request.fecha_hasta)}</p>
                        </div>
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Dias</p>
                          <p className="mt-1 text-sm font-semibold text-slate-800">{request.cantidad_dias}</p>
                        </div>
                      </div>
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
            <p className="mt-1 text-sm text-slate-500">Aprobar o rechazar actualiza el estado y el saldo del usuario.</p>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
              <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-6 py-4">Usuario</th>
                  <th className="px-6 py-4">Rango</th>
                  <th className="px-6 py-4">Dias</th>
                  <th className="px-6 py-4">Comentario</th>
                  <th className="px-6 py-4">Estado</th>
                  <th className="px-6 py-4">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 bg-white">
                {!isLoading && pendingRequests.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-sm text-slate-500">
                      No hay solicitudes pendientes cargadas.
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
                          <span className={clsx('flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white', getAvatarTone(request.usuario_id))}>
                            {getInitials(name)}
                          </span>
                          <div>
                            <p className="font-semibold text-slate-950">{name}</p>
                            <p className="mt-1 text-xs font-medium uppercase tracking-wide text-slate-500">{request.usuario?.rol || 'Sin rol'}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-5 text-slate-700">
                        {formatShortDate(request.fecha_desde)} al {formatShortDate(request.fecha_hasta)}
                      </td>
                      <td className="px-6 py-5 font-semibold text-slate-700">{request.cantidad_dias}</td>
                      <td className="max-w-xs px-6 py-5 text-slate-600">{request.comentario || 'Sin comentario.'}</td>
                      <td className="px-6 py-5">
                        <span className={clsx('inline-flex rounded-full border px-3 py-1 text-xs font-semibold', statusStyles[request.estado])}>
                          {statusLabels[request.estado]}
                        </span>
                      </td>
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

        <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-start gap-3">
            <span className="rounded-md bg-orange-50 p-3 text-orange-600">
              <CalendarDaysIcon className="h-6 w-6" />
            </span>
            <div>
              <h2 className="text-base font-semibold text-slate-950">Vacaciones conectadas</h2>
              <p className="mt-1 text-sm text-slate-500">
                Los cambios se guardan en la base de datos y actualizan los saldos correspondientes.
              </p>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
