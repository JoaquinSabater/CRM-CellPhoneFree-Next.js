import SideNav from '@/app/ui/dashboard/sidenav';

export const experimental_ppr = true;

 
export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen flex-col">
      <div className="w-full flex-none">
        <SideNav />
      </div>
      <div className="flex-grow overflow-y-auto p-6 md:p-12">{children}</div>
    </div>
  );
}