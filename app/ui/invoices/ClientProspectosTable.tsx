'use client';

import { useState } from 'react';
import { UpdateProspecto } from '@/app/ui/invoices/buttons';
import { TrashIcon } from '@heroicons/react/24/outline';
import { desactivarProspecto } from '@/app/lib/actions';
import { prospecto } from '@/app/lib/definitions';

export function ClientProspectosTable({ initialProspectos }: { initialProspectos: prospecto[] }) {
  const [prospectos, setProspectos] = useState(initialProspectos);

  const handleDelete = async (id: number) => {
    try {
      await desactivarProspecto(id);
      setProspectos(prev => prev.filter(p => p.id !== id));
    } catch (err) {
      console.error('❌ Error al eliminar prospecto:', err);
    }
  };

  return (
    <div className="mt-6 w-full overflow-x-auto">
      <table className="min-w-full text-sm text-gray-900 border rounded-lg overflow-hidden">
        <thead className="bg-gray-100 text-left font-medium">
          <tr>
            <th className="px-2 py-5 font-medium">Nombre</th>
            <th className="px-2 py-5 font-medium">Email</th>
            <th className="px-2 py-5 font-medium">Teléfono</th>
            <th className="px-2 py-5 font-medium">Ciudad</th>
            <th className="px-2 py-5 font-medium">Fecha Contacto</th>
            <th className="px-2 py-5 font-medium"></th>
            <th className="px-2 py-5 font-medium"></th>
          </tr>
        </thead>
        <tbody className="bg-white">
          {prospectos.map((p) => (
            <tr key={p.id}>
              <td className="whitespace-nowrap px-2 py-3">{p.nombre}</td>
              <td className="whitespace-nowrap px-2 py-3">{p.email}</td>
              <td className="whitespace-nowrap px-2 py-3">{p.telefono}</td>
              <td className="whitespace-nowrap px-2 py-3">{p.localidad_nombre}</td>
              <td className="whitespace-nowrap px-2 py-3">{new Date(p.fecha_contacto).toLocaleDateString()}</td>
              <td className="py-1">
                <UpdateProspecto id={p.id} />
              </td>
              <td className="py-1">
                <button
                  onClick={() => handleDelete(p.id)}
                  className="inline-flex items-center justify-center rounded-md p-1.5 hover:bg-gray-100 transition"
                >
                  <span className="sr-only">Eliminar</span>
                  <TrashIcon className="w-5 h-5 text-gray-600" />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}