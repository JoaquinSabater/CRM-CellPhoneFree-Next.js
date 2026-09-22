import {db} from "@/app/lib/mysql";

type ClienteConTotal = {
  cliente_id: number
  cliente_nombre: string
  total_gastado: number
}

export async function handleTopClientesPorMonto(
  entities: { limite: number },
  vendedorId: number | null
): Promise<string> {
  const { limite } = entities
  const filtrarPorVendedor = Boolean(vendedorId)

  const [raw] = await db.query(
    `SELECT c.id AS cliente_id, c.razon_social AS cliente_nombre, SUM(r.total) AS total_gastado
     FROM remitos r
     JOIN clientes c ON r.cliente_id = c.id
     ${filtrarPorVendedor ? 'WHERE c.vendedor_id = ?' : ''}
     GROUP BY c.id
     ORDER BY total_gastado DESC
     LIMIT ?`,
    filtrarPorVendedor ? [vendedorId, limite] : [limite]
  )

  const rows = raw as ClienteConTotal[]

  if (!rows.length) {
    return `🛑 No encontré clientes con remitos registrados para este vendedor.`
  }

   const html = rows
  .map((row) => {
    const monto = new Intl.NumberFormat('es-AR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(Number(row.total_gastado))

    return `• <a href="/dashboard/invoices/${row.cliente_id}/edit?from=dashboard" target="_blank"><b>${row.cliente_nombre}</b></a> – $${monto} USD`
  })
  .join('<br>')

  return `💰 <b>Top ${limite} clientes por monto gastado:</b><br>${html}`
}
