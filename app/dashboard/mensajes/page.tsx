import { auth } from '@/app/lib/auth';
import { redirect } from 'next/navigation';
import { MensajesView } from '@/app/ui/mensajes/MensajesView';
import { getConversaciones } from '@/app/lib/mensajes';
import { puedeVerComercial } from '@/app/lib/roles';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function MensajesPage() {
  const session = await auth();
  const rol = session?.user?.rol;

  if (!puedeVerComercial(rol)) {
    redirect('/dashboard');
  }

  const conversaciones = await getConversaciones();

  return (
    <div className="w-full">
      <h1 className="mb-4 text-xl font-semibold text-slate-900">Mensajes</h1>
      <MensajesView conversaciones={conversaciones} />
    </div>
  );
}
