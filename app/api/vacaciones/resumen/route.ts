import { NextResponse } from 'next/server';
import { auth } from '@/app/lib/auth';
import { db } from '@/app/lib/mysql';
import {
  mapBalance,
  mapRequest,
  type VacationBalance,
  type VacationRequest,
} from '@/app/lib/vacaciones';

export async function GET() {
  const session = await auth();
  const userId = Number(session?.user?.id);

  if (!userId) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
  }

  try {
    const currentYear = new Date().getFullYear();
    const [saldoRows] = await db.query<VacationBalance[]>(
      `SELECT id, usuario_id, anio, dias_totales, dias_usados, dias_pendientes, dias_restantes
       FROM usuario_vacaciones_saldo
       WHERE usuario_id = ? AND anio = ?
       LIMIT 1`,
      [userId, currentYear],
    );

    const [solicitudRows] = await db.query<VacationRequest[]>(
      `SELECT id, usuario_id,
              DATE_FORMAT(fecha_desde, '%Y-%m-%d') AS fecha_desde,
              DATE_FORMAT(fecha_hasta, '%Y-%m-%d') AS fecha_hasta,
              cantidad_dias, comentario, estado, aprobado_por, fecha_aprobacion,
              motivo_rechazo, fecha_solicitud, fecha_actualizacion
       FROM usuario_solicitud_vacaciones
       WHERE usuario_id = ?
       ORDER BY fecha_solicitud DESC`,
      [userId],
    );

    return NextResponse.json({
      saldo: mapBalance(saldoRows[0]),
      solicitudes: solicitudRows.map(mapRequest),
    });
  } catch (error) {
    console.error('[vacaciones/resumen] Error:', error);
    return NextResponse.json(
      { error: 'No se pudo obtener la informacion de vacaciones.' },
      { status: 500 },
    );
  }
}
