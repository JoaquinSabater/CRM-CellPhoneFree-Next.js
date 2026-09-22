export async function handleAccesoEstadisticasAvanzadas(
  _: {},
  vendedorId: number | null
): Promise<string | null> {
  // vendedorId en null = super usuario (ve todo)
  if (vendedorId === null || vendedorId === 1 || vendedorId === 3) {
    return `
    📊 <b>Estadísticas disponibles:</b><br><br>
    • <a href="/dashboard/estadisticas/general" target="_blank">Estadísticas Generales</a><br>
    • <a href="/dashboard/estadisticas/santi-sala" target="_blank">Estadísticas Santi Sala</a><br>
    • <a href="/dashboard/estadisticas/joel" target="_blank">Estadísticas Joel</a><br>
    • <a href="/dashboard/estadisticas/santi-romeral" target="_blank">Estadísticas Santi Romeral</a><br>
    • <a href="/dashboard/estadisticas/lulu" target="_blank">Estadísticas Lulu</a><br>
    • <a href="/dashboard/estadisticas/franco" target="_blank">Estadísticas Franco</a><br>
    • <a href="/dashboard/estadisticas/chamaco" target="_blank">Estadísticas Chamaco</a><br>
    `
  }

  return null
}
