'use client';

import { type FormEvent, useEffect, useState } from 'react';
import clsx from 'clsx';
import {
  CheckCircleIcon,
  ClockIcon,
  PaperAirplaneIcon,
  PlusIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import { TIPOS_PERMISO, type PermisoStatus, type TipoPermiso } from '@/app/lib/permisos';

type PermisoRequest = {
  id: number;
  tipo: TipoPermiso;
  fecha: string;
  dia_completo: boolean;
  hora_desde: string | null;
  hora_hasta: string | null;
  comentario: string;
  estado: PermisoStatus;
  motivo_rechazo: string;
  fecha_solicitud: string;
};

export const tipoStyles: Record<TipoPermiso, string> = {
  personal: 'border-orange-500 bg-orange-50 text-orange-700',
  medico: 'border-rose-500 bg-rose-50 text-rose-700',
  tramite: 'border-sky-500 bg-sky-50 text-sky-700',
  familiar: 'border-violet-500 bg-violet-50 text-violet-700',
  estudio: 'border-emerald-500 bg-emerald-50 text-emerald-700',
  otro: 'border-slate-500 bg-slate-50 text-slate-700',
};

/** Barra de color a la izquierda de cada permiso, como en Shifts. */
export const tipoBarStyles: Record<TipoPermiso, string> = {
  personal: 'border-l-orange-500',
  medico: 'border-l-rose-500',
  tramite: 'border-l-sky-500',
  familiar: 'border-l-violet-500',
  estudio: 'border-l-emerald-500',
  otro: 'border-l-slate-500',
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

function minutesBetween(from: string, to: string) {
  if (!from || !to) return 0;
  const [fh, fm] = from.split(':').map(Number);
  const [th, tm] = to.split(':').map(Number);
  return th * 60 + tm - (fh * 60 + fm);
}

export function formatDuration(minutes: number) {
  if (minutes <= 0) return '-';
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  if (!hours) return `${rest} min`;
  return rest ? `${hours} h ${rest} min` : `${hours} h`;
}

export function formatPermisoDate(value: string) {
  if (!value) return '-';
  return new Intl.DateTimeFormat('es-AR', {
    weekday: 'short',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date(`${value.slice(0, 10)}T00:00:00`));
}

export function formatPermisoHorario(permiso: { dia_completo: boolean; hora_desde: string | null; hora_hasta: string | null }) {
  if (permiso.dia_completo) return 'Todo el día';
  return `${permiso.hora_desde} a ${permiso.hora_hasta} (${formatDuration(minutesBetween(permiso.hora_desde ?? '', permiso.hora_hasta ?? ''))})`;
}

async function readApiError(response: Response) {
  try {
    const data = await response.json();
    return data?.error ?? 'Ocurrio un error.';
  } catch {
    return 'Ocurrio un error.';
  }
}

export default function SolicitudPermisosView() {
  const [requests, setRequests] = useState<PermisoRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [cancelingId, setCancelingId] = useState<number | null>(null);
  const [tipo, setTipo] = useState<TipoPermiso>('personal');
  const [fecha, setFecha] = useState('');
  const [diaCompleto, setDiaCompleto] = useState(false);
  const [horaDesde, setHoraDesde] = useState('');
  const [horaHasta, setHoraHasta] = useState('');
  const [comment, setComment] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const duration = minutesBetween(horaDesde, horaHasta);
  const isValid = Boolean(fecha) && (diaCompleto || duration > 0);
  const pendingCount = requests.filter((request) => request.estado === 'pendiente').length;
  const approvedCount = requests.filter((request) => request.estado === 'aprobada').length;

  const loadPermisos = async () => {
    setIsLoading(true);

    try {
      const response = await fetch('/api/permisos/solicitudes', { cache: 'no-store' });

      if (!response.ok) {
        throw new Error(await readApiError(response));
      }

      const data = await response.json();
      setRequests(Array.isArray(data.solicitudes) ? data.solicitudes : []);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'No se pudieron cargar los permisos.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadPermisos();
  }, []);

  const resetForm = () => {
    setTipo('personal');
    setFecha('');
    setDiaCompleto(false);
    setHoraDesde('');
    setHoraHasta('');
    setComment('');
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSuccessMessage('');
    setErrorMessage('');

    if (!isValid) {
      setErrorMessage('La hora de regreso tiene que ser posterior a la de salida.');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch('/api/permisos/solicitudes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tipo,
          fecha,
          dia_completo: diaCompleto,
          hora_desde: diaCompleto ? null : horaDesde,
          hora_hasta: diaCompleto ? null : horaHasta,
          comentario: comment,
        }),
      });

      if (!response.ok) {
        throw new Error(await readApiError(response));
      }

      resetForm();
      setIsFormOpen(false);
      setSuccessMessage('Solicitud enviada. Administración la va a revisar.');
      await loadPermisos();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'No se pudo crear la solicitud.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const cancelRequest = async (id: number) => {
    if (!window.confirm('¿Cancelar esta solicitud de permiso?')) return;

    setSuccessMessage('');
    setErrorMessage('');
    setCancelingId(id);

    try {
      const response = await fetch(`/api/permisos/solicitudes/${id}/cancelar`, { method: 'PATCH' });

      if (!response.ok) {
        throw new Error(await readApiError(response));
      }

      setSuccessMessage('Solicitud cancelada.');
      await loadPermisos();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'No se pudo cancelar la solicitud.');
    } finally {
      setCancelingId(null);
    }
  };

  return (
    <main className="min-h-full bg-slate-50 px-4 py-6 text-slate-950">
      <div className="mx-auto max-w-7xl space-y-6">
        <header className="flex flex-col gap-4 border-b border-slate-200 pb-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-orange-600">Solicitudes internas</p>
            <h1 className="mt-2 text-3xl font-semibold text-slate-950">Permisos de salida</h1>
            <p className="mt-2 max-w-2xl text-sm text-slate-600">
              Pedí permiso para salir unas horas o un día puntual. Administración lo aprueba o rechaza.
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              setIsFormOpen(true);
              setSuccessMessage('');
              setErrorMessage('');
            }}
            disabled={isLoading}
            className="inline-flex items-center justify-center gap-2 rounded-md bg-orange-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-orange-700 disabled:cursor-not-allowed disabled:bg-slate-300"
          >
            <PlusIcon className="h-5 w-5" />
            Pedir permiso
          </button>
        </header>

        {successMessage && (
          <div className="flex items-center gap-3 rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800">
            <CheckCircleIcon className="h-5 w-5" />
            {successMessage}
          </div>
        )}

        {errorMessage && (
          <div className="rounded-md border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
            {errorMessage}
          </div>
        )}

        <section className="grid gap-4 sm:grid-cols-2">
          {[
            { label: 'Pendientes', value: pendingCount, hint: 'esperando revision', icon: ClockIcon },
            { label: 'Aprobados', value: approvedCount, hint: 'permisos otorgados', icon: CheckCircleIcon },
          ].map((item) => {
            const Icon = item.icon;
            return (
              <article key={item.label} className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium text-slate-500">{item.label}</p>
                    <p className="mt-2 text-3xl font-semibold text-slate-950">{isLoading ? '-' : item.value}</p>
                  </div>
                  <span className="rounded-md bg-orange-50 p-3 text-orange-600">
                    <Icon className="h-6 w-6" />
                  </span>
                </div>
                <p className="mt-3 text-xs font-medium uppercase tracking-wide text-slate-400">{item.hint}</p>
              </article>
            );
          })}
        </section>

        {isFormOpen && (
          <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-semibold text-slate-950">Nueva solicitud de permiso</h2>
                <p className="mt-1 text-sm text-slate-500">Elegí el motivo, el día y el horario.</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  resetForm();
                  setIsFormOpen(false);
                }}
                className="rounded-md p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-800"
                aria-label="Cerrar formulario"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="mt-6 space-y-5">
              <fieldset>
                <legend className="text-sm font-medium text-slate-700">Motivo</legend>
                <div className="mt-2 flex flex-wrap gap-2">
                  {(Object.keys(TIPOS_PERMISO) as TipoPermiso[]).map((key) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setTipo(key)}
                      className={clsx(
                        'rounded-full border px-4 py-1.5 text-sm font-semibold transition',
                        tipo === key
                          ? tipoStyles[key]
                          : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50',
                      )}
                    >
                      {TIPOS_PERMISO[key]}
                    </button>
                  ))}
                </div>
              </fieldset>

              <div className="grid gap-4 lg:grid-cols-[1fr_1fr_1fr_160px]">
                <label className="block">
                  <span className="text-sm font-medium text-slate-700">Fecha</span>
                  <input
                    type="date"
                    value={fecha}
                    onChange={(event) => setFecha(event.target.value)}
                    className="mt-2 block w-full rounded-md border-slate-300 text-sm shadow-sm focus:border-orange-500 focus:ring-orange-500"
                    required
                  />
                </label>
                <label className="block">
                  <span className="text-sm font-medium text-slate-700">Sale a las</span>
                  <input
                    type="time"
                    value={horaDesde}
                    onChange={(event) => setHoraDesde(event.target.value)}
                    disabled={diaCompleto}
                    required={!diaCompleto}
                    className="mt-2 block w-full rounded-md border-slate-300 text-sm shadow-sm focus:border-orange-500 focus:ring-orange-500 disabled:bg-slate-100 disabled:text-slate-400"
                  />
                </label>
                <label className="block">
                  <span className="text-sm font-medium text-slate-700">Vuelve a las</span>
                  <input
                    type="time"
                    value={horaHasta}
                    onChange={(event) => setHoraHasta(event.target.value)}
                    disabled={diaCompleto}
                    required={!diaCompleto}
                    className="mt-2 block w-full rounded-md border-slate-300 text-sm shadow-sm focus:border-orange-500 focus:ring-orange-500 disabled:bg-slate-100 disabled:text-slate-400"
                  />
                </label>
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Duración</p>
                  <p className={clsx('mt-2 text-xl font-semibold', !diaCompleto && horaDesde && horaHasta && duration <= 0 ? 'text-rose-600' : 'text-slate-950')}>
                    {diaCompleto ? 'Todo el día' : formatDuration(duration)}
                  </p>
                </div>
              </div>

              <label className="flex w-fit cursor-pointer items-center gap-3">
                <input
                  type="checkbox"
                  checked={diaCompleto}
                  onChange={(event) => setDiaCompleto(event.target.checked)}
                  className="h-5 w-5 rounded border-slate-300 text-orange-600 focus:ring-orange-500"
                />
                <span className="text-sm font-medium text-slate-700">Todo el día</span>
              </label>

              <label className="block">
                <span className="text-sm font-medium text-slate-700">Comentario opcional</span>
                <textarea
                  value={comment}
                  onChange={(event) => setComment(event.target.value)}
                  rows={3}
                  maxLength={500}
                  className="mt-2 block w-full rounded-md border-slate-300 text-sm shadow-sm focus:border-orange-500 focus:ring-orange-500"
                  placeholder="Agrega un comentario para quien revise la solicitud."
                />
              </label>

              <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={() => {
                    resetForm();
                    setIsFormOpen(false);
                  }}
                  className="inline-flex items-center justify-center rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={!isValid || isSubmitting}
                  className="inline-flex items-center justify-center gap-2 rounded-md bg-orange-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-orange-700 disabled:cursor-not-allowed disabled:bg-slate-300"
                >
                  <PaperAirplaneIcon className="h-5 w-5" />
                  {isSubmitting ? 'Enviando...' : 'Enviar solicitud'}
                </button>
              </div>
            </form>
          </section>
        )}

        <section className="rounded-lg border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-col gap-2 border-b border-slate-200 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-xl font-semibold text-slate-950">Mis permisos</h2>
              <p className="mt-1 text-sm text-slate-500">Historial de permisos pedidos.</p>
            </div>
            <span className="rounded-full bg-slate-100 px-3 py-1 text-sm font-semibold text-slate-700">
              {requests.length} solicitudes
            </span>
          </div>
          <div className="divide-y divide-slate-200">
            {!isLoading && requests.length === 0 && (
              <div className="px-6 py-8 text-center text-sm text-slate-500">
                No hay permisos cargados.
              </div>
            )}

            {isLoading && (
              <div className="px-6 py-8 text-center text-sm text-slate-500">
                Cargando permisos...
              </div>
            )}

            {requests.map((request) => (
              <article key={request.id} className="grid gap-3 px-6 py-5 lg:grid-cols-[1.3fr_110px_120px_1fr_auto] lg:items-center">
                <div className={clsx('border-l-4 pl-3', tipoBarStyles[request.tipo])}>
                  <p className="font-semibold capitalize text-slate-950">{formatPermisoDate(request.fecha)}</p>
                  <p className="mt-1 text-sm text-slate-500">{formatPermisoHorario(request)}</p>
                </div>
                <span className={clsx('w-fit rounded-full border px-3 py-1 text-xs font-semibold', tipoStyles[request.tipo])}>
                  {TIPOS_PERMISO[request.tipo]}
                </span>
                <span className={clsx('w-fit rounded-full border px-3 py-1 text-xs font-semibold', statusStyles[request.estado])}>
                  {statusLabels[request.estado]}
                </span>
                <div className="text-sm text-slate-600">
                  <p>{request.comentario || 'Sin comentario.'}</p>
                  {request.estado === 'rechazada' && request.motivo_rechazo && (
                    <p className="mt-1 text-rose-600">Motivo del rechazo: {request.motivo_rechazo}</p>
                  )}
                </div>
                <div>
                  {request.estado === 'pendiente' && (
                    <button
                      type="button"
                      onClick={() => cancelRequest(request.id)}
                      disabled={cancelingId === request.id}
                      className="inline-flex items-center gap-1 rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:text-slate-400"
                    >
                      <XMarkIcon className="h-4 w-4" />
                      Cancelar
                    </button>
                  )}
                </div>
              </article>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
