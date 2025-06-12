import { getGraficoItemPorSemana } from '@/app/lib/data';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const item = searchParams.get('item');
  const vendedorId = Number(searchParams.get('vendedorId'));

  if (!item || isNaN(vendedorId)) {
    return new Response(JSON.stringify({ error: 'Parámetros inválidos' }), { status: 400 });
  }

  const rows = await getGraficoItemPorSemana(item, vendedorId);

  return new Response(JSON.stringify({
    labels: rows.map(r => `Semana ${r.semana}`),
    data: rows.map(r => r.total_vendido),
  }), { status: 200 });
}