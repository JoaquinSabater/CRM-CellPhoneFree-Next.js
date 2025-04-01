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
    <div className="rounded-xl bg-gray-50 p-2 shadow-sm">
      <div className="flex p-4">
        {Icon ? <Icon className="h-5 w-5 text-gray-700" /> : null}
        <h3 className="ml-2 text-sm font-medium">{title}</h3>
      </div>
      <p
        className={`${lusitana.className}
          truncate rounded-xl bg-white px-4 py-8 text-center text-2xl`}
      >
        {value}
      </p>
    </div>
  );
}