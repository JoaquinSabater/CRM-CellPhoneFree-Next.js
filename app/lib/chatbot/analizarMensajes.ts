import { detectarTopClientesPorItem } from './intenciones/top_clientes'
import { detectarClientesInactivos } from './intenciones/clientes_inactivos'
import { detectarConsultaStockPorItem } from './intenciones/stock_item'
import { detectarAyuda } from './intenciones/ayuda'
import { detectarTopClientesPorMonto } from './intenciones/top_clientes_por_monto'
import { detectarGraficoItemPorSemana } from './intenciones/grafico_item_semana'
import { detectarAccesoEstadisticasAvanzadas } from './intenciones/acceso_estadisticas'
import { detectarListarItems } from './intenciones/listar_items'
import { detectarTopClientesPorModelo } from './intenciones/top_clientes_por_modelo'
import { detectarTopClientesPorItemDias } from '@/app/lib/chatbot/intenciones/top_clientes_item_dias'
import { detectarProvinciaTopClientes } from './intenciones/provincia_top_clientes';
import { detectarItemsDisponiblesPorModelo } from './intenciones/items_disponibles_modelo';
import { detectarTopItemsVendidos } from './intenciones/top_items_vendidos'



export function analizarMensaje(mensaje: string): {
  intent: string;
  entities: Record<string, any>;
} {
  const detectores = [
    detectarTopItemsVendidos,
    detectarTopClientesPorItemDias,
    detectarItemsDisponiblesPorModelo,
    detectarTopClientesPorItem,
    detectarGraficoItemPorSemana,
    detectarClientesInactivos,
    detectarProvinciaTopClientes,
    detectarConsultaStockPorItem,
    detectarTopClientesPorModelo,
    detectarTopClientesPorMonto,
    detectarAyuda,
    detectarAccesoEstadisticasAvanzadas,
    detectarListarItems,
  ]
  for (const detectar of detectores) {
    const result = detectar(mensaje)
    if (result.intent !== 'desconocido') return result
  }

  return { intent: 'desconocido', entities: {} }
}