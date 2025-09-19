import { getTopItemsVendidos } from "@/app/lib/data";

export async function handleTopItemsVendidos(
  entities: { topN: number; ultimosDias: number }
): Promise<string> {
  const { topN, ultimosDias } = entities;

  console.log(`🔍 Buscando top ${topN} productos en ${ultimosDias} días de toda la empresa`);

  try {
    const items = await getTopItemsVendidos(topN, ultimosDias);

    if (items.length === 0) {
      return `📊 No se encontraron ventas en los últimos <b>${ultimosDias} días</b> en toda la empresa.`;
    }

    // Formatear números
    const formatearNumero = (num: number) => {
      return new Intl.NumberFormat('es-AR').format(num);
    };

    // Generar el HTML de respuesta SIMPLIFICADO
    const itemsHTML = items.map((item, index) => {
      const posicion = index + 1;
      const emoji = posicion === 1 ? '🥇' : posicion === 2 ? '🥈' : posicion === 3 ? '🥉' : '📦';
      
      return `${emoji} <b>${posicion}. ${item.item_nombre}</b><br>
              &nbsp;&nbsp;&nbsp;├ Vendidos: <b>${formatearNumero(item.total_vendido)} unidades</b><br>
              &nbsp;&nbsp;&nbsp;└ Clientes: ${item.clientes_distintos}`;
    }).join('<br><br>');

    const totalVendido = items.reduce((sum, item) => sum + item.total_vendido, 0);

    return `📊 <b>Top ${topN} productos más vendidos de la empresa (últimos ${ultimosDias} días)</b><br><br>
            ${itemsHTML}<br><br>`;

  } catch (error) {
    console.error('Error al obtener top productos vendidos:', error);
    return `❌ Error al obtener el ranking de productos vendidos. Intenta de nuevo.`;
  }
}