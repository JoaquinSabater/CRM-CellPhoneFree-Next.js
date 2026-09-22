import { redirect } from 'next/navigation';
import AdminVacacionesView from '@/app/ui/solicitudes/AdminVacacionesView';
import { auth } from '@/app/lib/auth';
import { puedeAdministrar } from '@/app/lib/roles';

export default async function AdministracionPage() {
  const session = await auth();

  if (!puedeAdministrar(session?.user?.rol)) {
    redirect('/dashboard');
  }

  return <AdminVacacionesView />;
}
