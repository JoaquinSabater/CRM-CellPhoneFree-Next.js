import { NextResponse } from 'next/server';
import { auth } from '@/app/lib/auth';
import { db } from '@/app/lib/mysql';
import { puedeAdministrar } from '@/app/lib/roles';
import { jsonError } from '@/app/lib/vacaciones';
import { PERMISO_COLUMNS, mapPermiso, type PermisoRequest } from '@/app/lib/permisos';

export async function GET() {
  const session = await auth();

  if (!session?.user?.id) {
    return jsonError('No autenticado', 401);
  }

  if (!puedeAdministrar(session.user.rol)) {
    return jsonError('No autorizado', 403);
  }

  try {
    const [rows] = await db.query<PermisoRequest[]>(
      `SELECT ${PERMISO_COLUMNS}, u.username, u.email, u.rol
       FROM usuario_solicitud_permisos s
       INNER JOIN usuarios u ON u.id = s.usuario_id
       ORDER BY s.fecha DESC, s.hora_desde DESC`,
    );

    // "Hoy" según el reloj de la base, que está en hora argentina
    const [[{ hoy }]]: any = await db.query(`SELECT DATE_FORMAT(CURDATE(), '%Y-%m-%d') AS hoy`);

    return NextResponse.json({ solicitudes: rows.map(mapPermiso), hoy });
  } catch (error) {
    console.error('[admin/permisos/solicitudes] Error:', error);
    return jsonError('No se pudieron obtener los permisos.', 500);
  }
}
