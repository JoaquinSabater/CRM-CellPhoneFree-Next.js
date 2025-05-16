'use client';

import { useState } from 'react';

type Marca = { id: number; nombre: string };
type Producto = { modelo: string; item_nombre: string; cantidad: number };

export default function ProductosPorMarca({ clienteId, marcas }: { clienteId: number, marcas: Marca[] }) {
  const [abierta, setAbierta] = useState<number | null>(null);
  const [productos, setProductos] = useState<{ [key: number]: Producto[] }>({});
  const [loading, setLoading] = useState(false);

  const handleClick = async (marcaId: number) => {
    if (abierta === marcaId) {
      setAbierta(null);
      return;
    }
    setAbierta(marcaId);
    if (!productos[marcaId]) {
      setLoading(true);
      const res = await fetch(`/api/producto-por-marca?clienteId=${clienteId}&marcaId=${marcaId}`);
      const data = await res.json();
      setProductos((prev) => ({ ...prev, [marcaId]: data }));
      setLoading(false);
    }
  };

  return (
    <div className="mt-8">
      <h3 className="text-md font-semibold text-gray-800 mb-4">Productos por Marca</h3>
      <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
        {marcas.map((marca) => (
          <button
            key={marca.id}
            className={`w-full px-2 py-1 rounded text-xs transition-colors ${
              abierta === marca.id
                ? 'bg-orange-700 text-white'
                : 'bg-orange-500 text-white hover:bg-orange-600'
            }`}
            onClick={() => handleClick(marca.id)}
            type="button"
          >
            {abierta === marca.id ? 'Ocultar' : marca.nombre}
          </button>
        ))}
      </div>

      {/* Tabla centrada debajo de los botones */}
        {abierta !== null && (
        <div className="flex justify-center mt-6">
            <div className="w-full md:w-3/5">
            {loading ? (
                <div className="flex justify-center">
                <span className="text-gray-500 text-xs">Cargando...</span>
                </div>
            ) : !productos[abierta] ? (
                <div className="flex justify-center">
                <span className="text-gray-500 text-xs">Cargando...</span>
                </div>
            ) : productos[abierta].length === 0 ? (
                <div className="flex justify-center">
                <span className="text-gray-500 text-xs">No hay productos.</span>
                </div>
            ) : (
                <table className="text-xs mt-2 border w-full bg-white shadow rounded">
                    <thead>
                    <tr>
                        <th className="px-2 py-1 border">Modelo</th>
                        <th className="px-2 py-1 border">Item</th>
                        <th className="px-2 py-1 border">Cantidad</th>
                    </tr>
                    </thead>
                    <tbody>
                    {productos[abierta].map((p, idx) => (
                        <tr key={idx}>
                        <td className="px-2 py-1 border">{p.modelo}</td>
                        <td className="px-2 py-1 border">{p.item_nombre}</td>
                        <td className="px-2 py-1 border">{p.cantidad}</td>
                        </tr>
                    ))}
                    </tbody>
              </table>
            )}
          </div>
        </div>
      )}
    </div>
  );
}