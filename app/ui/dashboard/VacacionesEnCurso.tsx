import type { RowDataPacket } from 'mysql2';
import { SunIcon } from '@heroicons/react/24/outline';
import { auth } from '@/app/lib/auth';
import { db } from '@/app/lib/mysql';

interface CompanieroDeVacaciones extends RowDataPacket {
  usuario_id: number;
  username: string;
  fecha_hasta: string;
}

function formatDayMonth(value: string) {
  const [, month, day] = value.split('-');
  return `${day}/${month}`;
}

function capitalize(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

/** Franja visible para todo el equipo con quién está de vacaciones hoy. */
export default async function VacacionesEnCurso() {
  const session = await auth();

  if (!session?.user) {
    return null;
  }

  let companieros: CompanieroDeVacaciones[] = [];

  try {
    // "Hoy" según el reloj de la base, que está en hora argentina
    const [rows] = await db.query<CompanieroDeVacaciones[]>(
      `SELECT s.usuario_id, u.username, DATE_FORMAT(MAX(s.fecha_hasta), '%Y-%m-%d') AS fecha_hasta
       FROM usuario_solicitud_vacaciones s
       INNER JOIN usuarios u ON u.id = s.usuario_id
       WHERE s.estado = 'aprobada'
         AND CURDATE() BETWEEN s.fecha_desde AND s.fecha_hasta
       GROUP BY s.usuario_id, u.username
       ORDER BY fecha_hasta ASC, u.username ASC`,
    );
    companieros = rows;
  } catch (error) {
    console.error('[VacacionesEnCurso] Error:', error);
    return null;
  }

  if (companieros.length === 0) {
    return null;
  }

  return (
    <aside
      aria-label="Compañeros de vacaciones"
      className="mx-auto mb-4 flex max-w-7xl flex-wrap items-center gap-x-3 gap-y-2 rounded-lg border border-orange-200 bg-orange-50 px-4 py-3 text-sm text-orange-900"
    >
      <span className="flex items-center gap-2 font-semibold">
        <SunIcon className="h-5 w-5 text-orange-600" />
        De vacaciones hoy:
      </span>
      {companieros.map((companiero) => (
        <span
          key={companiero.usuario_id}
          className="rounded-full border border-orange-200 bg-white px-3 py-1 font-medium"
        >
          {capitalize(companiero.username)}
          <span className="font-normal text-orange-700"> · hasta el {formatDayMonth(companiero.fecha_hasta)}</span>
        </span>
      ))}
    </aside>
  );
}
