import { getPedidosPreliminaresPorVendedor } from '@/app/lib/data';
import PedidosPreliminaresList from './PedidosPreliminaresList';

export default async function PedidosPreliminares({ vendedorId }: { vendedorId: number }) {
  const pedidosIniciales = await getPedidosPreliminaresPorVendedor(vendedorId);

  return <PedidosPreliminaresList pedidosIniciales={pedidosIniciales} vendedorId={vendedorId} />;
}