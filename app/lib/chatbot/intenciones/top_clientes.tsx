export function detectarTopClientesPorItem(mensaje: string) {
  const texto = mensaje.toLowerCase()

  const patrones = [
    /top\s+(\d+)\s+clientes\s+que\s+compraron\s+(.+)/i,
    /top\s+clientes\s+que\s+compraron\s+(.+)/i,
    /top\s+(\d+)\s+de\s+clientes\s+que\s+compraron\s+(.+)/i,
    /top\s+(\d+)\s+de\s+clientes\s+que\s+m[aá]s\s+compraron\s+(.+)/i,
    /top\s+clientes\s+que\s+m[aá]s\s+compraron\s+(.+)/i,
    /top\s+compradores\s+de\s+(.+)/i,
    /qu[ié]n(?:es)?\s+compr[aó]n\s+m[aá]s\s+(.+)/i,
    /clientes\s+que\s+m[aá]s\s+compraron\s+(.+)/i,
    /mayor\s+compra\s+de\s+(.+)/i,
    /qu[ié]n\s+compr[oó]\s+m[aá]s\s+de\s+(.+)/i,
    /cu[aá]les\s+son\s+los\s+clientes\s+que\s+compr[aó]n\s+m[aá]s\s+(.+)/i,
    /top\s+clientes\s+de\s+(.+)/i,
    /top\s+(\d+)\s+clientes\s+de\s+(.+)/i,
    /top\s+(\d+)\s+clientes\s+por\s+ventas\s+de\s+(.+)/i,
    /top\s+(\d+)\s+clientes\s+que\s+m[aá]s\s+compraron\s+(.+)/i,
    /dame\s+los\s+(\d+)\s+clientes\s+que\s+m[aá]s\s+compraron\s+(.+)/i,
    /dame\s+los\s+(\d+)\s+clientes\s+que\s+m[aá]s\s+compran\s+(.+)/i,
    /top\s+(\d+)\s+clientes\s+que\s+compran\s+(.+)/i,
  ]

  for (const p of patrones) {
    const match = texto.match(p)
    if (match) {
      // detectar número y texto sin depender del orden de captura
      const posiblesNumeros = match.filter((v, i) => i > 0 && /^\d+$/.test(v))
      const posiblesItems = match.filter((v, i) => i > 0 && !/^\d+$/.test(v))

      const limite = posiblesNumeros.length ? parseInt(posiblesNumeros[0]) : 10
      const item = posiblesItems.length ? posiblesItems[0].trim() : null

      if (item) {
        return {
          intent: 'top_clientes_por_item',
          entities: { item, limite },
        }
      }
    }
  }

  return { intent: 'desconocido', entities: {} }
}