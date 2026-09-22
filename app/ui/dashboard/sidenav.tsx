import Sidebar from '@/app/ui/dashboard/Sidebar';
import { auth, signOut } from '@/app/lib/auth';

export default async function SideNav() {
  const session = await auth();
  const rol = session?.user?.rol;

  async function signOutAction() {
    'use server';
    await signOut({ redirectTo: '/' });
  }

  return <Sidebar rol={rol} signOutAction={signOutAction} />;
}
