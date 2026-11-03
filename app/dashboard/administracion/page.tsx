import { redirect } from 'next/navigation';
import AdminVacacionesView from '@/app/ui/solicitudes/AdminVacacionesView';
import AdminPermisosView from '@/app/ui/solicitudes/AdminPermisosView';
import SolicitudTabs, { parseSolicitudTab } from '@/app/ui/solicitudes/SolicitudTabs';
import { auth } from '@/app/lib/auth';
import { puedeAdministrar, puedeVerPanelAdministracion } from '@/app/lib/roles';

export default async function AdministracionPage(props: { searchParams: Promise<{ tab?: string }> }) {
  const session = await auth();

  if (!puedeVerPanelAdministracion(session?.user?.id, session?.user?.rol)) {
    redirect('/dashboard');
  }

  // Los líderes de área solo aprueban vacaciones: los permisos siguen en administración
  if (!puedeAdministrar(session?.user?.rol)) {
    return <AdminVacacionesView />;
  }

  const tab = parseSolicitudTab((await props.searchParams).tab);

  return (
    <>
      <SolicitudTabs basePath="/dashboard/administracion" active={tab} />
      {tab === 'permisos' ? <AdminPermisosView /> : <AdminVacacionesView puedeGestionar />}
    </>
  );
}
