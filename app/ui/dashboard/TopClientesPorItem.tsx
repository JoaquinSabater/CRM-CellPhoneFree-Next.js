'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { PencilSquareIcon } from '@heroicons/react/24/outline';

type Cliente = { id: number; razon_social: string; total_comprado: number };


export default function TopClientesPorItem({ vendedorId }: { vendedorId: number }) {
  const [item, setItem] = useState('');
  const [limite, setLimite] = useState('');
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(false);

  const STORAGE_KEY = `topClientesPorItemBusqueda_${vendedorId}`;

  // Al montar, cargar búsqueda previa y volver a buscar si corresponde
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const { item: savedItem, limite: savedLimite } = JSON.parse(saved);
      setItem(savedItem);
      setLimite(savedLimite);
      if (savedItem && savedLimite) {
        buscarClientes(savedItem, savedLimite);
      }
    }
  }, [vendedorId]); // <-- Siempre la misma cantidad de dependencias

  useEffect(() => {
    if (item || limite) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ item, limite }));
    }
  }, [item, limite]);

  const buscarClientes = async (itemBuscar: string, limiteBuscar: string) => {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/topClientes?item=${encodeURIComponent(itemBuscar)}&vendedorId=${vendedorId}&limite=${limiteBuscar}`
      );
      const data = await res.json();
      setClientes(data as Cliente[]);
    } catch (err) {
      setClientes([]);
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleBuscar = () => {
    if (!item.trim() || !limite.trim() || isNaN(Number(limite))) return;
    buscarClientes(item, limite);
  };

  const handleLimpiar = () => {
    setItem('');
    setLimite('');
    setClientes([]);
    localStorage.removeItem(STORAGE_KEY);
  };

  return (
    <div className="bg-white rounded-lg shadow p-4 h-full flex flex-col">
      <h2 className="text-lg font-semibold mb-3">Buscar top clientes por ítem</h2>

    <form
      onSubmit={e => {
        e.preventDefault();
        handleBuscar();
      }}
      className="flex items-center gap-2 mb-4"
    >
      <input
        type="text"
        value={item}
        onChange={(e) => setItem(e.target.value)}
        placeholder="Ej: Fundas"
        className="border rounded px-3 py-1 text-sm w-full"
      />
      <input
        type="number"
        min={1}
        value={limite}
        onChange={(e) => setLimite(e.target.value)}
        className="border rounded px-3 py-1 text-sm w-20"
        placeholder="Cantidad"
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
          {clientes.map((cliente, idx) => (
            <div key={idx} className="flex items-center justify-between">
              <span>
                <strong>{cliente.razon_social}</strong> – {cliente.total_comprado} unidades
              </span>
              <Link href={`/dashboard/invoices/${cliente.id}/edit?from=dashboard`} className="ml-2 text-gray-500 hover:text-orange-600">
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




