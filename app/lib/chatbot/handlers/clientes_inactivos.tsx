import {db} from "@/app/lib/mysql";

function getFechaLimiteDesdeDias(dias: number): string {
  const fecha = new Date()
  fecha.setDate(fecha.getDate() - dias)

  const yyyy = fecha.getFullYear()
  const mm = String(fecha.getMonth() + 1).padStart(2, '0')
  const dd = String(fecha.getDate()).padStart(2, '0')

  return `${yyyy}-${mm}-${dd}`
}

function formatearFecha(fecha: string): string {
  const d = new Date(fecha)
  const dd = String(d.getDate()).padStart(2, '0')
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const yyyy = d.getFullYear()
  return `${dd}/${mm}/${yyyy}`
}

export async function handleClientesInactivos(
  entities: { dias: number; limite: number },
  vendedorId: number
): Promise<string> {
  const { dias, limite } = entities
  const fechaLimite = getFechaLimiteDesdeDias(dias)

  const sql = `
    SELECT 
      c.id AS cliente_id,
      c.razon_social AS cliente_nombre,
      MAX(p.fecha_creacion) AS ultima_compra
    FROM clientes c
    INNER JOIN pedidos p ON c.id = p.cliente_id
    WHERE c.vendedor_id = ?
      AND p.fecha_creacion < ?
      AND c.id NOT IN (
        SELECT cliente_id
        FROM pedidos
        WHERE fecha_creacion >= ?
      )
    GROUP BY c.id
    ORDER BY ultima_compra DESC
    LIMIT ?
  `

  const [rows]: any[] = await db.query(sql, [vendedorId, fechaLimite, fechaLimite, limite])

  if (!rows.length) {
    return `No encontré clientes inactivos hace más de <b>${dias}</b> días.`
  }

  const html = rows
    .map(
      (row: any) =>
        `• <a href="/dashboard/invoices/${row.cliente_id}/edit?from=dashboard" target="_blank"><b>${row.cliente_nombre}</b></a> – Última compra: ${formatearFecha(row.ultima_compra)}`
    )
    .join('<br>')

  return `🕒 <b>Clientes inactivos hace más de ${dias} días:</b><br>${html}`
}