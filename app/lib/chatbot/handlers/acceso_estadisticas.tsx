export async function handleAccesoEstadisticasAvanzadas(
  _: {},
  vendedorId: number
): Promise<string | null> {
  if (vendedorId === 1 || vendedorId === 3) {
    return `📊 Acceso autorizado: estás viendo estadísticas avanzadas.`
  }

  // No responder si no está autorizado
  return null
}
