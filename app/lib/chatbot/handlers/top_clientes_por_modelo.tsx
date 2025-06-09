import { db } from "@/app/lib/mysql";

export async function handleTopClientesPorModelo(
  entities: { modelo: string; tipo?: string; limite: number },
  vendedorId: number
): Promise<string> {
  const { modelo, tipo, limite } = entities

  let filtroTipo = '%'
  if (tipo === 'fundas') filtroTipo = 'Protector Diseño%'
  if (tipo === 'vidrio') filtroTipo = 'Vidrio%'

  const [rows]: any = await db.query(
    `SELECT 
      c.id AS cliente_id,
      c.razon_social AS cliente_nombre,
      SUM(rd.cantidad) AS total
    FROM remitos r
    JOIN remitos_detalle rd ON r.id = rd.remito_id
    JOIN articulos a ON rd.articulo_codigo = a.codigo_interno
    JOIN items i ON a.item_id = i.id
    JOIN clientes c ON r.cliente_id = c.id
    WHERE a.modelo LIKE ?
      AND i.nombre LIKE ?
      AND c.vendedor_id = ?
    GROUP BY c.id
    ORDER BY total DESC
    LIMIT ?`,
    [`%${modelo}%`, filtroTipo, vendedorId, limite]
  )

  if (!rows.length) {
    return `❌ No se encontraron ventas para ${tipo ?? 'el modelo'} "<b>${modelo}</b>".`
  }

  const html = rows
    .map(
      (row: any) =>
        `• <a href="/dashboard/invoices/${row.cliente_id}/edit?from=dashboard" target="_blank"><b>${row.cliente_nombre}</b></a> – ${row.total} unidades`
    )
    .join('<br>')

  return `📦 <b>Top clientes que compraron ${tipo ?? 'modelo'} "${modelo}":</b><br>${html}`
}
