import SolicitudVacacionesView from '@/app/ui/solicitudes/SolicitudVacacionesView';
import SolicitudPermisosView from '@/app/ui/solicitudes/SolicitudPermisosView';
import SolicitudTabs, { parseSolicitudTab } from '@/app/ui/solicitudes/SolicitudTabs';
import { auth } from '@/app/lib/auth';
import { esSuperAdmin } from '@/app/lib/roles';

export default async function SolicitudPage(props: { searchParams: Promise<{ tab?: string }> }) {
  const session = await auth();

  // El super usuario no es un empleado de la base: no tiene vacaciones ni permisos propios
  if (esSuperAdmin(session?.user?.rol)) {
    return (
      <div className="rounded-lg border border-slate-200 bg-white p-6 text-sm text-slate-600">
        El super usuario no tiene vacaciones ni permisos propios. Las solicitudes de todo el equipo se
        gestionan desde <span className="font-medium text-slate-900">Administración</span>.
      </div>
    );
  }

  const tab = parseSolicitudTab((await props.searchParams).tab);

  return (
    <>
      <SolicitudTabs basePath="/dashboard/solicitud" active={tab} />
      {tab === 'permisos' ? <SolicitudPermisosView /> : <SolicitudVacacionesView />}
    </>
  );
}
