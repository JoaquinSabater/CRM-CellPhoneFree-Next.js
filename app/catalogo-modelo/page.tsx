import { redirect } from 'next/navigation';

export default async function CatalogoModeloRedirect(props: {
  searchParams: Promise<{ marca?: string; modelo?: string }>;
}) {
  const searchParams = await props.searchParams;
  const params = new URLSearchParams();

  if (searchParams.marca) {
    params.set('marca', searchParams.marca);
  }

  if (searchParams.modelo) {
    params.set('modelo', searchParams.modelo);
  }

  const query = params.toString();
  redirect(query ? `/dashboard/catalogo-modelo?${query}` : '/dashboard/catalogo-modelo');
}