import Pagination from '@/app/ui/invoices/pagination';
import Search from '@/app/ui/search';
import Table from '@/app/ui/invoices/table';
import { CreateInvoice } from '@/app/ui/invoices/buttons';
import { lusitana } from '@/app/ui/fonts';
import { InvoicesTableSkeleton } from '@/app/ui/skeletons';
import { Suspense } from 'react';
import { fetchInvoicesPages, fetchFilteredInvoices } from '@/app/lib/data';
import CustomerTypeFilter from '@/app/ui/customer-type-filter';
import CustomerLimitFilter from '@/app/ui/customer-limit-filter';

export default async function Page(props: {
  searchParams?: Promise<{
    query?: string;
    page?: string;
    type?: string;
    limit?: string;
  }>;
}) {
  const searchParams = await props.searchParams;
  const query = searchParams?.query || '';
  const type = searchParams?.type || '';
  const limit = searchParams?.limit || '';
  const currentPage = Number(searchParams?.page) || 1;
  const totalPages = await fetchInvoicesPages(query, type, limit);

  return (
    <div className="w-full">
      <div className="flex w-full items-center justify-between">
        <h1 className={`${lusitana.className} text-2xl`}>Invoices</h1>
      </div>
      <div className="mt-4 flex items-center justify-between gap-2 md:mt-8">
        <Search placeholder="Search invoices..." />
        {/*<CreateInvoice /> */}
      </div>
      <div className="mt-4 flex items-center justify-start gap-2 md:mt-6">
        <CustomerTypeFilter />
        <CustomerLimitFilter />
      </div>
      <Suspense key={query + type + limit + currentPage} fallback={<InvoicesTableSkeleton />}>
        <Table query={query} type={type} limit={limit} currentPage={currentPage} />
      </Suspense>
      <div className="mt-5 flex w-full justify-center">
        <Pagination totalPages={totalPages} />
      </div>
    </div>
  );
}