import { detectarTopClientesPorItem } from './intenciones/top_clientes'
import { detectarClientesInactivos } from './intenciones/clientes_inactivos'
import { detectarConsultaStockPorItem } from './intenciones/stock_item'
import { detectarAyuda } from './intenciones/ayuda'
import { detectarTopClientesPorMonto } from './intenciones/top_clientes_por_monto'


export function analizarMensaje(mensaje: string): {
  intent: string;
  entities: Record<string, any>;
} {
  // Aca comente detectarConsultaStockPorItem porque todavia no lo resolvi con cacha
  const detectores = [detectarTopClientesPorItem,detectarClientesInactivos,detectarAyuda,detectarTopClientesPorMonto]

  for (const detectar of detectores) {
    const result = detectar(mensaje)
    if (result.intent !== 'desconocido') return result
  }

  return { intent: 'desconocido', entities: {} }
}