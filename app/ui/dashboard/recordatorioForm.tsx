'use client';

import { useState } from 'react';

export default function RecordatorioForm() {
  const [mensaje, setMensaje] = useState('');
  const [fecha, setFecha] = useState('');
  const [hora, setHora] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // TODO: enviar al backend vía fetch o action
    console.log({
      mensaje,
      fecha,
      hora,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-xl rounded-lg bg-gray-50 py-3 px-4 shadow-sm space-y-4 ">
      <h2 className="text-lg font-semibold text-gray-800">📨 Programar recordatorio por Telegram</h2>

      <textarea
        value={mensaje}
        onChange={(e) => setMensaje(e.target.value)}
        rows={4}
        placeholder="Escribí el mensaje que querés recibir..."
        className="w-full rounded-md border border-gray-300 px-4 py-2 text-sm shadow-sm focus:border-orange-500 focus:ring-orange-500"
      />

      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1">
          <label className="block text-sm mb-1">📅 Fecha</label>
          <input
            type="date"
            value={fecha}
            onChange={(e) => setFecha(e.target.value)}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-orange-500 focus:ring-orange-500"
          />
        </div>

        <div className="flex-1">
          <label className="block text-sm mb-1">🕒 Hora</label>
          <input
            type="time"
            value={hora}
            onChange={(e) => setHora(e.target.value)}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-orange-500 focus:ring-orange-500"
          />
        </div>
      </div>

      <button
        type="submit"
        className="mt-2 w-full rounded-md bg-orange-500 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-orange-600"
      >
        Programar recordatorio
      </button>
    </form>
  );
}
