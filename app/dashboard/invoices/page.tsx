import Pagination from '@/app/ui/invoices/pagination';
import Search from '@/app/ui/search';
import { Suspense } from 'react';
import Table from '@/app/ui/invoices/table';
import LoadingSpinner from '@/app/ui/loading';
import { fetchClientesPages,fetchProspectsPages } from '@/app/lib/data';
import {CrearEtiqueta,CrearProspecto} from '@/app/ui/invoices/buttons';
import { auth } from '@/app/lib/auth';

export default async function Page(props: { searchParams: Promise<{ query?: string; page?: string }> }) {
  const searchParams = await props.searchParams; // Resuelve la promesa
  const session = await auth();
  const vendedorId = session?.user?.vendedor_id;
  const rol = session?.user?.rol;

  const query = searchParams?.query ?? '';
  const currentPage = Number(searchParams?.page ?? '1');
  const totalPages = rol === 'vendedor' ? await fetchClientesPages(query, Number(vendedorId)): 0;
  const totalProspectos = rol === 'captador' ? await fetchProspectsPages(query): 0;


  return (
    <div className="w-full">
      <div className="mt-4 flex items-center justify-between gap-2 md:mt-8">
        <Search placeholder="Buscar Clientes..." />
        {vendedorId === 2 && <CrearEtiqueta />}
        {rol === 'captador' && <CrearProspecto />}
      </div>
      <Suspense fallback={<LoadingSpinner />}>
        <Table query={query} />
      </Suspense>
      <div className="mt-5 flex w-full justify-center">
        {rol==='captador' && <Pagination totalPages={totalProspectos} />}
        {rol==='vendedor' && <Pagination totalPages={totalPages} />}
      </div>
    </div>
  );
}
