export function detectarTopItemsVendidos(mensaje: string) {
  const texto = mensaje.toLowerCase();

  // Patrones para detectar "top X productos en Y días" - SIN usar la palabra "items"
  const patrones = [
    /top\s+(\d+)\s+productos?\s+(?:más\s+)?(?:vendidos?|populares?)\s+(?:en\s+)?(?:los?\s+)?(?:últimos?\s+)?(\d+)\s+días?/i,
    /(?:qué|cuáles?|mostrame|dame)\s+(?:son\s+)?(?:los\s+)?(\d+)\s+productos?\s+(?:más\s+)?(?:vendidos?|populares?)\s+(?:en\s+)?(?:los?\s+)?(?:últimos?\s+)?(\d+)\s+días?/i,
    /(?:los\s+)?(\d+)\s+productos?\s+(?:más\s+)?(?:vendidos?|populares?)\s+(?:de\s+)?(?:los?\s+)?(?:últimos?\s+)?(\d+)\s+días?/i,
    /ranking\s+(?:de\s+)?(?:los\s+)?(\d+)\s+productos?\s+(?:en\s+)?(?:los?\s+)?(?:últimos?\s+)?(\d+)\s+días?/i,
    /(?:mejores?\s+)?(\d+)\s+productos?\s+(?:más\s+)?(?:vendidos?|populares?)\s+(?:en\s+)?(?:los?\s+)?(?:últimos?\s+)?(\d+)\s+días?/i,
  ];

  for (const patron of patrones) {
    const match = texto.match(patron);
    if (match) {
      const topN = parseInt(match[1]);
      const dias = parseInt(match[2]);
      
      if (topN > 0 && topN <= 50 && dias > 0 && dias <= 365) {
        return {
          intent: 'top_items_vendidos',
          entities: { 
            topN: topN,
            ultimosDias: dias 
          }
        };
      }
    }
  }

  return { intent: 'desconocido', entities: {} };
}