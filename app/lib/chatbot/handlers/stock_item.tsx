import {db} from "@/app/lib/mysql";


export async function handleConsultaStockItem(
  entities: { item: string }
): Promise<string> {
  const { item } = entities

  const [rows]: any[] = await db.query(
    `SELECT a.modelo
     FROM articulos a
     JOIN items i ON a.item_id = i.id
     WHERE i.nombre LIKE ?
       AND (a.ubicacion IS NULL OR a.ubicacion NOT LIKE 'SIN STOCK')
     ORDER BY a.modelo`,
    [`%${item}%`]
  )

  if (!rows.length) {
    return `🛑 No hay stock disponible actualmente para "<b>${item}</b>".`
  }

  const html = rows
    .map(
      (row: any) =>
        `• <b>${row.modelo || 'Modelo sin nombre'}</b>${row.ubicacion ? ` – Ubicación: ${row.ubicacion}` : ''}`
    )
    .join('<br>')

  return `📦 <b>Modelos disponibles de "${item}":</b><br>${html}`
}

