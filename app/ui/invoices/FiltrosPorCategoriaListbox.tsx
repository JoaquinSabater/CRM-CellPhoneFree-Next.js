'use client';

import { useState, useRef, useEffect } from 'react';
import { useSearchParams, usePathname, useRouter } from 'next/navigation';

type Filtro = { id: number; nombre: string; categoria: string }

export default function FiltrosDrawer({ filtros }: { filtros: Filtro[] }) {
  const [open, setOpen] = useState(false);
  const drawerRef = useRef<HTMLDivElement>(null);
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();

  // Agrupar filtros por categoría
  const categorias = Array.from(new Set(filtros.map(f => f.categoria)));
  const filtrosPorCategoria = categorias.map(cat => ({
    categoria: cat,
    filtros: filtros.filter(f => f.categoria === cat)
  }));

  // Obtener filtros seleccionados del query
  const filtrosSeleccionados = new Set(
    Array.from(searchParams.entries())
      .filter(([key]) => key.startsWith('filtro_'))
      .map(([_, value]) => value)
  );

  function handleToggle(filtro: Filtro) {
    const params = new URLSearchParams(searchParams);
    const key = `filtro_${filtro.id}`;
    if (filtrosSeleccionados.has(String(filtro.id))) {
      params.delete(key);
    } else {
      params.set(key, String(filtro.id));
    }
    params.set('page', '1');
    router.replace(`${pathname}?${params.toString()}`);
  }

  function limpiar() {
    const params = new URLSearchParams(searchParams);
    Array.from(params.keys()).forEach(key => {
      if (key.startsWith('filtro_')) params.delete(key);
    });
    router.replace(`${pathname}?${params.toString()}`);
  }

  // Cerrar Drawer al hacer click fuera
  useEffect(() => {
    if (!open) return;
    function handleClickOutside(event: MouseEvent) {
      if (drawerRef.current && !drawerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  return (
    <div className="w-full">
      <div className="flex items-center gap-2">
        <button
          type="button"
          className="px-2 py-1 rounded bg-orange-500 text-white text-xs font-semibold"
          onClick={() => setOpen(true)}
        >
          Filtros / Etiquetas
        </button>
        <button
          type="button"
          className="px-2 py-1 rounded bg-orange-400 text-white text-xs font-semibold"
          onClick={limpiar}
        >
          Limpiar Etiquetas
        </button>
      </div>
      {/* Filtros activos SIEMPRE debajo de los botones */}
      <div className="flex flex-wrap gap-2 mt-2 w-full">
        {filtros
          .filter(f => filtrosSeleccionados.has(String(f.id)))
          .map(filtro => (
            <span
              key={filtro.id}
              className="flex items-center bg-orange-100 text-orange-700 px-2 py-0.5 rounded text-xs font-medium"
            >
              {filtro.nombre}
              <button
                type="button"
                className="ml-1 text-orange-500 hover:text-orange-700 text-xs font-bold"
                onClick={() => handleToggle(filtro)}
                aria-label={`Quitar filtro ${filtro.nombre}`}
              >
                ×
              </button>
            </span>
          ))}
      </div>
      {open && (
        <div className="fixed inset-0 bg-black bg-opacity-30 z-40 flex justify-end">
          <div ref={drawerRef} className="bg-white w-[350px] h-full p-4 overflow-y-auto shadow-lg z-50">
            <div className="flex justify-between items-center mb-3">
              <h2 className="font-bold text-base">Filtros / Etiquetas</h2>
              <button onClick={() => setOpen(false)} className="text-lg font-bold px-2">&times;</button>
            </div>
            <div className="flex flex-wrap gap-4">
              {filtrosPorCategoria.map(({ categoria, filtros }) => (
                <div key={categoria} className="min-w-[140px]">
                  <div className="font-semibold mb-1 text-sm">{categoria}</div>
                  {filtros.map(filtro => (
                    <label key={filtro.id} className="flex items-center gap-2 mb-1 cursor-pointer text-sm">
                      <input
                        type="checkbox"
                        checked={filtrosSeleccionados.has(String(filtro.id))}
                        onChange={() => handleToggle(filtro)}
                      />
                      <span>{filtro.nombre}</span>
                    </label>
                  ))}
                </div>
              ))}
            </div>
            <div className="mt-4 flex gap-2">
              <button
                type="button"
                onClick={limpiar}
                className="px-2 py-1 rounded bg-orange-500 text-white text-xs font-semibold hover:bg-orange-600 transition"
              >
                Limpiar Filtros
              </button>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="px-2 py-1 rounded bg-gray-300 text-gray-800 text-xs font-semibold hover:bg-gray-400 transition"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}