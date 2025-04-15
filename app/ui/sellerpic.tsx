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
    <div className="bg-white p-6 rounded-lg shadow-lg max-w-md mx-auto">
      {/* Imagen del vendedor */}
      <Image
        src={userData.url_imagen || '/sellers/default.png'}
        alt={userData.nombre}
        width={600}
        height={300}
        className="rounded-full object-cover"
      />

      {/* Información */}
      <h2 className="text-2xl md:text-3xl font-semibold my-4 text-gray-900">
        {userData.nombre}
      </h2>
      <p className="text-base text-gray-800 capitalize mb-2">
        Rol: {rol}
      </p>
      <p className="text-base text-gray-800 mb-4">
        Email: {userData.email || 'Sin email'}
      </p>

      {/* Botón (opcional) */}
      <div className="mt-4">
        <a
          href={`mailto:${userData.email}`}
          className="bg-black text-white px-4 py-2 rounded"
        >
          Contactar
        </a>
      </div>
    </div>
  );
}



