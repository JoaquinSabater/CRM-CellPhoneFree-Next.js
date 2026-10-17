import { NextRequest, NextResponse } from 'next/server';
import type { RowDataPacket } from 'mysql2';
import { auth } from '@/app/lib/auth';
import { db } from '@/app/lib/mysql';
import { isValidDateString, jsonError } from '@/app/lib/vacaciones';
import {
  PERMISO_COLUMNS,
  esTipoPermiso,
  isValidTimeString,
  mapPermiso,
  type PermisoRequest,
} from '@/app/lib/permisos';

export async function GET() {
  const session = await auth();
  const userId = Number(session?.user?.id);

  if (!userId) {
    return jsonError('No autenticado', 401);
  }

  try {
    const [rows] = await db.query<PermisoRequest[]>(
      `SELECT ${PERMISO_COLUMNS}
       FROM usuario_solicitud_permisos s
       WHERE s.usuario_id = ?
       ORDER BY s.fecha DESC, s.hora_desde DESC`,
      [userId],
    );

    return NextResponse.json({ solicitudes: rows.map(mapPermiso) });
  } catch (error) {
    console.error('[permisos/solicitudes] Error:', error);
    return jsonError('No se pudieron obtener los permisos.', 500);
  }
}

export async function POST(request: NextRequest) {
  const session = await auth();
  const userId = Number(session?.user?.id);

  if (!userId) {
    return jsonError('No autenticado', 401);
  }

  let body: {
    tipo?: unknown;
    fecha?: unknown;
    dia_completo?: unknown;
    hora_desde?: unknown;
    hora_hasta?: unknown;
    comentario?: unknown;
  };

  try {
    body = await request.json();
  } catch {
    return jsonError('La solicitud es invalida.');
  }

  const { tipo, fecha } = body;
  const diaCompleto = body.dia_completo === true;

  if (!esTipoPermiso(tipo)) {
    return jsonError('El tipo de permiso es invalido.');
  }

  if (!isValidDateString(fecha)) {
    return jsonError('La fecha es requerida y debe tener formato valido.');
  }

  let horaDesde: string | null = null;
  let horaHasta: string | null = null;

  if (!diaCompleto) {
    if (!isValidTimeString(body.hora_desde) || !isValidTimeString(body.hora_hasta)) {
      return jsonError('Indica el horario de salida y de regreso.');
    }

    if (body.hora_desde >= body.hora_hasta) {
      return jsonError('La hora de regreso tiene que ser posterior a la de salida.');
    }

    horaDesde = body.hora_desde;
    horaHasta = body.hora_hasta;
  }

  const comentario = typeof body.comentario === 'string' ? body.comentario.trim() : '';

  if (comentario.length > 500) {
    return jsonError('El comentario no puede superar los 500 caracteres.');
  }

  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    // Bloquea al usuario para que dos envíos simultáneos no se pisen
    await connection.query('SELECT id FROM usuarios WHERE id = ? FOR UPDATE', [userId]);

    const [superpuestos] = await connection.query<RowDataPacket[]>(
      `SELECT id
       FROM usuario_solicitud_permisos
       WHERE usuario_id = ?
         AND fecha = ?
         AND estado IN ('pendiente', 'aprobada')
         AND (dia_completo = 1 OR ? = 1 OR (hora_desde < ? AND hora_hasta > ?))
       LIMIT 1`,
      [userId, fecha, diaCompleto ? 1 : 0, horaHasta, horaDesde],
    );

    if (superpuestos[0]) {
      await connection.rollback();
      return jsonError('Ya tenes un permiso pendiente o aprobado que se superpone con ese horario.', 409);
    }

    await connection.query(
      `INSERT INTO usuario_solicitud_permisos
        (usuario_id, tipo, fecha, dia_completo, hora_desde, hora_hasta, comentario, estado)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'pendiente')`,
      [userId, tipo, fecha, diaCompleto ? 1 : 0, horaDesde, horaHasta, comentario || null],
    );

    await connection.commit();
    return NextResponse.json({ message: 'Solicitud creada correctamente.' }, { status: 201 });
  } catch (error) {
    await connection.rollback();
    console.error('[permisos/solicitudes] Error:', error);
    return jsonError('No se pudo crear la solicitud.', 500);
  } finally {
    connection.release();
  }
}
