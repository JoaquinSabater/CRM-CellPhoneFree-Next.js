'use client';

import { useRouter } from 'next/navigation';
import { TrashIcon } from '@heroicons/react/24/outline';
import { desactivarProspecto } from '@/app/lib/actions';
import { UpdateProspecto } from '@/app/ui/invoices/buttons';
import { prospecto } from '@/app/lib/definitions';
import { TIPOS_COMERCIO } from '@/app/lib/prospect-options';
import { Card } from '@/app/ui/components/Card';
import { Button } from '@/app/ui/button';
import { EstadoProspectoBadge } from '@/app/ui/invoices/prospects/EstadoProspectoBadge';

export function ClientProspectosTable({
  initialProspectos
}: {
  initialProspectos: prospecto[];
}) {

  const prospectos: prospecto[] = initialProspectos ?? [];
  const router = useRouter();

  const handleDelete = async (id: number) => {
    try {
      await desactivarProspecto(id);
      router.refresh(); // Refresca la página para mostrar los cambios
    } catch (err) {
      console.error('❌ Error al eliminar prospecto:', err);
    }
  };

  return (
    <Card className="mt-6 w-full overflow-x-auto">
      <table className="min-w-full text-sm text-slate-700">
      <thead className="border-b border-slate-200 bg-slate-50 text-left">
            <tr>
                <th className="px-4 py-3 text-xs font-medium uppercase tracking-wide text-slate-500">Nombre</th>
                <th className="px-4 py-3 text-xs font-medium uppercase tracking-wide text-slate-500">Teléfono</th>
                <th className="px-4 py-3 text-xs font-medium uppercase tracking-wide text-slate-500">Ciudad</th>
                <th className="px-4 py-3 text-xs font-medium uppercase tracking-wide text-slate-500">Negocio</th>
                <th className="px-4 py-3 text-xs font-medium uppercase tracking-wide text-slate-500">Tipo de comercio</th>
                <th className="px-4 py-3 text-xs font-medium uppercase tracking-wide text-slate-500">Estado</th>
                <th className="px-4 py-3 text-xs font-medium uppercase tracking-wide text-slate-500">Fecha Contacto</th>
                <th className="px-4 py-3"></th>
                <th className="px-4 py-3"></th>
            </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {prospectos.map((p) => (
            <tr key={p.id} className="hover:bg-slate-50">
              <td className="whitespace-nowrap px-4 py-3">{p.nombre}</td>
              <td className="whitespace-nowrap px-4 py-3">{p.telefono}</td>
              <td className="whitespace-nowrap px-4 py-3">{p.localidad_nombre}</td>
              <td className="whitespace-nowrap px-4 py-3">{p.negocio}</td>
              <td className="whitespace-nowrap px-4 py-3">
                {TIPOS_COMERCIO.find(({ value }) => value === p.tipo_comercio)?.label || '-'}
              </td>
              <td className="whitespace-nowrap px-4 py-3">
                <EstadoProspectoBadge estado={p.estado_prospecto} />
              </td>
              <td className="whitespace-nowrap px-4 py-3">
                {p.fecha_contacto ? new Date(p.fecha_contacto).toISOString().slice(0, 10) : ''}
              </td>
              <td className="px-2 py-1">
                <UpdateProspecto id={p.id} />
              </td>
              <td className="px-2 py-1">
                <Button
                  variant="icon"
                  onClick={() => handleDelete(p.id)}
                >
                  <span className="sr-only">Eliminar</span>
                  <TrashIcon className="w-5 h-5" />
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </Card>
  );
}
