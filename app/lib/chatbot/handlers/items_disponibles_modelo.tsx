import { db } from "@/app/lib/mysql";

export async function handleItemsDisponiblesPorModelo(
  entities: { modelo: string }
): Promise<string> {
  const { modelo } = entities;
  const texto = (modelo ?? "").trim();

  // DEBUG: Primero veamos qué datos hay
  const [debug]: any[] = await db.query(
    `SELECT 
       m.nombre AS marca,
       a.modelo,
       CONCAT(m.nombre, ' ', a.modelo) AS modelo_completo,
       i.nombre AS item,
       calcular_stock_fisico(a.codigo_interno) - calcular_stock_comprometido(a.codigo_interno) AS stock_real
     FROM articulos a
     JOIN items i ON a.item_id = i.id
     JOIN marcas m ON a.marca_id = m.id
     LIMIT 10`
  );

  const [rows]: any[] = await db.query(
    `SELECT 
       i.nombre AS item,
       CONCAT(m.nombre, ' ', a.modelo) AS modelo_completo,
       calcular_stock_fisico(a.codigo_interno) - calcular_stock_comprometido(a.codigo_interno) AS stock_real
     FROM articulos a
     JOIN items i ON a.item_id = i.id
     JOIN marcas m ON a.marca_id = m.id
     WHERE INSTR(LOWER(?), LOWER(m.nombre)) > 0
       AND INSTR(LOWER(?), LOWER(a.modelo)) > 0
     ORDER BY i.nombre`,
    [texto, texto]
  );

  // Filtrar solo los que tienen stock > 0
  const itemsConStock = rows.filter((row: any) => row.stock_real > 0);

  if (itemsConStock.length === 0) {
    return `😕 No hay stock disponible para "<b>${texto}</b>".<br><br>
            Si fue un error de tipeo o formato, ingresá <b>marca + modelo</b> y probá de nuevo. Ejemplos:<br>
            • iPhone 15<br>
            • Samsung A15<br>
            • Motorola G54<br>
            • Xiaomi Redmi Note 13<br>`;
  }

  interface ItemDisponible {
    item: string;
    modelo_completo: string;
    stock_real: number;
  }

  const html = (itemsConStock as ItemDisponible[])
    .map((row: ItemDisponible) => `• <b>${row.item}</b> - ${row.modelo_completo}: ${row.stock_real} unidades`)
    .join('<br>');

  return `✅ <b>Ítems disponibles para el modelo "${texto}":</b><br>${html}`;
}
