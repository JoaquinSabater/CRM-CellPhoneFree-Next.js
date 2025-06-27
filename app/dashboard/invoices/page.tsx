import Search from '@/app/ui/search';
import { Suspense } from 'react';
import Table from '@/app/ui/invoices/table';
import LoadingSpinner from '@/app/ui/loading';
import {CrearProspecto} from '@/app/ui/invoices/buttons';
import { auth } from '@/app/lib/auth';
import FiltrosPorCategoriaListbox from '@/app/ui/invoices/FiltrosPorCategoriaListbox';
import { fetchFiltrosFijos } from '@/app/lib/data';


export default async function Page(props: { searchParams: Promise<{ query?: string; page?: string }> }) {
  const searchParams = await props.searchParams; // Resuelve la promesa
  const session = await auth();
  const rol = session?.user?.rol;
  const filtrosFijos = await fetchFiltrosFijos();

  const query = searchParams?.query ?? '';

  const filtrosSeleccionados: { [cat: string]: number } = {};
  for (const [key, value] of Object.entries(searchParams)) {
    if (key.startsWith('filtro_')) {
      const cat = key.replace('filtro_', '');
      const filtroId = parseInt(value as string);
      if (!isNaN(filtroId)) filtrosSeleccionados[cat] = filtroId;
    }
  }

  return (
    <div className="w-full">
      <div className="mt-4 flex items-center justify-between gap-2 md:mt-8 mb-4">
        <Search placeholder="Buscar Clientes..." />
        {rol === 'captador' && <CrearProspecto />}
      </div>
      <div className="flex flex-row items-start justify-between mb-6 gap-4">
        <div className="flex flex-row gap-4">
          <FiltrosPorCategoriaListbox filtros={filtrosFijos} />
        </div>
      </div>
      <Suspense fallback={<LoadingSpinner />}>
        <Table query={query} filtrosSeleccionados={filtrosSeleccionados}/>
      </Suspense>
    </div>
  );
}
