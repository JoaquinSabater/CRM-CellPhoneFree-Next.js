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

export function UpdateCliente({ id }: { id: string }) {
  console.log('UpdateCliente - ID recibido:', id); // Depurar el valor del ID
  return (
    <Link
      href={`/dashboard/invoices/${id}/edit`}     
      className="rounded-md border p-2 hover:bg-gray-100"
    >
      <DocumentDuplicateIcon className="w-5" />
    </Link>
  );
}

{/*}
export function DeleteInvoice({ id }: { id: string }) {
  const deleteInvoiceWithId = deleteInvoice.bind(null, id);
  return (
    <form action={deleteInvoiceWithId}>
      <button type="submit" className="rounded-md border p-2 hover:bg-gray-100">
        <span className="sr-only">Delete</span>
        <TrashIcon className="w-4" />
      </button>
    </form>
  );
}
*/} 

