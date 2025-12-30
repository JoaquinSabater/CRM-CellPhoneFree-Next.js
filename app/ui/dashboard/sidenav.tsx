import Link from 'next/link';
import NavLinks from '@/app/ui/dashboard/nav-links';
import { PowerIcon } from '@heroicons/react/24/outline';
import  CellPhoneFreeLogo  from '@/app/ui/cellphonefree-logo';
import { signOut } from '@/app/lib/auth';

export default function SideNav() {
  return (
    <div className="flex items-center justify-between px-4 py-2 bg-orange-600 shadow-md">
      <Link
        className="flex items-center"
        href="/"
      >
        <div className="w-24 text-white">
          <CellPhoneFreeLogo />
        </div>
      </Link>
      <div className="flex items-center space-x-4">
        <NavLinks />
        <form action={async () => {
            'use server';
            await signOut({ redirectTo: '/' });
          }}>
          <button className="flex items-center gap-2 rounded-md bg-orange-500 hover:bg-orange-700 px-4 py-2 text-sm font-medium text-white transition-colors">
            <PowerIcon className="w-5 h-5" />
            <span>Sign Out</span>
          </button>
        </form>
      </div>
    </div>
  );
}
