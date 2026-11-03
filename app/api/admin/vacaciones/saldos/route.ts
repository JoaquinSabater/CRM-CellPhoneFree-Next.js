import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/lib/auth';
import { db } from '@/app/lib/mysql';
import { puedeAdministrar } from '@/app/lib/roles';
import {
  SALDO_DEL_ANIO_SQL,
  isNonNegativeInteger,
  jsonError,
  type VacationBalance,
  type VacationBalanceAdminRow,
} from '@/app/lib/vacaciones';

function parseAnio(value: unknown) {
  const anio = Number(value);
  return Number.isInteger(anio) && anio >= 2000 && anio <= 2100 ? anio : null;
}

export async function GET(request: NextRequest) {
  const session = await auth();

  if (!session?.user?.id) {
    return jsonError('No autenticado', 401);
  }

  if (!puedeAdministrar(session.user.rol)) {
    return jsonError('No autorizado', 403);
  }

  const anio = parseAnio(request.nextUrl.searchParams.get('anio') ?? new Date().getFullYear());

  if (!anio) {
    return jsonError('Anio invalido.');
  }

  try {
    const [rows] = await db.query<VacationBalanceAdminRow[]>(
      `SELECT u.id AS usuario_id, u.username, u.rol,
              s.id AS saldo_id, s.dias_totales, s.dias_usados, s.dias_pendientes, s.dias_restantes
       FROM usuarios u
       LEFT JOIN usuario_vacaciones_saldo s
         ON s.id = (
           SELECT MIN(s2.id)
           FROM usuario_vacaciones_saldo s2
           WHERE s2.usuario_id = u.id AND s2.anio = ?
         )
       -- Sin saldo este año ni el anterior es gente que ya no trabaja: no se muestra.
       -- Mirar el año anterior permite crear los saldos del año nuevo.
       WHERE EXISTS (
         SELECT 1
         FROM usuario_vacaciones_saldo s3
         WHERE s3.usuario_id = u.id AND s3.anio IN (?, ?)
       )
       ORDER BY u.username`,
      [anio, anio, anio - 1],
    );

    return NextResponse.json({
      anio,
      usuarios: rows.map((row) => ({
        usuario_id: row.usuario_id,
        username: row.username,
        rol: row.rol ?? '',
        tiene_saldo: row.saldo_id !== null,
        dias_totales: row.dias_totales ?? 0,
        dias_usados: row.dias_usados ?? 0,
        dias_pendientes: row.dias_pendientes ?? 0,
        dias_restantes: row.dias_restantes ?? 0,
      })),
    });
  } catch (error) {
    console.error('[admin/vacaciones/saldos] Error:', error);
    return jsonError('No se pudieron obtener los saldos.', 500);
  }
}

export async function PUT(request: NextRequest) {
  const session = await auth();

  if (!session?.user?.id) {
    return jsonError('No autenticado', 401);
  }

  let body: { usuario_id?: unknown; anio?: unknown; dias_totales?: unknown; dias_usados?: unknown };

  try {
    body = await request.json();
  } catch {
    return jsonError('La solicitud es invalida.');
  }

  const usuarioId = Number(body.usuario_id);
  const anio = parseAnio(body.anio);
  const { dias_totales: diasTotales, dias_usados: diasUsados } = body;

  if (!Number.isInteger(usuarioId) || usuarioId <= 0 || !anio) {
    return jsonError('Usuario o anio invalido.');
  }

  if (!isNonNegativeInteger(diasTotales) || !isNonNegativeInteger(diasUsados)) {
    return jsonError('Los dias deben ser numeros enteros mayores o iguales a 0.');
  }

  if (!puedeAdministrar(session.user.rol)) {
    return jsonError('No autorizado', 403);
  }

  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    const [userRows]: any = await connection.query('SELECT id FROM usuarios WHERE id = ? LIMIT 1', [usuarioId]);

    if (userRows.length === 0) {
      await connection.rollback();
      return jsonError('Usuario no encontrado.', 404);
    }

    const [saldoRows] = await connection.query<VacationBalance[]>(
      `${SALDO_DEL_ANIO_SQL} FOR UPDATE`,
      [usuarioId, anio],
    );

    const saldo = saldoRows[0];
    // Los pendientes los maneja el circuito de solicitudes: se respetan tal cual
    const diasPendientes = saldo?.dias_pendientes ?? 0;
    const diasRestantes = diasTotales - diasUsados - diasPendientes;

    if (diasRestantes < 0) {
      await connection.rollback();
      return jsonError(
        `Los dias usados (${diasUsados}) y pendientes (${diasPendientes}) superan los totales (${diasTotales}).`,
      );
    }

    if (saldo) {
      await connection.query(
        `UPDATE usuario_vacaciones_saldo
         SET dias_totales = ?, dias_usados = ?, dias_restantes = ?
         WHERE id = ?`,
        [diasTotales, diasUsados, diasRestantes, saldo.id],
      );
    } else {
      await connection.query(
        `INSERT INTO usuario_vacaciones_saldo
          (usuario_id, anio, dias_totales, dias_usados, dias_pendientes, dias_restantes)
         VALUES (?, ?, ?, ?, 0, ?)`,
        [usuarioId, anio, diasTotales, diasUsados, diasRestantes],
      );
    }

    await connection.commit();
    return NextResponse.json({ message: 'Saldo actualizado correctamente.' });
  } catch (error) {
    await connection.rollback();
    console.error('[admin/vacaciones/saldos] Error:', error);
    return jsonError('No se pudo actualizar el saldo.', 500);
  } finally {
    connection.release();
  }
}
