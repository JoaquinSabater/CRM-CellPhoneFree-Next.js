import { redirect } from 'next/navigation';
import AdminVacacionesView from '@/app/ui/solicitudes/AdminVacacionesView';
import AdminPermisosView from '@/app/ui/solicitudes/AdminPermisosView';
import SolicitudTabs, { parseSolicitudTab } from '@/app/ui/solicitudes/SolicitudTabs';
import { auth } from '@/app/lib/auth';
import { puedeAdministrar } from '@/app/lib/roles';

export default async function AdministracionPage(props: { searchParams: Promise<{ tab?: string }> }) {
  const session = await auth();

  if (!puedeAdministrar(session?.user?.rol)) {
    redirect('/dashboard');
  }

  const tab = parseSolicitudTab((await props.searchParams).tab);

  return (
    <>
      <SolicitudTabs basePath="/dashboard/administracion" active={tab} />
      {tab === 'permisos' ? <AdminPermisosView /> : <AdminVacacionesView />}
    </>
  );
}
