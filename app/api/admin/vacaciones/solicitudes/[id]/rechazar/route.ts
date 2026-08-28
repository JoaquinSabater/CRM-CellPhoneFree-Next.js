import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/lib/auth';
import { db } from '@/app/lib/mysql';
import { jsonError, type VacationBalance, type VacationRequest } from '@/app/lib/vacaciones';

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  const adminId = Number(session?.user?.id);

  if (!adminId) {
    return jsonError('No autenticado', 401);
  }

  if (session?.user?.rol !== 'administracion') {
    return jsonError('No autorizado', 403);
  }

  const { id } = await context.params;
  const solicitudId = Number(id);

  if (!Number.isInteger(solicitudId) || solicitudId <= 0) {
    return jsonError('Solicitud invalida.');
  }

  let body: { motivo_rechazo?: unknown } = {};

  try {
    body = await request.json();
  } catch {
    body = {};
  }

  const motivoRechazo = typeof body.motivo_rechazo === 'string' && body.motivo_rechazo.trim()
    ? body.motivo_rechazo.trim()
    : null;
  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    const [requestRows] = await connection.query<VacationRequest[]>(
      `SELECT id, usuario_id, cantidad_dias, estado, YEAR(fecha_desde) AS anio
       FROM usuario_solicitud_vacaciones
       WHERE id = ?
       LIMIT 1
       FOR UPDATE`,
      [solicitudId],
    );

    const solicitud = requestRows[0] as VacationRequest & { anio: number } | undefined;

    if (!solicitud) {
      await connection.rollback();
      return jsonError('Solicitud no encontrada.', 404);
    }

    if (solicitud.estado !== 'pendiente') {
      await connection.rollback();
      return jsonError('La solicitud ya no esta pendiente.');
    }

    const [saldoRows] = await connection.query<VacationBalance[]>(
      `SELECT id, dias_pendientes
       FROM usuario_vacaciones_saldo
       WHERE usuario_id = ? AND anio = ?
       LIMIT 1
       FOR UPDATE`,
      [solicitud.usuario_id, solicitud.anio],
    );

    const saldo = saldoRows[0];

    if (!saldo || saldo.dias_pendientes < solicitud.cantidad_dias) {
      await connection.rollback();
      return jsonError('El saldo del usuario no es consistente para rechazar esta solicitud.', 409);
    }

    await connection.query(
      `UPDATE usuario_solicitud_vacaciones
       SET estado = 'rechazada',
           aprobado_por = ?,
           fecha_aprobacion = NOW(),
           motivo_rechazo = ?
       WHERE id = ?`,
      [adminId, motivoRechazo, solicitudId],
    );

    await connection.query(
      `UPDATE usuario_vacaciones_saldo
       SET dias_pendientes = dias_pendientes - ?,
           dias_restantes = dias_restantes + ?
       WHERE id = ?`,
      [solicitud.cantidad_dias, solicitud.cantidad_dias, saldo.id],
    );

    await connection.commit();
    return NextResponse.json({ message: 'Solicitud rechazada correctamente.' });
  } catch (error) {
    await connection.rollback();
    console.error('[admin/vacaciones/rechazar] Error:', error);
    return jsonError('No se pudo rechazar la solicitud.', 500);
  } finally {
    connection.release();
  }
}
