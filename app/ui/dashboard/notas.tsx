'use client';

import { useEffect, useState } from 'react';

export default function NotasPersonales({ userId }: { userId: number }) {
  const [nota, setNota] = useState('');

  const storageKey = `notas_usuario_${userId}`;

  useEffect(() => {
    const saved = localStorage.getItem(storageKey);
    if (saved) setNota(saved);
  }, [storageKey]);

  useEffect(() => {
    localStorage.setItem(storageKey, nota);
  }, [nota, storageKey]);

  return (
    <div className="bg-white rounded-lg p-4 border shadow-sm">
      <label htmlFor="notas" className="block mb-2 text-sm font-semibold text-gray-800">
        Notas o recordatorios personales
      </label>
      <textarea
        id="notas"
        name="notas"
        placeholder="Escribí tus notas personales aquí..."
        className="w-full rounded-md border border-gray-300 p-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
        rows={10}
        value={nota}
        onChange={(e) => setNota(e.target.value)}
      />
    </div>
  );
}

