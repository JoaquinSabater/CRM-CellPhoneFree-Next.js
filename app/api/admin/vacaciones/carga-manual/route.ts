import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/lib/auth';
import { db } from '@/app/lib/mysql';
import { getUsuarioIdSesion, puedeAdministrar } from '@/app/lib/roles';
import {
  SALDO_DEL_ANIO_SQL,
  countVacationDays,
  getVacationYear,
  isValidDateString,
  jsonError,
  type VacationBalance,
} from '@/app/lib/vacaciones';

/** Administración carga vacaciones ya aprobadas, sin pasar por el líder del área. */
export async function POST(request: NextRequest) {
  const session = await auth();

  if (!session?.user?.id) {
    return jsonError('No autenticado', 401);
  }

  let body: { usuario_id?: unknown; fecha_desde?: unknown; fecha_hasta?: unknown; comentario?: unknown };

  try {
    body = await request.json();
  } catch {
    return jsonError('La solicitud es invalida.');
  }

  const usuarioId = Number(body.usuario_id);
  const { fecha_desde: fechaDesde, fecha_hasta: fechaHasta } = body;

  if (!Number.isInteger(usuarioId) || usuarioId <= 0) {
    return jsonError('Usuario invalido.');
  }

  if (!isValidDateString(fechaDesde) || !isValidDateString(fechaHasta)) {
    return jsonError('Las fechas son requeridas y deben tener formato valido.');
  }

  const cantidadDias = countVacationDays(fechaDesde, fechaHasta);

  if (cantidadDias <= 0) {
    return jsonError('La fecha desde no puede ser posterior a la fecha hasta.');
  }

  if (!puedeAdministrar(session.user.rol)) {
    return jsonError('No autorizado', 403);
  }

  const aprobadorId = getUsuarioIdSesion(session.user.id, session.user.rol);
  const comentario = typeof body.comentario === 'string' && body.comentario.trim()
    ? body.comentario.trim()
    : 'Cargada por administracion.';
  const anio = getVacationYear(fechaDesde);
  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    const [saldoRows] = await connection.query<VacationBalance[]>(
      `${SALDO_DEL_ANIO_SQL} FOR UPDATE`,
      [usuarioId, anio],
    );

    const saldo = saldoRows[0];

    if (!saldo) {
      await connection.rollback();
      return jsonError(`El usuario no tiene saldo cargado para ${anio}. Cargalo primero en la tabla de saldos.`, 404);
    }

    if (saldo.dias_restantes < cantidadDias) {
      await connection.rollback();
      return jsonError(
        `El usuario tiene ${saldo.dias_restantes} dias restantes y la carga es de ${cantidadDias}. Ajusta el saldo primero.`,
      );
    }

    const [solapadas]: any = await connection.query(
      `SELECT id
       FROM usuario_solicitud_vacaciones
       WHERE usuario_id = ?
         AND estado IN ('pendiente', 'aprobada')
         AND fecha_desde <= ?
         AND fecha_hasta >= ?
       LIMIT 1`,
      [usuarioId, fechaHasta, fechaDesde],
    );

    if (solapadas.length > 0) {
      await connection.rollback();
      return jsonError('El usuario ya tiene vacaciones pendientes o aprobadas en esas fechas.', 409);
    }

    await connection.query(
      `INSERT INTO usuario_solicitud_vacaciones
        (usuario_id, fecha_desde, fecha_hasta, cantidad_dias, comentario, estado, aprobado_por, fecha_aprobacion)
       VALUES (?, ?, ?, ?, ?, 'aprobada', ?, NOW())`,
      [usuarioId, fechaDesde, fechaHasta, cantidadDias, comentario, aprobadorId],
    );

    await connection.query(
      `UPDATE usuario_vacaciones_saldo
       SET dias_usados = dias_usados + ?,
           dias_restantes = dias_restantes - ?
       WHERE id = ?`,
      [cantidadDias, cantidadDias, saldo.id],
    );

    await connection.commit();
    return NextResponse.json({ message: 'Vacaciones cargadas correctamente.' }, { status: 201 });
  } catch (error) {
    await connection.rollback();
    console.error('[admin/vacaciones/carga-manual] Error:', error);
    return jsonError('No se pudieron cargar las vacaciones.', 500);
  } finally {
    connection.release();
  }
}
