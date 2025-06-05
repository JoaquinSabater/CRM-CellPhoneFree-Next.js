import {db} from "@/app/lib/mysql";


export async function handleGraficoItemPorSemana(
  entities: { item: string },
  vendedorId: number
): Promise<string> {
  const { item } = entities

  const [raw] = await db.query(
    `SELECT
        WEEK(r.fecha_generacion) AS semana,
        SUM(rd.cantidad) AS total_vendido
     FROM remitos r
     JOIN remitos_detalle rd ON r.id = rd.remito_id
     JOIN articulos a ON rd.articulo_codigo = a.codigo_interno
     JOIN items i ON a.item_id = i.id
     JOIN clientes c ON r.cliente_id = c.id
     WHERE i.nombre LIKE ?
       AND c.vendedor_id = ?
       AND r.fecha_generacion >= DATE_SUB(CURDATE(), INTERVAL 4 WEEK)
     GROUP BY semana
     ORDER BY semana`,
    [`%${item}%`, vendedorId]
  )

  const rows = raw as { semana: number; total_vendido: number }[]

  if (!rows.length) {
    return `📉 No se registraron ventas de "<b>${item}</b>" en las últimas 4 semanas.`
  }

  // Devolvemos una marca para que el frontend sepa que debe mostrar un gráfico
  return JSON.stringify({
    type: 'grafico_item_semana',
    title: `Unidades vendidas de "${item}"`,
    labels: rows.map(r => `Semana ${r.semana}`),
    data: rows.map(r => r.total_vendido),
  })
}