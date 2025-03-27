import Image from 'next/image';
import { lusitana } from '@/app/ui/fonts';
import { auth } from '../lib/auth';
import { getVendedorById } from '../lib/data';

export default async function SellerPic() {
  const session = await auth();
  console.log('[SellerPic] Session:', session);

  const vendedorId = session?.user?.vendedor_id;
  console.log('[SellerPic] Vendedor ID desde sesión:', vendedorId);

  if (!vendedorId) {
    return <div className="text-red-500">No se pudo cargar la información del vendedor.</div>;
  }

  const vendedor = await getVendedorById(vendedorId);
  console.log('[SellerPic] Vendedor desde DB:', vendedor);

  if (!vendedor) {
    return <div className="text-red-500">Vendedor no encontrado.</div>;
  }

  return (
    <div className={`${lusitana.className} flex flex-col items-center p-4 bg-gray-100 rounded-lg`}>
      <Image
        src={vendedor.url_imagen || '/sellers/default.png'}
        alt={vendedor.nombre}
        width={220}
        height={220}
        className="rounded-full object-cover"
      />
      <div className="mt-4 text-center">
        <h2 className="text-lg font-semibold text-gray-800">{vendedor.nombre}</h2>
        <p className="text-sm text-gray-600">{vendedor.rol}</p>
        <p className="text-sm text-gray-600">{vendedor.email || 'Sin email'}</p>
      </div>
    </div>
  );
}

