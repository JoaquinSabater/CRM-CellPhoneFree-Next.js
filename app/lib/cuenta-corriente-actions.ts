'use server';

import { revalidatePath } from 'next/cache';
import type { RowDataPacket } from 'mysql2';
import { auth } from '@/app/lib/auth';
import { db } from '@/app/lib/mysql';
import { esLiderVentas, puedeVerComercial } from '@/app/lib/roles';

type Resultado = { ok: true; mensaje: string } | { ok: false; error: string };

// El super usuario no existe en la tabla usuarios: se registra como NULL
function usuarioIdDeSesion(id?: string | null) {
  const numero = Number(id);
  return Number.isInteger(numero) && numero > 0 ? numero : null;
}

export async function solicitarCuentaCorriente(clienteId: number): Promise<Resultado> {
  const session = await auth();

  if (!session?.user) return { ok: false, error: 'No autenticado.' };
  if (!puedeVerComercial(session.user.rol)) return { ok: false, error: 'No tenés permiso para pedir cuentas corrientes.' };
  if (!Number.isInteger(clienteId) || clienteId <= 0) return { ok: false, error: 'Cliente inválido.' };

  const usuarioId = usuarioIdDeSesion(session.user.id);
  const vendedorId = session.user.vendedor_id || null;
  // Si la pide el propio líder de ventas no hace falta que se la apruebe a sí mismo
  const autoAceptar = esLiderVentas(session.user.id, session.user.rol);

  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    // Bloquea al cliente para que dos pedidos simultáneos no generen duplicados
    const [clienteRows] = await connection.query<RowDataPacket[]>(
      'SELECT id FROM clientes WHERE id = ? FOR UPDATE',
      [clienteId],
    );

    if (!clienteRows[0]) {
      await connection.rollback();
      return { ok: false, error: 'Cliente no encontrado.' };
    }

    const [vigentes] = await connection.query<RowDataPacket[]>(
      `SELECT estado
       FROM cliente_cuenta_corriente_solicitud
       WHERE cliente_id = ? AND estado IN ('pendiente', 'aceptada')
       LIMIT 1`,
      [clienteId],
    );

    if (vigentes[0]) {
      await connection.rollback();
      return {
        ok: false,
        error: vigentes[0].estado === 'aceptada'
          ? 'El cliente ya tiene cuenta corriente.'
          : 'Ya hay una solicitud pendiente para este cliente.',
      };
    }

    await connection.query(
      `INSERT INTO cliente_cuenta_corriente_solicitud
        (cliente_id, solicitado_por_usuario_id, solicitado_por_vendedor_id, estado, fecha_aceptacion, resuelto_por_usuario_id)
       VALUES (?, ?, ?, ?, ?, ?)`,
      autoAceptar
        ? [clienteId, usuarioId, vendedorId, 'aceptada', new Date(), usuarioId]
        : [clienteId, usuarioId, vendedorId, 'pendiente', null, null],
    );

    await connection.commit();
  } catch (error) {
    await connection.rollback();
    console.error('[cuenta-corriente/solicitar] Error:', error);
    return { ok: false, error: 'No se pudo registrar la solicitud.' };
  } finally {
    connection.release();
  }

  revalidatePath(`/dashboard/invoices/${clienteId}/edit`);
  revalidatePath('/dashboard');

  return {
    ok: true,
    mensaje: autoAceptar
      ? 'Cuenta corriente dada de alta.'
      : 'Solicitud enviada. Queda pendiente de aprobación del líder de ventas.',
  };
}

async function resolverSolicitud(solicitudId: number, estado: 'aceptada' | 'rechazada'): Promise<Resultado> {
  const session = await auth();

  if (!session?.user) return { ok: false, error: 'No autenticado.' };
  if (!esLiderVentas(session.user.id, session.user.rol)) {
    return { ok: false, error: 'Solo el líder de ventas puede resolver estas solicitudes.' };
  }
  if (!Number.isInteger(solicitudId) || solicitudId <= 0) return { ok: false, error: 'Solicitud inválida.' };

  const columnaFecha = estado === 'aceptada' ? 'fecha_aceptacion' : 'fecha_rechazo';

  const [result]: any = await db.query(
    `UPDATE cliente_cuenta_corriente_solicitud
     SET estado = ?, ${columnaFecha} = NOW(), resuelto_por_usuario_id = ?
     WHERE id = ? AND estado = 'pendiente'`,
    [estado, usuarioIdDeSesion(session.user.id), solicitudId],
  );

  if (result.affectedRows === 0) {
    return { ok: false, error: 'La solicitud ya no está pendiente.' };
  }

  revalidatePath('/dashboard');
  revalidatePath('/dashboard/invoices', 'layout');

  return { ok: true, mensaje: estado === 'aceptada' ? 'Cuenta corriente aceptada.' : 'Solicitud rechazada.' };
}

export async function aceptarCuentaCorriente(solicitudId: number) {
  return resolverSolicitud(solicitudId, 'aceptada');
}

export async function rechazarCuentaCorriente(solicitudId: number) {
  return resolverSolicitud(solicitudId, 'rechazada');
}
