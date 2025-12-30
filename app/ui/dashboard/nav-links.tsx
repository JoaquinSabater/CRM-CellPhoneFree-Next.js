'use client';

import {
  UserGroupIcon,
  HomeIcon,
  RocketLaunchIcon,
  MapIcon,
} from '@heroicons/react/24/outline';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import clsx from 'clsx';

// Aca es donde puedo cambiar los inconos de los links
// Map of links to display in the side navigation.
// Depending on the size of the application, this would be stored in a database.
const links = [
  { 
    name: 'Home', 
    href: '/dashboard', 
    icon: HomeIcon },
  {
    name: 'Customers',
    href: '/dashboard/invoices',
    icon: UserGroupIcon,
  },
  {
    name: 'Mapa',
    href: '/dashboard/mapa',
    icon: MapIcon,
  },
  {
    name: 'ChatBot',
    href: '/dashboard/chatbot',
    icon: RocketLaunchIcon,
  },
];

export default function NavLinks() {
  const pathname = usePathname();
  return (
    <>
      {links.map((link) => {
        const LinkIcon = link.icon;
        return (
          <Link
            key={link.name}
            href={link.href}
            className={clsx(
              'flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-colors',
              {
                'bg-orange-700 text-white': pathname === link.href,
                'text-white hover:bg-orange-500': pathname !== link.href,
              },
            )}
          >
            <LinkIcon className="w-5 h-5" />
            <p>{link.name}</p>
          </Link>
        );
      })}
    </>
  );
}