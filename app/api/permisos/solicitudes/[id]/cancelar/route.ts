import { NextResponse } from 'next/server';
import { auth } from '@/app/lib/auth';
import { db } from '@/app/lib/mysql';
import { jsonError } from '@/app/lib/vacaciones';

export async function PATCH(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  const userId = Number(session?.user?.id);

  if (!userId) {
    return jsonError('No autenticado', 401);
  }

  const { id } = await context.params;
  const solicitudId = Number(id);

  if (!Number.isInteger(solicitudId) || solicitudId <= 0) {
    return jsonError('Solicitud invalida.');
  }

  try {
    // Solo el dueño puede cancelar, y solo mientras siga pendiente
    const [result]: any = await db.query(
      `UPDATE usuario_solicitud_permisos
       SET estado = 'cancelada'
       WHERE id = ? AND usuario_id = ? AND estado = 'pendiente'`,
      [solicitudId, userId],
    );

    if (result.affectedRows === 0) {
      return jsonError('La solicitud ya no esta pendiente.', 409);
    }

    return NextResponse.json({ message: 'Solicitud cancelada.' });
  } catch (error) {
    console.error('[permisos/cancelar] Error:', error);
    return jsonError('No se pudo cancelar la solicitud.', 500);
  }
}
