'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Bars3Icon, PowerIcon, XMarkIcon } from '@heroicons/react/24/outline';
import NavLinks from '@/app/ui/dashboard/nav-links';
import CellPhoneFreeLogo from '@/app/ui/cellphonefree-logo';

function LogoutForm({ signOutAction }: { signOutAction: () => Promise<void> }) {
  return (
    <form action={signOutAction}>
      <button className="flex w-full items-center gap-2 rounded-md px-4 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900">
        <PowerIcon className="h-5 w-5" />
        <span>Cerrar sesión</span>
      </button>
    </form>
  );
}

function SidebarContent({
  rol,
  signOutAction,
  onNavigate,
}: {
  rol?: string | null;
  signOutAction: () => Promise<void>;
  onNavigate?: () => void;
}) {
  return (
    <div className="flex h-full flex-col">
      <Link href="/" className="flex items-center px-4 py-5" onClick={onNavigate}>
        <div className="w-28 text-slate-900">
          <CellPhoneFreeLogo />
        </div>
      </Link>
      <nav className="flex-1 space-y-1 overflow-y-auto px-3" onClick={onNavigate}>
        <NavLinks rol={rol} />
      </nav>
      <div className="border-t border-slate-200 px-3 py-3">
        <LogoutForm signOutAction={signOutAction} />
      </div>
    </div>
  );
}

export default function Sidebar({
  rol,
  signOutAction,
}: {
  rol?: string | null;
  signOutAction: () => Promise<void>;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <div className="flex items-center justify-between border-b border-slate-200 bg-white px-4 py-3 md:hidden">
        <Link href="/" className="flex items-center">
          <div className="w-24 text-slate-900">
            <CellPhoneFreeLogo />
          </div>
        </Link>
        <button
          onClick={() => setOpen(true)}
          className="rounded-md p-2 text-slate-600 hover:bg-slate-100"
          aria-label="Abrir menú"
        >
          <Bars3Icon className="h-6 w-6" />
        </button>
      </div>

      {open && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div
            className="fixed inset-0 bg-slate-900/40"
            onClick={() => setOpen(false)}
          />
          <div className="fixed inset-y-0 left-0 w-64 bg-white shadow-xl">
            <div className="flex justify-end p-2">
              <button
                onClick={() => setOpen(false)}
                className="rounded-md p-2 text-slate-600 hover:bg-slate-100"
                aria-label="Cerrar menú"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>
            <SidebarContent rol={rol} signOutAction={signOutAction} onNavigate={() => setOpen(false)} />
          </div>
        </div>
      )}

      <div className="hidden md:flex md:w-64 md:flex-none md:flex-col md:border-r md:border-slate-200 md:bg-white">
        <SidebarContent rol={rol} signOutAction={signOutAction} />
      </div>
    </>
  );
}
