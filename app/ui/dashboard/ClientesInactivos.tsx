'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { PencilSquareIcon } from '@heroicons/react/24/outline';

type Cliente = { id: number; razon_social: string; ultima_compra: string | null };

export default function ClientesInactivosPorVendedor({ vendedorId }: { vendedorId: number }) {
  const [limite, setLimite] = useState('');
  const [fecha, setFecha] = useState('');
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(false);

 const STORAGE_KEY = `clientesInactivosBusqueda_${vendedorId}`;

  // Al montar, cargar búsqueda previa y volver a buscar si corresponde
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const { limite: savedLimite, fecha: savedFecha } = JSON.parse(saved);
      setLimite(savedLimite || '');
      setFecha(savedFecha || '');
      if (savedLimite) {
        handleBuscar(savedLimite, savedFecha);
      }
    }
    // eslint-disable-next-line
  }, [vendedorId]);

  // Guardar búsqueda cada vez que cambia
  useEffect(() => {
    if (limite) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ limite, fecha }));
    }
  }, [limite, fecha, vendedorId]);

  // Re-hacer la consulta al volver a la pestaña si hay un límite cargado
  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState === 'visible' && limite && !loading) {
        handleBuscar(limite, fecha);
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [limite, fecha, vendedorId]);

  const handleBuscar = async (limiteBuscar?: string, fechaBuscar?: string) => {
    const lim = limiteBuscar ?? limite;
    const f = fechaBuscar ?? fecha;
    if (!lim.trim() || isNaN(Number(lim))) return;
    setLoading(true);
    try {
      let url = `/api/cliente-inactivo?vendedorId=${vendedorId}&limite=${lim}`;
      if (f) url += `&fecha=${f}`;
      const res = await fetch(url);
      const data = await res.json();
      setClientes(data as Cliente[]);
    } catch (err) {
      setClientes([]);
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleLimpiar = () => {
    setLimite('');
    setFecha('');
    setClientes([]);
    localStorage.removeItem(STORAGE_KEY);
  };

  return (
    <div className="bg-white rounded-lg shadow p-4 h-full flex flex-col">
      <h2 className="text-lg font-semibold mb-3">Clientes más inactivos</h2>
      <form
        onSubmit={e => {
          e.preventDefault();
          handleBuscar();
        }}
        className="flex items-center gap-2 mb-4"
      >
        <input
          type="number"
          min={1}
          value={limite}
          onChange={e => setLimite(e.target.value)}
          className="border rounded px-3 py-1 text-sm w-24"
          placeholder="Cantidad"
        />
        <input
          type="date"
          value={fecha}
          onChange={e => setFecha(e.target.value)}
          className="border rounded px-3 py-1 text-sm w-40"
          placeholder="Fecha límite"
        />
        <button
          type="submit"
          className="bg-orange-600 text-white px-4 py-1 rounded text-sm hover:bg-orange-500"
        >
          Buscar
        </button>
        <button
          type="button"
          onClick={handleLimpiar}
          className="bg-gray-200 text-gray-700 px-3 py-1 rounded text-sm hover:bg-gray-300"
        >
          Limpiar
        </button>
      </form>
      {loading ? (
        <p className="text-sm text-gray-600">Buscando...</p>
      ) : clientes.length > 0 ? (
        <div
          className={`text-sm space-y-1 ${
            clientes.length > 7 ? 'max-h-[168px] overflow-y-auto pr-2' : ''
          }`}
        >
        {clientes.map((cliente) => (
          <div key={cliente.id} className="flex items-center justify-between">
            <span>
              <strong>{cliente.razon_social}</strong>
              {' – '}
              {cliente.ultima_compra
                ? `Última compra: ${new Date(cliente.ultima_compra).toLocaleDateString()}`
                : 'Nunca compró'}
            </span>
            <Link
              href={`/dashboard/invoices/${cliente.id}/edit?from=dashboard`}
              className="ml-2 text-gray-500 hover:text-orange-600"
              title="Ver perfil"
            >
              <PencilSquareIcon className="h-5 w-5" />
            </Link>
          </div>
        ))}
        </div>
      ) : (
        <p className="text-sm text-gray-500">No hay resultados aún.</p>
      )}
    </div>
  );
}