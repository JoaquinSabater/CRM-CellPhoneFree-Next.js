import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/lib/auth';
import { db } from '@/app/lib/mysql';
import {
  countVacationDays,
  getVacationYear,
  isValidDateString,
  jsonError,
  type VacationBalance,
} from '@/app/lib/vacaciones';

export async function POST(request: NextRequest) {
  const session = await auth();
  const userId = Number(session?.user?.id);

  if (!userId) {
    return jsonError('No autenticado', 401);
  }

  let body: {
    fecha_desde?: unknown;
    fecha_hasta?: unknown;
    cantidad_dias?: unknown;
    comentario?: unknown;
  };

  try {
    body = await request.json();
  } catch {
    return jsonError('La solicitud es invalida.');
  }

  const { fecha_desde: fechaDesde, fecha_hasta: fechaHasta } = body;

  if (!isValidDateString(fechaDesde) || !isValidDateString(fechaHasta)) {
    return jsonError('Las fechas son requeridas y deben tener formato valido.');
  }

  const calculatedDays = countVacationDays(fechaDesde, fechaHasta);
  const requestedDays = Number(body.cantidad_dias ?? calculatedDays);

  if (calculatedDays <= 0) {
    return jsonError('La fecha desde no puede ser posterior a la fecha hasta.');
  }

  if (!Number.isInteger(requestedDays) || requestedDays <= 0 || requestedDays !== calculatedDays) {
    return jsonError('La cantidad de dias es invalida.');
  }

  const comentario = typeof body.comentario === 'string' ? body.comentario.trim() : '';
  const anio = getVacationYear(fechaDesde);
  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    const [saldoRows] = await connection.query<VacationBalance[]>(
      `SELECT id, dias_restantes
       FROM usuario_vacaciones_saldo
       WHERE usuario_id = ? AND anio = ?
       LIMIT 1
       FOR UPDATE`,
      [userId, anio],
    );

    const saldo = saldoRows[0];

    if (!saldo) {
      await connection.rollback();
      return jsonError('No hay saldo de vacaciones cargado para este anio.', 404);
    }

    if (saldo.dias_restantes < requestedDays) {
      await connection.rollback();
      return jsonError('No tenes dias suficientes disponibles.', 400);
    }

    await connection.query(
      `INSERT INTO usuario_solicitud_vacaciones
        (usuario_id, fecha_desde, fecha_hasta, cantidad_dias, comentario, estado)
       VALUES (?, ?, ?, ?, ?, 'pendiente')`,
      [userId, fechaDesde, fechaHasta, requestedDays, comentario || null],
    );

    await connection.query(
      `UPDATE usuario_vacaciones_saldo
       SET dias_pendientes = dias_pendientes + ?,
           dias_restantes = dias_restantes - ?
       WHERE id = ?`,
      [requestedDays, requestedDays, saldo.id],
    );

    await connection.commit();

    return NextResponse.json({ message: 'Solicitud creada correctamente.' }, { status: 201 });
  } catch (error) {
    await connection.rollback();
    console.error('[vacaciones/solicitudes] Error:', error);
    return jsonError('No se pudo crear la solicitud.', 500);
  } finally {
    connection.release();
  }
}
