export function detectarClientesInactivos(mensaje: string) {
  const texto = mensaje.toLowerCase()

  const patrones = [
    /clientes\s+inactivos\s+hace\s+(\d+)\s+d[ií]as?/,
    /clientes\s+sin\s+compras\s+en\s+los\s+últimos\s+(\d+)\s+d[ií]as?/,
    /top\s+(\d+)?\s*clientes\s+inactivos\s+(?:hace\s+)?(\d+)\s+d[ií]as?/,
    /quienes\s+no\s+compran\s+desde\s+hace\s+(\d+)\s+d[ií]as?/,
  ]

  for (const p of patrones) {
    const match = texto.match(p)
    if (match) {
      const limite = match[1] && /^\d+$/.test(match[1]) ? parseInt(match[1]) : 10
      const dias = parseInt(match[2] || match[1])
      return {
        intent: 'clientes_inactivos',
        entities: { dias, limite },
      }
    }
  }

  return { intent: 'desconocido', entities: {} }
}