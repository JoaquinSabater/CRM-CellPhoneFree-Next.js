'use client';

import { useState, startTransition  } from 'react';
import { PlusIcon, TrashIcon  } from '@heroicons/react/24/outline';
import { createEtiqueta, deleteFiltroById } from '@/app/lib/actions';

export default function CreateEtiquetaForm({ filtrosDisponibles }: any) {
  const [nombre, setNombre] = useState('');
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [etiquetas, setEtiquetas] = useState(filtrosDisponibles); // Nuevo estado local

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSuccess(false);
    setError('');

    try {
      const formData = new FormData();
      formData.append('nombre', nombre);
      await createEtiqueta(formData);
      setSuccess(true);
      setNombre('');
    } catch (err) {
      setError('Error al crear la etiqueta.');
    }
  };

  const handleDelete = (id: number) => {
    if (!confirm('¿Estás seguro de que querés eliminar esta etiqueta?')) return;

    startTransition(async () => {
      try {
        await deleteFiltroById(id);
        setEtiquetas((prev: any[]) => prev.filter((etiqueta) => etiqueta.id !== id)); // Actualiza la lista sin recarga
      } catch (error) {
        console.error('Error al eliminar:', error);
        setError('No se pudo eliminar la etiqueta.');
      }
    });
  };

  return (
    <div className="space-y-6 rounded-md bg-gray-50 p-4 shadow">
      <form onSubmit={handleSubmit} className="space-y-4 rounded-md bg-gray-50 p-4 shadow">
        <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
          <PlusIcon className="w-5 h-5" /> Crear Etiqueta
        </h2>
        <div>
          <label htmlFor="nombre" className="block text-sm font-medium text-gray-700">
            Nombre de la etiqueta
          </label>
          <input
            id="nombre"
            name="nombre"
            type="text"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            placeholder="Ej: VIP, Moroso, Mayorista..."
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-orange-500 focus:ring-orange-500"
          />
        </div>
        <button
          type="submit"
          className="rounded-md bg-orange-600 px-4 py-2 text-sm font-medium text-white hover:bg-orange-700"
        >
          Guardar
        </button>

        {success && <p className="text-green-600 text-sm">Etiqueta creada correctamente.</p>}
        {error && <p className="text-red-600 text-sm">{error}</p>}
      </form>

      <div>
        <h3 className="text-md font-medium text-gray-800 mb-2">Etiquetas existentes</h3>
        <ul className="space-y-2">
          {etiquetas.length === 0 && (
            <li className="text-sm text-gray-500 italic">No hay etiquetas creadas.</li>
          )}
          {etiquetas.map((filtro: any) => (
            <li
              key={filtro.id}
              className="flex items-center justify-between rounded-md border px-3 py-2 bg-white shadow-sm"
            >
              <span className="text-sm">{filtro.nombre}</span>
              <button
                type="button"
                onClick={() => handleDelete(filtro.id)}
                className="text-red-600 hover:text-red-800"
              >
                <TrashIcon className="w-4 h-4" />
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
