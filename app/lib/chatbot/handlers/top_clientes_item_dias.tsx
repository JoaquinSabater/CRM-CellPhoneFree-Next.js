// handler_top_clientes_item_dias.ts

import { db } from "@/app/lib/mysql";

export async function handleTopClientesPorItemDias(
  entities: { item: string; limite: number; dias: number },
  vendedorId: number
): Promise<string> {
  const { item, limite, dias } = entities;

  let params: any[] = [`%${item}%`, vendedorId, dias, limite];

  const sql = `
    SELECT c.id AS cliente_id, c.razon_social AS cliente_nombre, SUM(rd.cantidad) AS total
    FROM remitos r
    JOIN remitos_detalle rd ON r.id = rd.remito_id
    JOIN articulos a ON rd.articulo_codigo = a.codigo_interno
    JOIN items i ON a.item_id = i.id
    JOIN clientes c ON r.cliente_id = c.id
    WHERE i.nombre LIKE ? AND c.vendedor_id = ?
      AND DATE(r.fecha_generacion) >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
    GROUP BY c.id
    ORDER BY total DESC
    LIMIT ?
  `;

  // DEBUG
  console.log("[TOP CLIENTES HANDLER DIAS] Recibe:", { item, limite, dias, vendedorId });
  console.log("[TOP CLIENTES HANDLER DIAS] SQL FINAL:", sql, params);

  const [rows]: any[] = await db.query(sql, params);

  if (!rows.length) {
    return `No encontré clientes que hayan comprado "<b>${item}</b>" en los últimos ${dias} días.`;
  }

  const html = rows
    .map(
      (row: any) =>
        `• <a href="/dashboard/invoices/${row.cliente_id}/edit?from=dashboard" target="_blank"><b>${row.cliente_nombre}</b></a> – ${row.total} unidades`
    )
    .join("<br>");

  return `✅ <b>Top clientes para "${item}" en los últimos ${dias} días:</b><br>${html}`;
}
