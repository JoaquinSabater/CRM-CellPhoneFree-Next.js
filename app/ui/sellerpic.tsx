import Image from 'next/image';
import { lusitana } from '@/app/ui/fonts';
import { auth } from '../lib/auth';
import { getVendedorById,getCaptadorById } from '../lib/data';

export default async function SellerPic() {
  const session = await auth();
  const rol = session?.user?.rol;

  if (!rol) {
    return <div className="text-red-500">No se pudo determinar el rol del usuario.</div>;
  }

  let userData = null;

  if (rol === 'vendedor') {
    const vendedorId = session.user.vendedor_id;
    if (!vendedorId) {
      return <div className="text-red-500">No se pudo cargar el vendedor.</div>;
    }
    userData = await getVendedorById(vendedorId);
  }

  if (rol === 'captador') {
    const captadorId = session.user.captador_id;
    console.log('captadorId', captadorId);
    if (!captadorId) {
      return <div className="text-red-500">No se pudo cargar el captador.</div>;
    }
    userData = await getCaptadorById(captadorId);
  }

  if (!userData) {
    return <div className="text-red-500">Usuario no encontrado.</div>;
  }

  return (
    <div className={`${lusitana.className} flex flex-col items-center p-1 bg-gray-100 rounded-lg w-[280px]`}>
      <Image
        src={userData.url_imagen || '/sellers/default.png'}
        alt={userData.nombre}
        width={220}
        height={220}
        className="rounded-full object-cover"
      />
      <div className="mt-2 text-center">
        <h2 className="text-lg font-semibold text-gray-800">{userData.nombre}</h2>
        <p className="text-sm text-gray-600 capitalize">{rol}</p>
        <p className="text-sm text-gray-600">{userData.email || 'Sin email'}</p>
      </div>
    </div>
  );
}



