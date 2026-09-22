import { NextResponse } from 'next/server';
import { auth } from '@/app/lib/auth';
import { db } from '@/app/lib/mysql';
import { puedeAdministrar } from '@/app/lib/roles';
import { jsonError, mapRequest, type VacationRequest } from '@/app/lib/vacaciones';

export async function GET() {
  const session = await auth();

  if (!session?.user?.id) {
    return jsonError('No autenticado', 401);
  }

  if (!puedeAdministrar(session.user.rol)) {
    return jsonError('No autorizado', 403);
  }

  try {
    const [rows] = await db.query<VacationRequest[]>(
      `SELECT s.id, s.usuario_id,
              DATE_FORMAT(s.fecha_desde, '%Y-%m-%d') AS fecha_desde,
              DATE_FORMAT(s.fecha_hasta, '%Y-%m-%d') AS fecha_hasta,
              s.cantidad_dias, s.comentario, s.estado, s.aprobado_por,
              s.fecha_aprobacion, s.motivo_rechazo, s.fecha_solicitud, s.fecha_actualizacion,
              u.username, u.email, u.rol
       FROM usuario_solicitud_vacaciones s
       INNER JOIN usuarios u ON u.id = s.usuario_id
       WHERE s.estado = 'aprobada'
         AND CURDATE() BETWEEN s.fecha_desde AND s.fecha_hasta
       ORDER BY s.fecha_desde ASC`,
    );

    return NextResponse.json({ vacaciones: rows.map(mapRequest) });
  } catch (error) {
    console.error('[admin/vacaciones/activas] Error:', error);
    return jsonError('No se pudieron obtener las vacaciones activas.', 500);
  }
}
