import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/lib/auth';
import { db } from '@/app/lib/mysql';
import { puedeAdministrar } from '@/app/lib/roles';
import { jsonError } from '@/app/lib/vacaciones';

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  // El super usuario no existe en la tabla usuarios: se registra como NULL
  const adminId = Number.isInteger(Number(session?.user?.id)) ? Number(session?.user?.id) : null;

  if (!session?.user?.id) {
    return jsonError('No autenticado', 401);
  }

  if (!puedeAdministrar(session.user.rol)) {
    return jsonError('No autorizado', 403);
  }

  const { id } = await context.params;
  const solicitudId = Number(id);

  if (!Number.isInteger(solicitudId) || solicitudId <= 0) {
    return jsonError('Solicitud invalida.');
  }

  let body: { estado?: unknown; motivo_rechazo?: unknown } = {};

  try {
    body = await request.json();
  } catch {
    body = {};
  }

  if (body.estado !== 'aprobada' && body.estado !== 'rechazada') {
    return jsonError('Accion invalida.');
  }

  const motivoRechazo = body.estado === 'rechazada'
    && typeof body.motivo_rechazo === 'string'
    && body.motivo_rechazo.trim()
    ? body.motivo_rechazo.trim()
    : null;

  try {
    const [result]: any = await db.query(
      `UPDATE usuario_solicitud_permisos
       SET estado = ?,
           aprobado_por = ?,
           fecha_aprobacion = NOW(),
           motivo_rechazo = ?
       WHERE id = ? AND estado = 'pendiente'`,
      [body.estado, adminId, motivoRechazo, solicitudId],
    );

    if (result.affectedRows === 0) {
      return jsonError('La solicitud ya no esta pendiente.', 409);
    }

    return NextResponse.json({
      message: body.estado === 'aprobada' ? 'Permiso aprobado.' : 'Permiso rechazado.',
    });
  } catch (error) {
    console.error('[admin/permisos/solicitudes] Error:', error);
    return jsonError('No se pudo actualizar la solicitud.', 500);
  }
}
