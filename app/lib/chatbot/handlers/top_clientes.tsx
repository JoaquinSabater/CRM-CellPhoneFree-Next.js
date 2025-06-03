import {db} from "@/app/lib/mysql";

export async function handleTopClientesPorItem(
  entities: { item: string; limite: number },
  vendedorId: number
): Promise<string> {
  const { item, limite } = entities

  const sql = `
    SELECT c.id AS cliente_id, c.razon_social AS cliente_nombre, SUM(rd.cantidad) AS total
    FROM remitos r
    JOIN remitos_detalle rd ON r.id = rd.remito_id
    JOIN articulos a ON rd.articulo_codigo = a.codigo_interno
    JOIN items i ON a.item_id = i.id
    JOIN clientes c ON r.cliente_id = c.id
    WHERE i.nombre LIKE ? AND c.vendedor_id = ?
    GROUP BY c.id
    ORDER BY total DESC
    LIMIT ?
  `

  const [rows]: any[] = await db.query(sql, [`%${item}%`, vendedorId, limite])

  if (!rows.length) {
    return `No encontré clientes que hayan comprado "<b>${item}</b>".`
  }

    const html = rows
    .map(
        (row: any) =>
        `• <a href="/dashboard/invoices/${row.cliente_id}/edit?from=dashboard" target="_blank"><b>${row.cliente_nombre}</b></a> – ${row.total} unidades`
    )
    .join('<br>')

  return `✅ <b>Top clientes para "${item}":</b><br>${html}`
}

