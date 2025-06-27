'use client';

import { useSearchParams, usePathname, useRouter } from 'next/navigation';

type Filtro = { id: number; nombre: string; categoria: string }

export default function FiltrosPorCategoriaListbox({ filtros }: { filtros: Filtro[] }) {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const { replace } = useRouter();
  const router = useRouter()


  const categorias = Array.from(new Set(filtros.map(f => f.categoria)));

  function handleChange(categoria: string, filtroId: string) {
    const params = new URLSearchParams(searchParams);
    params.set('page', '1');
    if (filtroId) {
      params.set(`filtro_${categoria}`, filtroId);
    } else {
      params.delete(`filtro_${categoria}`);
    }
    replace(`${pathname}?${params.toString()}`);
  }

  function limpiar() {
    const params = new URLSearchParams(searchParams)
    Array.from(params.keys()).forEach(key => {
      if (key.startsWith('filtro_')) params.delete(key)
    })
    router.replace(`${pathname}?${params.toString()}`)
  }

  return (
    <div className="flex flex-row items-center gap-5 w-full ">
      {/* Listbox filtros */}
      {categorias.map(categoria => {
        const opciones = filtros.filter(f => f.categoria === categoria);
        const filtroSelected = searchParams.get(`filtro_${categoria}`) ?? '';
        return (
          <div key={categoria} className="flex flex-col min-w-[170px]">
            <select
              className="border rounded px-2 py-1 text-sm"
              value={filtroSelected}
              onChange={e => handleChange(categoria, e.target.value)}
            >
              <option className="">{categoria}</option>
              {opciones.map(f =>
                <option key={f.id} value={f.id}>{f.nombre}</option>
              )}
            </select>
          </div>
        );
      })}
      <button
        type="button"
        onClick={limpiar}
        className="px-3 py-1.5 rounded bg-orange-500 text-white text-xs font-semibold hover:bg-orange-600 transition"
      >
        Limpiar Filtros
      </button>
    </div>
  );
}

