// ✅ Ruta: app/dashboard/etiquetas/CreateEtiquetaForm.tsx
'use client';

import { useState } from 'react';
import { crearEtiqueta } from '@/app/lib/etiquetas';

export default function CreateEtiquetaForm({ vendedorId }: { vendedorId: number }) {
  const [nombre, setNombre] = useState('');
  const [feedback, setFeedback] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const success = await crearEtiqueta(nombre, vendedorId);
    if (success) {
      setFeedback('Etiqueta creada correctamente ✅');
      setNombre('');
    } else {
      setFeedback('Error al crear la etiqueta ❌');
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mb-6">
      <label className="block mb-2 text-sm font-medium text-gray-700">
        Nombre de la etiqueta
      </label>
      <input
        type="text"
        value={nombre}
        onChange={(e) => setNombre(e.target.value)}
        required
        className="w-full max-w-sm rounded-md border px-3 py-2 text-sm outline-orange-500"
        placeholder="Ej: Preferencial, Moroso, Nuevo..."
      />
      <button
        type="submit"
        className="mt-3 rounded-md bg-orange-600 px-4 py-2 text-sm font-medium text-white hover:bg-orange-700"
      >
        Crear Etiqueta
      </button>
      {feedback && <p className="mt-2 text-sm text-gray-600">{feedback}</p>}
    </form>
  );
}
