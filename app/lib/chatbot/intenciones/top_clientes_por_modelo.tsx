export function detectarTopClientesPorModelo(mensaje: string) {
  const texto = mensaje.toLowerCase().trim()

  const patrones = [
    /top\s+(\d+)?\s*clientes\s+que\s+m[aá]s\s+compran\s+(fundas|vidrios?|protector(?:es)?)\s+(?:de\s+)?(.+)/i,
    /qu[ié]n(?:es)?\s+compr[oó]?\s+m[aá]s\s+(fundas|vidrios?|protector(?:es)?)\s+(?:de\s+)?(.+)/i,
    /clientes\s+que\s+m[aá]s\s+compraron\s+(fundas|vidrios?|protector(?:es)?)\s+(?:de\s+)?(.+)/i,
  ]

  for (const p of patrones) {
    const match = texto.match(p)
    if (match) {
      const limite = match[1] ? parseInt(match[1]) : 10
      const tipo = match[2]
      const modelo = match[3]
      return {
        intent: 'top_clientes_por_modelo',
        entities: { modelo: modelo.trim(), tipo: tipo.trim(), limite },
      }
    }
  }

  return { intent: 'desconocido', entities: {} }
}
