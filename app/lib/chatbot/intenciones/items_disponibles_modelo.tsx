export function detectarItemsDisponiblesPorModelo(mensaje: string) {
  const texto = mensaje.toLowerCase();

  // Patrones flexibles para distintas frases
  const patrones = [
    /qué\s+(items|ítems|productos|artículos)\s+(hay|tiene|disponibles|puedo ofrecer)\s+para\s+(el\s+modelo\s+)?([a-z0-9\s\-\+\.]+)/i,
    /mostrame\s+(los\s+)?(items|ítems|productos|artículos)\s+(disponibles\s+)?para\s+([a-z0-9\s\-\+\.]+)/i,
    /stock\s+disponible\s+de\s+(items|ítems|productos|artículos)\s+para\s+([a-z0-9\s\-\+\.]+)/i,
    /(items|ítems|productos|artículos)\s+disponibles\s+para\s+([a-z0-9\s\-\+\.]+)/i,
  ];

  for (const p of patrones) {
    const match = texto.match(p);
    if (match) {
      // El modelo siempre es el último grupo
      const modelo = match[match.length - 1]?.trim();
      if (modelo) {
        return {
          intent: 'items_disponibles_por_modelo',
          entities: { modelo }
        };
      }
    }
  }

  return { intent: 'desconocido', entities: {} };
}
