import Search from '@/app/ui/search';
import { Suspense } from 'react';
import Table from '@/app/ui/invoices/table';
import LoadingSpinner from '@/app/ui/loading';
import {CrearProspecto} from '@/app/ui/invoices/buttons';
import { auth } from '@/app/lib/auth';

export default async function Page(props: { searchParams: Promise<{ query?: string; page?: string }> }) {
  const searchParams = await props.searchParams; // Resuelve la promesa
  const session = await auth();
  const rol = session?.user?.rol;

  const query = searchParams?.query ?? '';

  return (
    <div className="w-full">
      <div className="mt-4 flex items-center justify-between gap-2 md:mt-8">
        <Search placeholder="Buscar Clientes..." />
        {rol === 'captador' && <CrearProspecto />}
      </div>
      <Suspense fallback={<LoadingSpinner />}>
        <Table query={query} />
      </Suspense>
    </div>
  );
}
