export function detectarAccesoEstadisticasAvanzadas(mensaje: string) {
  const texto = mensaje.toLowerCase().trim()

  const patrones = [
    /ver\s+estad[íi]sticas/,
    /mostrar\s+estad[íi]sticas/,
    /quiero\s+mis\s+estad[íi]sticas/,
  ]

  for (const p of patrones) {
    if (texto.match(p)) {
      return {
        intent: 'acceso_estadisticas_avanzadas',
        entities: {},
      }
    }
  }

  return { intent: 'desconocido', entities: {} }
}
