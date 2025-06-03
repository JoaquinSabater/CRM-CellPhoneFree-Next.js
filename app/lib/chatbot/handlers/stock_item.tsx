import {db} from "@/app/lib/mysql";


export async function handleConsultaStockItem(
  entities: { item: string }
): Promise<string> {
  const { item } = entities

  const [raw] = await db.query(
    `SELECT 
       a.modelo,
       calcular_stock_fisico(a.codigo_interno) - calcular_stock_comprometido(a.codigo_interno) AS stock_real
     FROM articulos a
     JOIN items i ON a.item_id = i.id
     WHERE i.nombre LIKE ?
     ORDER BY a.modelo`,
    [`%${item}%`]
  )

  const rows = raw as { modelo: string; stock_real: number }[]

  const disponibles = rows.filter(r => r.stock_real > 0)

  if (!disponibles.length) {
    return `🛑 No hay stock disponible para "<b>${item}</b>".`
  }

  const html = disponibles
    .map(
      (row) =>
        `• <b>${row.modelo || 'Modelo sin nombre'}</b> – ${row.stock_real} unidades`
    )
    .join('<br>')

  return `📦 <b>Stock disponible de "${item}":</b><br>${html}`
}

