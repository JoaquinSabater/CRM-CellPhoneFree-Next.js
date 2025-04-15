'use client';

import { useEffect, useState } from 'react';

export default function NotasPersonales({ userId }: { userId: number }) {
  const [nota, setNota] = useState('');

  // Clave única para este usuario
  const storageKey = `notas_usuario_${userId}`;

  // Cargar notas desde localStorage al montar
  useEffect(() => {
    const saved = localStorage.getItem(storageKey);
    if (saved) setNota(saved);
  }, [storageKey]);

  // Guardar automáticamente cada vez que cambia
  useEffect(() => {
    localStorage.setItem(storageKey, nota);
  }, [nota, storageKey]);

  return (
    <div className="lg:col-span-3 mt-6">
      <label htmlFor="notas" className="block mb-2 text-sm font-medium text-gray-700">
        Notas o recordatorios personales
      </label>
      <textarea
        id="notas"
        name="notas"
        placeholder="Escribí tus notas personales aquí..."
        className="w-full rounded-lg border border-gray-300 p-3 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
        rows={13} // 👈 aumentamos el alto del campo
        value={nota}
        onChange={(e) => setNota(e.target.value)}
      />
    </div>
  );
}
