export function detectarAyuda(mensaje: string) {
  const texto = mensaje.trim().toLowerCase()
  if (texto === 'ayuda' || texto === 'help' || texto === '?') {
    return { intent: 'mostrar_ayuda', entities: {} }
  }
  return { intent: 'desconocido', entities: {} }
}