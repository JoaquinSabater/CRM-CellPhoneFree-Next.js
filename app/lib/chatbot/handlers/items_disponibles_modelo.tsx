import { db } from "@/app/lib/mysql";

export async function handleItemsDisponiblesPorModelo(
  entities: { modelo: string }
): Promise<string> {
  const { modelo } = entities;

  // Busca items con stock real > 0 para el modelo indicado
  const [rows]: any[] = await db.query(
    `SELECT 
       i.nombre AS item,
       a.modelo,
       calcular_stock_fisico(a.codigo_interno) - calcular_stock_comprometido(a.codigo_interno) AS stock_real
     FROM articulos a
     JOIN items i ON a.item_id = i.id
     WHERE a.modelo LIKE ?
     HAVING stock_real > 0
     ORDER BY i.nombre`,
    [`%${modelo}%`]
  );

  if (!rows || rows.length === 0) {
    return `No hay ítems disponibles con stock para el modelo <b>${modelo}</b>.`;
  }

interface ItemDisponible {
    item: string;
    modelo: string;
    stock_real: number;
}

const html = (rows as ItemDisponible[])
    .map((row: ItemDisponible) => `• <b>${row.item}</b>: ${row.stock_real} unidades`)
    .join('<br>');

  return `✅ <b>Ítems disponibles para el modelo "${modelo}":</b><br>${html}`;
}
