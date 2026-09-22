import SolicitudVacacionesView from '@/app/ui/solicitudes/SolicitudVacacionesView';
import { auth } from '@/app/lib/auth';
import { esSuperAdmin } from '@/app/lib/roles';

export default async function SolicitudPage() {
  const session = await auth();

  // El super usuario no es un empleado de la base: no tiene saldo de vacaciones propio
  if (esSuperAdmin(session?.user?.rol)) {
    return (
      <div className="rounded-lg border border-slate-200 bg-white p-6 text-sm text-slate-600">
        El super usuario no tiene saldo de vacaciones propio. Las solicitudes de todo el equipo se
        gestionan desde <span className="font-medium text-slate-900">Administración</span>.
      </div>
    );
  }

  return <SolicitudVacacionesView />;
}
