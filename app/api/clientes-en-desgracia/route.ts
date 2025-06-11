import { fetchClientesEnDesgraciaPorVendedor } from '@/app/lib/data';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const vendedorId = searchParams.get('vendedorId');

  if (!vendedorId) {
    return new Response(JSON.stringify({ error: 'vendedorId es requerido' }), { status: 400 });
  }

  try {
    const data = await fetchClientesEnDesgraciaPorVendedor(Number(vendedorId));
    return new Response(JSON.stringify(data), { status: 200 });
  } catch (error) {
    console.error('Error al obtener los clientes en desgracia:', error);
    return new Response(JSON.stringify({ error: 'Error al obtener los clientes en desgracia' }), { status: 500 });
  }
}
