import {
  UserGroupIcon,
  InboxIcon,
} from '@heroicons/react/24/outline';
import { lusitana } from '@/app/ui/fonts';
import { getCantidadClientesPorVendedor, getCantidadPedidosDelMes } from '@/app/lib/data';
import { auth } from '@/app/lib/auth';

const iconMap = {
  clientes: UserGroupIcon,
  pedidos: InboxIcon,
};

export async function CardWrapper() {
  const session = await auth();
  const vendedorId = session?.user?.vendedor_id;

  if (!vendedorId) return null;

  const [cantidadClientes, cantidadPedidosMes] = await Promise.all([
    getCantidadClientesPorVendedor(vendedorId),
    getCantidadPedidosDelMes(vendedorId),
  ]);

  return (
    <>
      <Card title="Clientes" value={cantidadClientes} type="clientes" />
      <Card title="Pedidos del Mes" value={cantidadPedidosMes} type="pedidos" />
    </>
  );
}

export function Card({
  title,
  value,
  type,
}: {
  title: string;
  value: number | string;
  type: 'clientes' | 'pedidos';
}) {
  const Icon = iconMap[type];

  return (
    <div className="w-[240px] h-[140px] rounded-xl border border-gray-200 bg-white shadow-sm">
      <div className="flex justify-between items-center p-4">
        <h3 className="text-sm font-medium text-gray-800">{title}</h3>
        {Icon && <Icon className="h-5 w-5 text-gray-400" />}
      </div>
      <div className="flex items-center justify-center px-4 py-4 text-3xl font-semibold text-gray-900">
        {value}
      </div>
    </div>
  );
}

