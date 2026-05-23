import { auth } from '@/app/lib/auth';
import { redirect } from 'next/navigation';
import CatalogoModeloView from '@/app/ui/dashboard/catalogo-modelo/CatalogoModeloView';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function CatalogoModeloPage(props: {
  searchParams: Promise<{ marca?: string; modelo?: string }>;
}) {
  const session = await auth();

  if (session?.user?.rol !== 'vendedor') {
    redirect('/dashboard');
  }

  const searchParams = await props.searchParams;

  return (
    <CatalogoModeloView
      initialMarcaId={searchParams.marca ?? ''}
      initialModelo={searchParams.modelo ?? ''}
    />
  );
}