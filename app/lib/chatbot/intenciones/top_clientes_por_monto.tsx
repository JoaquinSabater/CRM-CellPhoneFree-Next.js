export function detectarTopClientesPorMonto(mensaje: string) {
  const texto = mensaje.toLowerCase()

  const patrones = [
    /top\s+(\d+)\s+clientes\b/,
    /dame\s+los\s+(\d+)\s+clientes\s+que\s+m[aá]s\s+gastaron/,
    /clientes\s+que\s+m[aá]s\s+gastaron/,
    /top\s+clientes\s+por\s+gasto/,
    /top\s+clientes\s+por\s+total/,
  ]

  for (const p of patrones) {
    const match = texto.match(p)
    if (match) {
      const limite = match[1] ? parseInt(match[1]) : 10
      return {
        intent: 'top_clientes_por_monto',
        entities: { limite },
      }
    }
  }

  return { intent: 'desconocido', entities: {} }
}