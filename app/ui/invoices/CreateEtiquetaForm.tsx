// 📁 app/ui/invoices/create-etiqueta-form.tsx

'use client';

import { useState } from 'react';
import { PlusIcon } from '@heroicons/react/24/outline';

export default function CreateEtiquetaForm() {
  const [nombre, setNombre] = useState('');

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    console.log('Etiqueta a crear:', nombre);
    // En el futuro: enviar a la base de datos con una action
  };

  return (
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
    </form>
  );
}
