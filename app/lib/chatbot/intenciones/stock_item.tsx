export function detectarConsultaStockPorItem(mensaje: string) {
  const texto = mensaje.toLowerCase()

  const patrones = [
    /dame\s+(?:el|los)?\s*stock\s+(?:de|del)\s+(.+)/i,
    /qu[eé]\s+modelos\s+(?:hay|ten[eé]s)\s+de\s+(.+)/i,
    /ten[eé]s\s+stock\s+de\s+(.+)/i,
    /hay\s+disponibilidad\s+de\s+(.+)/i,
    /qu[eé]\s+hay\s+de\s+(.+)/i,
    /disponibles\s+de\s+(.+)/i,
  ]

  for (const p of patrones) {
    const match = texto.match(p)
    if (match) {
      const item = match[1]?.trim()
      return {
        intent: 'consultar_stock_item',
        entities: { item },
      }
    }
  }

  return { intent: 'desconocido', entities: {} }
}
