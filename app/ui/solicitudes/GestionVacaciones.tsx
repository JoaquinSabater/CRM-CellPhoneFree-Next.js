'use client';

import { type FormEvent, useEffect, useState } from 'react';
import clsx from 'clsx';
import {
  AdjustmentsHorizontalIcon,
  CalendarDaysIcon,
  MagnifyingGlassIcon,
  PlusIcon,
} from '@heroicons/react/24/outline';

type SaldoUsuario = {
  usuario_id: number;
  username: string;
  rol: string;
  tiene_saldo: boolean;
  dias_totales: number;
  dias_usados: number;
  dias_pendientes: number;
  dias_restantes: number;
};

type Draft = {
  dias_totales: string;
  dias_usados: string;
};

const currentYear = new Date().getFullYear();
const yearOptions = [currentYear - 1, currentYear, currentYear + 1];

function countDays(from: string, to: string) {
  if (!from || !to) return 0;
  const start = new Date(`${from}T00:00:00`);
  const end = new Date(`${to}T00:00:00`);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end < start) return 0;
  return Math.floor((end.getTime() - start.getTime()) / 86400000) + 1;
}

function parseDays(value: string) {
  return /^\d+$/.test(value.trim()) ? Number(value.trim()) : null;
}

async function readApiError(response: Response) {
  try {
    const data = await response.json();
    return data?.error ?? 'Ocurrio un error.';
  } catch {
    return 'Ocurrio un error.';
  }
}

export default function GestionVacaciones({ onChange }: { onChange: () => void }) {
  const [anio, setAnio] = useState(currentYear);
  const [usuarios, setUsuarios] = useState<SaldoUsuario[]>([]);
  const [drafts, setDrafts] = useState<Record<number, Draft>>({});
  const [filter, setFilter] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [savingId, setSavingId] = useState<number | null>(null);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const [manualUserId, setManualUserId] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const manualDays = countDays(from, to);
  const selectedUser = usuarios.find((usuario) => usuario.usuario_id === Number(manualUserId));
  const visibleUsers = usuarios.filter((usuario) =>
    `${usuario.username} ${usuario.rol}`.toLowerCase().includes(filter.trim().toLowerCase()),
  );

  const loadSaldos = async (year: number) => {
    setIsLoading(true);

    try {
      const response = await fetch(`/api/admin/vacaciones/saldos?anio=${year}`, { cache: 'no-store' });

      if (!response.ok) {
        throw new Error(await readApiError(response));
      }

      const data = await response.json();
      setUsuarios(Array.isArray(data.usuarios) ? data.usuarios : []);
      setDrafts({});
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'No se pudieron cargar los saldos.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadSaldos(anio);
  }, [anio]);

  const getDraft = (usuario: SaldoUsuario): Draft => drafts[usuario.usuario_id] ?? {
    dias_totales: String(usuario.dias_totales),
    dias_usados: String(usuario.dias_usados),
  };

  const updateDraft = (usuario: SaldoUsuario, field: keyof Draft, value: string) => {
    setDrafts((current) => ({
      ...current,
      [usuario.usuario_id]: { ...getDraft(usuario), [field]: value },
    }));
  };

  const saveSaldo = async (usuario: SaldoUsuario) => {
    const draft = getDraft(usuario);
    const diasTotales = parseDays(draft.dias_totales);
    const diasUsados = parseDays(draft.dias_usados);

    setSuccessMessage('');
    setErrorMessage('');

    if (diasTotales === null || diasUsados === null) {
      setErrorMessage('Los dias deben ser numeros enteros mayores o iguales a 0.');
      return;
    }

    setSavingId(usuario.usuario_id);

    try {
      const response = await fetch('/api/admin/vacaciones/saldos', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          usuario_id: usuario.usuario_id,
          anio,
          dias_totales: diasTotales,
          dias_usados: diasUsados,
        }),
      });

      if (!response.ok) {
        throw new Error(await readApiError(response));
      }

      setSuccessMessage(`Saldo ${anio} de ${usuario.username} actualizado.`);
      await loadSaldos(anio);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'No se pudo actualizar el saldo.');
    } finally {
      setSavingId(null);
    }
  };

  const handleManualSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSuccessMessage('');
    setErrorMessage('');

    if (manualDays <= 0) {
      setErrorMessage('Las fechas seleccionadas no son validas.');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch('/api/admin/vacaciones/carga-manual', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          usuario_id: Number(manualUserId),
          fecha_desde: from,
          fecha_hasta: to,
          comentario: comment,
        }),
      });

      if (!response.ok) {
        throw new Error(await readApiError(response));
      }

      setSuccessMessage(`Vacaciones de ${selectedUser?.username ?? 'usuario'} cargadas (${manualDays} dias).`);
      setManualUserId('');
      setFrom('');
      setTo('');
      setComment('');
      await loadSaldos(anio);
      onChange();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'No se pudieron cargar las vacaciones.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
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

      <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-start gap-3">
          <span className="rounded-md bg-orange-50 p-3 text-orange-600">
            <CalendarDaysIcon className="h-6 w-6" />
          </span>
          <div>
            <h2 className="text-xl font-semibold text-slate-950">Cargar vacaciones a mano</h2>
            <p className="mt-1 text-sm text-slate-500">
              Quedan aprobadas al instante y se descuentan del saldo del año de la fecha desde.
            </p>
          </div>
        </div>

        <form onSubmit={handleManualSubmit} className="mt-6 grid gap-4 lg:grid-cols-[1.2fr_1fr_1fr_140px]">
          <label className="block">
            <span className="text-sm font-medium text-slate-700">Usuario</span>
            <select
              value={manualUserId}
              onChange={(event) => setManualUserId(event.target.value)}
              className="mt-2 block w-full rounded-md border-slate-300 text-sm shadow-sm focus:border-orange-500 focus:ring-orange-500"
              required
            >
              <option value="">Elegir usuario</option>
              {usuarios.map((usuario) => (
                <option key={usuario.usuario_id} value={usuario.usuario_id}>
                  {usuario.username}{usuario.rol ? ` (${usuario.rol})` : ''}
                </option>
              ))}
            </select>
          </label>
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
            <p className="mt-2 text-2xl font-semibold text-slate-950">{manualDays}</p>
            <p className="text-sm text-slate-500">dias</p>
          </div>
          <label className="block lg:col-span-4">
            <span className="text-sm font-medium text-slate-700">Comentario opcional</span>
            <textarea
              value={comment}
              onChange={(event) => setComment(event.target.value)}
              rows={2}
              className="mt-2 block w-full rounded-md border-slate-300 text-sm shadow-sm focus:border-orange-500 focus:ring-orange-500"
              placeholder="Por ejemplo: vacaciones acordadas por fuera del sistema."
            />
          </label>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between lg:col-span-4">
            <p className="text-sm text-slate-500">
              {selectedUser && from && Number(from.slice(0, 4)) === anio
                ? `${selectedUser.username} tiene ${selectedUser.dias_restantes} dias restantes en ${anio}.`
                : ''}
            </p>
            <button
              type="submit"
              disabled={isSubmitting || !manualUserId || manualDays <= 0}
              className="inline-flex items-center justify-center gap-2 rounded-md bg-orange-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-orange-700 disabled:cursor-not-allowed disabled:bg-slate-300"
            >
              <PlusIcon className="h-5 w-5" />
              {isSubmitting ? 'Cargando...' : 'Cargar vacaciones'}
            </button>
          </div>
        </form>
      </section>

      <section className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-4 border-b border-slate-200 px-6 py-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="flex items-start gap-3">
            <span className="rounded-md bg-orange-50 p-3 text-orange-600">
              <AdjustmentsHorizontalIcon className="h-6 w-6" />
            </span>
            <div>
              <h2 className="text-xl font-semibold text-slate-950">Saldos de vacaciones</h2>
              <p className="mt-1 max-w-2xl text-sm text-slate-500">
                Edita los dias totales y usados. Los pendientes dependen de las solicitudes en curso y
                los restantes se recalculan solos.
              </p>
            </div>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <label className="relative block">
              <span className="sr-only">Buscar usuario</span>
              <MagnifyingGlassIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="search"
                value={filter}
                onChange={(event) => setFilter(event.target.value)}
                placeholder="Buscar usuario"
                className="block w-full rounded-md border-slate-300 pl-9 text-sm shadow-sm focus:border-orange-500 focus:ring-orange-500 sm:w-52"
              />
            </label>
            <label className="block">
              <span className="sr-only">Anio</span>
              <select
                value={anio}
                onChange={(event) => setAnio(Number(event.target.value))}
                className="block w-full rounded-md border-slate-300 text-sm shadow-sm focus:border-orange-500 focus:ring-orange-500"
              >
                {yearOptions.map((year) => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
            </label>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
            <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-6 py-4">Usuario</th>
                <th className="px-4 py-4">Totales</th>
                <th className="px-4 py-4">Usados</th>
                <th className="px-4 py-4">Pendientes</th>
                <th className="px-4 py-4">Restantes</th>
                <th className="px-6 py-4">Accion</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 bg-white">
              {isLoading && (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-sm text-slate-500">
                    Cargando saldos...
                  </td>
                </tr>
              )}

              {!isLoading && visibleUsers.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-sm text-slate-500">
                    No hay usuarios para mostrar.
                  </td>
                </tr>
              )}

              {!isLoading && visibleUsers.map((usuario) => {
                const draft = getDraft(usuario);
                const diasTotales = parseDays(draft.dias_totales);
                const diasUsados = parseDays(draft.dias_usados);
                const restantes = diasTotales !== null && diasUsados !== null
                  ? diasTotales - diasUsados - usuario.dias_pendientes
                  : null;
                const isDirty = draft.dias_totales !== String(usuario.dias_totales)
                  || draft.dias_usados !== String(usuario.dias_usados);
                const isSaving = savingId === usuario.usuario_id;

                return (
                  <tr key={usuario.usuario_id} className="align-middle">
                    <td className="px-6 py-4">
                      <p className="font-semibold text-slate-950">{usuario.username}</p>
                      <p className="mt-1 text-xs font-medium uppercase tracking-wide text-slate-500">
                        {usuario.rol || 'Sin rol'}
                        {!usuario.tiene_saldo && <span className="ml-2 normal-case text-amber-600">Sin saldo {anio}</span>}
                      </p>
                    </td>
                    {(['dias_totales', 'dias_usados'] as const).map((field) => (
                      <td key={field} className="px-4 py-4">
                        <input
                          type="number"
                          min={0}
                          step={1}
                          inputMode="numeric"
                          value={draft[field]}
                          disabled={isSaving}
                          onChange={(event) => updateDraft(usuario, field, event.target.value)}
                          aria-label={`${field === 'dias_totales' ? 'Dias totales' : 'Dias usados'} de ${usuario.username}`}
                          className="block w-20 rounded-md border-slate-300 text-sm shadow-sm focus:border-orange-500 focus:ring-orange-500 disabled:bg-slate-100 disabled:text-slate-500"
                        />
                      </td>
                    ))}
                    <td className="px-4 py-4 font-semibold text-slate-700">{usuario.dias_pendientes}</td>
                    <td className={clsx('px-4 py-4 font-semibold', restantes !== null && restantes < 0 ? 'text-rose-600' : 'text-slate-950')}>
                      {restantes ?? '-'}
                    </td>
                    <td className="px-6 py-4">
                      <button
                        type="button"
                        disabled={isSaving || (usuario.tiene_saldo && !isDirty) || restantes === null || restantes < 0}
                        onClick={() => saveSaldo(usuario)}
                        className="inline-flex items-center rounded-md bg-slate-900 px-3 py-2 text-xs font-semibold text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:bg-slate-300"
                      >
                        {isSaving ? 'Guardando...' : usuario.tiene_saldo ? 'Guardar' : 'Crear saldo'}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
