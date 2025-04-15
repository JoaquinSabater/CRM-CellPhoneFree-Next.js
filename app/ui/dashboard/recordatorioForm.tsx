'use client';

import { useState } from 'react';
import { createRecordatorio } from '@/app/lib/actions';

export default function RecordatorioForm() {
  const [mensaje, setMensaje] = useState('');
  const [fecha, setFecha] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    const formData = new FormData(e.currentTarget);

    try {
      const res = await createRecordatorio(formData);
      if (res?.success) {
        setSuccess('✅ Recordatorio guardado correctamente');

        setMensaje('');
        setFecha('');
      } else {
        setError('❌ Ocurrió un error al guardar el recordatorio');
      }
    } catch (err) {
      console.error('Error al enviar recordatorio:', err);
      setError('❌ Error inesperado');
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white p-4 rounded-lg shadow-md w-full h-full max-w-sm flex flex-col justify-between"
    >
      <h2 className="text-lg font-semibold text-gray-800 mb-2">
        📨 Programar recordatorio por Telegram
      </h2>

      <textarea
        name="mensaje"
        required
        placeholder="Escribí el mensaje que querés recibir..."
        value={mensaje}
        onChange={(e) => setMensaje(e.target.value)}
        className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-orange-500 focus:ring-orange-500 mb-2"
      />

      <label className="block text-sm font-medium text-gray-700 mb-1">📅 Fecha</label>
      <input
        type="date"
        name="fecha"
        value={fecha}
        onChange={(e) => setFecha(e.target.value)}
        className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-orange-500 focus:ring-orange-500 mb-4"
      />

      <button
        type="submit"
        className="mt-auto w-full rounded-md bg-orange-500 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-orange-600"
      >
        Programar recordatorio
      </button>
    </form>
  );
}
