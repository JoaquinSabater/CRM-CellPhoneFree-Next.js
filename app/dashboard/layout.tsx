import SideNav from '@/app/ui/dashboard/sidenav';

export const experimental_ppr = true;

 
export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen flex-col bg-slate-50 md:flex-row">
      <SideNav />
      <div className="flex-1 overflow-y-auto p-4 md:p-8">{children}</div>
    </div>
  );
}