import { DocumentDuplicateIcon, PlusIcon, TrashIcon,PencilIcon  } from '@heroicons/react/24/outline';
import Link from 'next/link';
import { Suspense } from 'react';
import { desactivarProspecto } from '@/app/lib/actions';
import LoadingSpinner from '@/app/ui/loading';

export function CrearEtiqueta() {
  return (
      <Link
        href="/dashboard/invoices/create"
        className="flex h-10 items-center rounded-lg bg-orange-600 px-4 text-sm font-medium text-white transition-colors hover:bg-orange-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
      >
        <span className="hidden md:block">Crear Etiqueta</span>{' '}
        <PlusIcon className="h-5 md:ml-4" />
      </Link>
  );
}

export function CrearProspecto() {
  return (
      <Link
        href="/dashboard/prospects/create"
        className="flex h-10 items-center rounded-lg bg-orange-600 px-4 text-sm font-medium text-white transition-colors hover:bg-orange-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
      >
        <span className="hidden md:block">Crear Prospecto</span>{' '}
        <PlusIcon className="h-5 md:ml-4" />
      </Link>
  );
}

export function UpdateCliente({ id }: { id: string }) {
  return (
      <Link
        href={`/dashboard/invoices/${id}/edit?from=clientes`}    
        className="inline-flex items-center justify-center rounded-md p-1.5 hover:bg-gray-100 transition">
        <PencilIcon className="w-5" />
      </Link>
  );
}

export function UpdateProspecto({ id }: { id: number }) {
  return (
      <Link
        href={`/dashboard/prospects/${id}/edit`}
        className="inline-flex items-center justify-center rounded-md p-1.5 hover:bg-gray-100 transition">
        <PencilIcon className="w-5 h-5 text-gray-600" />
      </Link>
  );
}

export function DeleteProspecto({ id }: { id: number }) {
  const delate = desactivarProspecto.bind(null, id);
  return (
      <form action={delate}>
          <button type="submit" className="inline-flex items-center justify-center rounded-md p-1.5 hover:bg-gray-100 transition">
            <span className="sr-only">Delete</span>
            <TrashIcon className="w-5 h-5 text-gray-600" />
          </button>
      </form>
  );
}
