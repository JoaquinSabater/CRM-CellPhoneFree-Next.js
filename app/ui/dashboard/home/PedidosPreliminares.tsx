import { getPedidosPreliminaresPorVendedor } from '@/app/lib/data';
import PedidosPreliminaresList from './PedidosPreliminaresList';

export default async function PedidosPreliminares({ vendedorId }: { vendedorId: number }) {
  const pedidos = await getPedidosPreliminaresPorVendedor(vendedorId);

  return <PedidosPreliminaresList pedidos={pedidos} />;
}