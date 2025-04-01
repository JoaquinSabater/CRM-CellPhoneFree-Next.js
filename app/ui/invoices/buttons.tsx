import { DocumentDuplicateIcon, PlusIcon, TrashIcon  } from '@heroicons/react/24/outline';
import Link from 'next/link';
//import { deleteInvoice } from '@/app/lib/actions';

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


