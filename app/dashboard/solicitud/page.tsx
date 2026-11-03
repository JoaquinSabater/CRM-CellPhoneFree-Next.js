import SolicitudVacacionesView from '@/app/ui/solicitudes/SolicitudVacacionesView';
import SolicitudPermisosView from '@/app/ui/solicitudes/SolicitudPermisosView';
import SolicitudTabs, { parseSolicitudTab } from '@/app/ui/solicitudes/SolicitudTabs';
import { auth } from '@/app/lib/auth';
import { esSuperAdmin } from '@/app/lib/roles';

export default async function SolicitudPage(props: { searchParams: Promise<{ tab?: string }> }) {
  const session = await auth();

  // El super usuario pide vacaciones como usuario 1, pero no tiene permisos de salida propios
  if (esSuperAdmin(session?.user?.rol)) {
    return <SolicitudVacacionesView />;
  }

  const tab = parseSolicitudTab((await props.searchParams).tab);

  return (
    <>
      <SolicitudTabs basePath="/dashboard/solicitud" active={tab} />
      {tab === 'permisos' ? <SolicitudPermisosView /> : <SolicitudVacacionesView />}
    </>
  );
}
