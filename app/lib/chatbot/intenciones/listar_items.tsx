export function detectarListarItems(mensaje: string) {
  const texto = mensaje.toLowerCase().trim()

  const patrones = [
    /ver\s+(los\s+)?items/,
    /lista\s+de\s+items/,
    /ver\s+(los\s+)?productos/,
    /mostrame\s+los\s+items/,
    /qué\s+productos\s+tengo/,
    /items/,
  ]

  for (const p of patrones) {
    if (texto.match(p)) {
      return {
        intent: 'listar_items',
        entities: {},
      }
    }
  }

  return { intent: 'desconocido', entities: {} }
}
