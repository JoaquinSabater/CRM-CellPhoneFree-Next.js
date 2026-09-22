import { auth } from '@/app/lib/auth';
import { redirect } from 'next/navigation';
import ClientesMapaView from '@/app/ui/dashboard/mapa/ClientesMapaView';
import { esSuperAdmin } from '@/app/lib/roles';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function MapaPage() {
  const session = await auth();
  const rol = session?.user?.rol;

  // Solo vendedores y el super usuario pueden acceder al mapa
  if (rol !== 'vendedor' && !esSuperAdmin(rol)) {
    redirect('/dashboard');
  }

  const vendedorId = session?.user?.vendedor_id ?? 0;

  return (
    <ClientesMapaView vendedorId={vendedorId} esAdmin={esSuperAdmin(rol)} />
  );
}
