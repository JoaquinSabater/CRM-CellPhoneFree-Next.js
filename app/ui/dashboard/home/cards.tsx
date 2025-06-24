import {
  UserGroupIcon,
  InboxIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/outline';
import { lusitana } from '@/app/ui/fonts';
import {
  getCantidadClientesPorVendedor,
  getCantidadPedidosDelMes,
  getCantidadProspectosPorCaptador,
  getCantidadProspectosConvertidosPorCaptador,
} from '@/app/lib/data';
import { auth } from '@/app/lib/auth';

const iconMap = {
  clientes: UserGroupIcon,
  pedidos: InboxIcon,
  prospectos: UserGroupIcon,
  prospectosConvertidos: CheckCircleIcon,
};

export async function CardWrapper() {
  const session = await auth();
  const vendedorId = session?.user?.vendedor_id;
  const captadorId = 1; //session?.user?.captador_id;
  const rol = session?.user?.rol;

  if (rol === 'vendedor') {
    if (!vendedorId) return null;
    const [cantidadClientes, cantidadPedidosMes] = await Promise.all([
      getCantidadClientesPorVendedor(vendedorId),
      getCantidadPedidosDelMes(vendedorId),
    ]);
    return (
      <div className="flex flex-col gap-4">
        <Card title="Clientes" value={cantidadClientes} type="clientes" />
        <Card title="Pedidos del Mes" value={cantidadPedidosMes} type="pedidos" />
      </div>
    );
  }

  if (rol === 'captador') {
    if (!captadorId) return null;
    const [cantidadProspectos, cantidadProspectosConvertidos] = await Promise.all([
      getCantidadProspectosPorCaptador(Number(captadorId)),
      getCantidadProspectosConvertidosPorCaptador(Number(captadorId)),
    ]);
    return (
      <div className="flex flex-col gap-4">
        <Card title="Prospectos" value={cantidadProspectos} type="prospectos" />
        <Card title="Prospectos Convertidos" value={cantidadProspectosConvertidos} type="prospectosConvertidos" />
      </div>
    );
  }

  return null;
}

export function Card({
  title,
  value,
  type,
}: {
  title: string;
  value: number | string;
  type: 'clientes' | 'pedidos' | 'prospectos' | 'prospectosConvertidos';
}) {
  const Icon = iconMap[type];

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-sm">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-md font-semibold text-gray-800">{title}</h3>
        {Icon && <Icon className="h-5 w-5 text-gray-400" />}
      </div>
      <div className="text-center text-4xl font-bold text-gray-900">{value}</div>
    </div>
  );
}
