export function detectarGraficoItemPorSemana(mensaje: string) {
  const texto = mensaje.toLowerCase()

  const patrones = [
    /grafico\s+de\s+(.+)/i,
    /ver\s+ventas\s+de\s+(.+)/i,
    /mostrar\s+como\s+se\s+vend[ií]o\s+(.+)/i,
    /ventas\s+por\s+semana\s+de\s+(.+)/i,
    /como\s+vend[ií]o\s+(.+)\s+estas\s+semanas?/i,
  ]

  for (const p of patrones) {
    const match = texto.match(p)
    if (match && match[1]) {
      return {
        intent: 'grafico_item_por_semana',
        entities: { item: match[1].trim() },
      }
    }
  }

  return { intent: 'desconocido', entities: {} }
}
