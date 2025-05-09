import { fetchPedidosPorMes } from '@/app/lib/data';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const clienteId = searchParams.get('id');

  if (!clienteId) {
    return new Response(JSON.stringify({ error: 'Cliente ID es requerido' }), { status: 400 });
  }

  try {
    const data = await fetchPedidosPorMes(Number(clienteId));
    return new Response(JSON.stringify(data), { status: 200 });
  } catch (error) {
    console.error('Error al obtener los pedidos:', error);
    return new Response(JSON.stringify({ error: 'Error al obtener los pedidos' }), { status: 500 });
  }
}