// app/lib/cuenta-corriente.ts
// Solicitudes de alta de cuenta corriente: un vendedor la pide desde la ficha
// del cliente y el líder de ventas la acepta o rechaza desde el inicio.

import type { RowDataPacket } from 'mysql2';
import { db } from '@/app/lib/mysql';

export type EstadoCuentaCorriente = 'pendiente' | 'aceptada' | 'rechazada';

export interface SolicitudCuentaCorriente {
  id: number;
  cliente_id: number;
  cliente_nombre: string | null;
  estado: EstadoCuentaCorriente;
  fecha_solicitud: string;
  fecha_aceptacion: string | null;
  fecha_rechazo: string | null;
  solicitado_por: string | null;
  vendedor_nombre: string | null;
}

const SELECT_SOLICITUD = `
  SELECT
    s.id,
    s.cliente_id,
    c.razon_social AS cliente_nombre,
    s.estado,
    s.fecha_solicitud,
    s.fecha_aceptacion,
    s.fecha_rechazo,
    u.username AS solicitado_por,
    v.nombre AS vendedor_nombre
  FROM cliente_cuenta_corriente_solicitud s
  JOIN clientes c ON c.id = s.cliente_id
  LEFT JOIN usuarios u ON u.id = s.solicitado_por_usuario_id
  LEFT JOIN vendedores v ON v.id = s.solicitado_por_vendedor_id
`;

function serializar(row: RowDataPacket): SolicitudCuentaCorriente {
  const fecha = (valor: unknown) => (valor ? new Date(valor as string).toISOString() : null);

  return {
    id: row.id,
    cliente_id: row.cliente_id,
    cliente_nombre: row.cliente_nombre,
    estado: row.estado,
    fecha_solicitud: fecha(row.fecha_solicitud) as string,
    fecha_aceptacion: fecha(row.fecha_aceptacion),
    fecha_rechazo: fecha(row.fecha_rechazo),
    solicitado_por: row.solicitado_por,
    vendedor_nombre: row.vendedor_nombre,
  };
}

/** Última solicitud del cliente (la vigente), o null si nunca se pidió. */
export async function getCuentaCorrienteCliente(clienteId: string | number) {
  const [rows] = await db.query<RowDataPacket[]>(
    `${SELECT_SOLICITUD}
     WHERE s.cliente_id = ?
     ORDER BY s.fecha_solicitud DESC, s.id DESC
     LIMIT 1`,
    [clienteId],
  );

  return rows[0] ? serializar(rows[0]) : null;
}

export async function getSolicitudesCuentaCorrientePendientes() {
  const [rows] = await db.query<RowDataPacket[]>(
    `${SELECT_SOLICITUD}
     WHERE s.estado = 'pendiente'
     ORDER BY s.fecha_solicitud ASC`,
  );

  return rows.map(serializar);
}
