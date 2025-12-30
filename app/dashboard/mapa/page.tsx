import { auth } from '@/app/lib/auth';
import { redirect } from 'next/navigation';
import ClientesMapaView from '@/app/ui/dashboard/mapa/ClientesMapaView';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function MapaPage() {
  const session = await auth();

  // Solo vendedores pueden acceder al mapa
  if (session?.user?.rol !== 'vendedor') {
    redirect('/dashboard');
  }

  const vendedorId = session.user.vendedor_id;

  return (
    <ClientesMapaView vendedorId={vendedorId} />
  );
}
