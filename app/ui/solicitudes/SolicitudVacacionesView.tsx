'use client';

import { type FormEvent, useEffect, useMemo, useState } from 'react';
import clsx from 'clsx';
import {
  CalendarDaysIcon,
  CheckCircleIcon,
  ClockIcon,
  PaperAirplaneIcon,
  PlusIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';

type VacationStatus = 'pendiente' | 'aprobada' | 'rechazada' | 'cancelada';

type VacationBalance = {
  dias_totales: number;
  dias_usados: number;
  dias_pendientes: number;
  dias_restantes: number;
};

type VacationRequest = {
  id: number;
  fecha_desde: string;
  fecha_hasta: string;
  cantidad_dias: number;
  comentario: string;
  estado: VacationStatus;
  fecha_solicitud: string;
};

const emptyBalance: VacationBalance = {
  dias_totales: 0,
  dias_usados: 0,
  dias_pendientes: 0,
  dias_restantes: 0,
};

const statusStyles: Record<VacationStatus, string> = {
  pendiente: 'border-amber-200 bg-amber-50 text-amber-700',
  aprobada: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  rechazada: 'border-rose-200 bg-rose-50 text-rose-700',
  cancelada: 'border-slate-200 bg-slate-100 text-slate-600',
};

const statusLabels: Record<VacationStatus, string> = {
  pendiente: 'Pendiente',
  aprobada: 'Aprobada',
  rechazada: 'Rechazada',
  cancelada: 'Cancelada',
};

function countDays(from: string, to: string) {
  if (!from || !to) return 0;
  const start = new Date(`${from}T00:00:00`);
  const end = new Date(`${to}T00:00:00`);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end < start) return 0;
  return Math.floor((end.getTime() - start.getTime()) / 86400000) + 1;
}

function formatDate(value: string) {
  if (!value) return '-';
  return new Intl.DateTimeFormat('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date(`${value.slice(0, 10)}T00:00:00`));
}

async function readApiError(response: Response) {
  try {
    const data = await response.json();
    return data?.error ?? 'Ocurrio un error.';
  } catch {
    return 'Ocurrio un error.';
  }
}

export default function SolicitudVacacionesView() {
  const [balance, setBalance] = useState<VacationBalance>(emptyBalance);
  const [requests, setRequests] = useState<VacationRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [comment, setComment] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const requestedDays = countDays(from, to);
  const hasEnoughDays = requestedDays > 0 && requestedDays <= balance.dias_restantes;

  const loadVacationData = async () => {
    setIsLoading(true);
    setErrorMessage('');

    try {
      const response = await fetch('/api/vacaciones/resumen', { cache: 'no-store' });

      if (!response.ok) {
        throw new Error(await readApiError(response));
      }

      const data = await response.json();
      setBalance(data.saldo ?? emptyBalance);
      setRequests(Array.isArray(data.solicitudes) ? data.solicitudes : []);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'No se pudieron cargar las vacaciones.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadVacationData();
  }, []);

  const resetForm = () => {
    setFrom('');
    setTo('');
    setComment('');
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSuccessMessage('');
    setErrorMessage('');

    if (requestedDays <= 0) {
      setErrorMessage('Las fechas seleccionadas no son validas.');
      return;
    }

    if (requestedDays > balance.dias_restantes) {
      setErrorMessage('No tenes dias suficientes disponibles.');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch('/api/vacaciones/solicitudes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fecha_desde: from,
          fecha_hasta: to,
          cantidad_dias: requestedDays,
          comentario: comment,
        }),
      });

      if (!response.ok) {
        throw new Error(await readApiError(response));
      }

      resetForm();
      setIsFormOpen(false);
      setSuccessMessage('Solicitud creada correctamente.');
      await loadVacationData();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'No se pudo crear la solicitud.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const summaryItems = useMemo(() => [
    { label: 'Disponibles', value: balance.dias_totales, hint: 'dias asignados', icon: CalendarDaysIcon },
    { label: 'Utilizados', value: balance.dias_usados, hint: 'dias aprobados', icon: CheckCircleIcon },
    { label: 'Pendientes', value: balance.dias_pendientes, hint: 'esperando revision', icon: ClockIcon },
    { label: 'Restantes', value: balance.dias_restantes, hint: 'saldo disponible', icon: CalendarDaysIcon },
  ], [balance]);

  return (
    <main className="min-h-full bg-slate-50 px-4 py-6 text-slate-950">
      <div className="mx-auto max-w-7xl space-y-6">
        <header className="flex flex-col gap-4 border-b border-slate-200 pb-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-orange-600">Solicitudes internas</p>
            <h1 className="mt-2 text-3xl font-semibold text-slate-950">Vacaciones</h1>
            <p className="mt-2 max-w-2xl text-sm text-slate-600">
              Consulta tu saldo y carga una solicitud de vacaciones.
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
            Pedir vacaciones
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

        <section className="grid gap-4 md:grid-cols-4">
          {summaryItems.map((item) => {
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
                <h2 className="text-xl font-semibold text-slate-950">Nueva solicitud de vacaciones</h2>
                <p className="mt-1 text-sm text-slate-500">Completa el rango de fechas para enviar la solicitud.</p>
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

            <form onSubmit={handleSubmit} className="mt-6 grid gap-4 lg:grid-cols-[1fr_1fr_160px]">
              <label className="block">
                <span className="text-sm font-medium text-slate-700">Fecha desde</span>
                <input
                  type="date"
                  value={from}
                  onChange={(event) => setFrom(event.target.value)}
                  className="mt-2 block w-full rounded-md border-slate-300 text-sm shadow-sm focus:border-orange-500 focus:ring-orange-500"
                  required
                />
              </label>
              <label className="block">
                <span className="text-sm font-medium text-slate-700">Fecha hasta</span>
                <input
                  type="date"
                  value={to}
                  onChange={(event) => setTo(event.target.value)}
                  className="mt-2 block w-full rounded-md border-slate-300 text-sm shadow-sm focus:border-orange-500 focus:ring-orange-500"
                  required
                />
              </label>
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Cantidad</p>
                <p className="mt-2 text-2xl font-semibold text-slate-950">{requestedDays}</p>
                <p className={clsx('text-sm', requestedDays > balance.dias_restantes ? 'text-rose-600' : 'text-slate-500')}>
                  dias
                </p>
              </div>
              <label className="block lg:col-span-3">
                <span className="text-sm font-medium text-slate-700">Motivo o comentario opcional</span>
                <textarea
                  value={comment}
                  onChange={(event) => setComment(event.target.value)}
                  rows={3}
                  className="mt-2 block w-full rounded-md border-slate-300 text-sm shadow-sm focus:border-orange-500 focus:ring-orange-500"
                  placeholder="Agrega un comentario para quien revise la solicitud."
                />
              </label>
              <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end lg:col-span-3">
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
                  disabled={!hasEnoughDays || isSubmitting}
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
              <h2 className="text-xl font-semibold text-slate-950">Mis solicitudes</h2>
              <p className="mt-1 text-sm text-slate-500">Historial de solicitudes de vacaciones.</p>
            </div>
            <span className="rounded-full bg-slate-100 px-3 py-1 text-sm font-semibold text-slate-700">
              {requests.length} solicitudes
            </span>
          </div>
          <div className="divide-y divide-slate-200">
            {!isLoading && requests.length === 0 && (
              <div className="px-6 py-8 text-center text-sm text-slate-500">
                No hay solicitudes cargadas.
              </div>
            )}

            {isLoading && (
              <div className="px-6 py-8 text-center text-sm text-slate-500">
                Cargando solicitudes...
              </div>
            )}

            {requests.map((request) => (
              <article key={request.id} className="grid gap-4 px-6 py-5 lg:grid-cols-[1.2fr_120px_130px_1fr] lg:items-center">
                <div>
                  <p className="font-semibold text-slate-950">
                    {formatDate(request.fecha_desde)} al {formatDate(request.fecha_hasta)}
                  </p>
                  <p className="mt-1 text-sm text-slate-500">Solicitada el {formatDate(request.fecha_solicitud)}</p>
                </div>
                <p className="text-sm font-semibold text-slate-700">{request.cantidad_dias} dias</p>
                <span className={clsx('w-fit rounded-full border px-3 py-1 text-xs font-semibold', statusStyles[request.estado])}>
                  {statusLabels[request.estado]}
                </span>
                <p className="text-sm text-slate-600">{request.comentario || 'Sin comentario.'}</p>
              </article>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
