'use client';

import { useState } from 'react';

type Cliente = { razon_social: string; total_comprado: number };

export default function TopClientesPorItem({ vendedorId }: { vendedorId: number }) {
  const [item, setItem] = useState('');
  const [limite, setLimite] = useState('');
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(false);

  const handleBuscar = async () => {
    if (!item.trim() || !limite.trim() || isNaN(Number(limite))) return;

    setLoading(true);
    try {
      const res = await fetch(
        `/api/topClientes?item=${encodeURIComponent(item)}&vendedorId=${vendedorId}&limite=${limite}`
      );
      const data = await res.json();
      setClientes(data as Cliente[]);
    } catch (err) {
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const isScrollable = clientes.length > 7;

  return (
    <div className="bg-white rounded-lg shadow p-4 h-full flex flex-col">
      <h2 className="text-lg font-semibold mb-3">Buscar top clientes por ítem</h2>

      <div className="flex items-center gap-2 mb-4">
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
          onClick={handleBuscar}
          className="bg-orange-600 text-white px-4 py-1 rounded text-sm hover:bg-orange-500"
        >
          Buscar
        </button>
      </div>

      {loading ? (
        <p className="text-sm text-gray-600">Buscando...</p>
      ) : clientes.length > 0 ? (
        <div
          className={`text-sm space-y-1 ${
            clientes.length > 7 ? 'max-h-[168px] overflow-y-auto pr-2' : ''
          }`}
        >
          {clientes.map((cliente, idx) => (
            <div key={idx}>
              <strong>{cliente.razon_social}</strong> – {cliente.total_comprado} unidades
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-gray-500">No hay resultados aún.</p>
      )}
    </div>
  );
}




