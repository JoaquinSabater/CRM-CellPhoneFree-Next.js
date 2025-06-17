// intencion_top_clientes_item_dias.ts

export function detectarTopClientesPorItemDias(mensaje: string) {
  const texto = mensaje.toLowerCase();

  // Permite frases como:
  // top 5 clientes que más compraron silky 2.0 en los últimos 5 días
  // top clientes que más compraron vidrio hace 7 días
  const patrones: [RegExp, Array<number | null>][] = [
    [/top\s+(\d+)\s+clientes\s+que\s+compraron\s+(.+)\s*hace\s+(\d+)\s+d[ií]as?/i, [1,2,3]],
    [/top\s+clientes\s+que\s+compraron\s+(.+)\s*hace\s+(\d+)\s+d[ií]as?/i, [null,1,2]],
    [/top\s+(\d+)\s+clientes\s+que\s+compraron\s+(.+)\s*en\s+los\s+[úu]ltimos\s+(\d+)\s+d[ií]as?/i, [1,2,3]],
    [/top\s+clientes\s+que\s+compraron\s+(.+)\s*en\s+los\s+[úu]ltimos\s+(\d+)\s+d[ií]as?/i, [null,1,2]],
  ];

  for (const [regex, grupos] of patrones) {
    const match = texto.match(regex);
    if (match) {
      let limite = 10, item = null, dias = null;
      if (grupos[0] != null) limite = parseInt(match[grupos[0]]);
      if (grupos[1] != null) item = match[grupos[1]].trim();
      if (grupos[2] != null) dias = parseInt(match[grupos[2]]);
      console.log('[TOP CLIENTES INTENT DIAS] Detectado:', { limite, item, dias });
      if (item && dias != null && !isNaN(dias)) {
        return {
          intent: 'top_clientes_por_item_dias',
          entities: { item, limite, dias },
        };
      }
    }
  }

  return { intent: 'desconocido', entities: {} }
}
