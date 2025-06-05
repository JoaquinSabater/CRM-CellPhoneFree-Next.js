import { detectarTopClientesPorItem } from './intenciones/top_clientes'
import { detectarClientesInactivos } from './intenciones/clientes_inactivos'
import { detectarConsultaStockPorItem } from './intenciones/stock_item'
import { detectarAyuda } from './intenciones/ayuda'
import { detectarTopClientesPorMonto } from './intenciones/top_clientes_por_monto'
import { detectarGraficoItemPorSemana } from './intenciones/grafico_item_semana'


export function analizarMensaje(mensaje: string): {
  intent: string;
  entities: Record<string, any>;
} {
  // Aca comente detectarConsultaStockPorItem porque todavia no lo resolvi con cacha
  const detectores = [
    detectarGraficoItemPorSemana,
    detectarTopClientesPorItem,
    detectarClientesInactivos,
    detectarConsultaStockPorItem,
    detectarTopClientesPorMonto,
    detectarAyuda,
  ]
  for (const detectar of detectores) {
    const result = detectar(mensaje)
    if (result.intent !== 'desconocido') return result
  }

  return { intent: 'desconocido', entities: {} }
}