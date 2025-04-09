import { CardWrapper } from '@/app/ui/dashboard/cards';
import Sellerpic from '../ui/sellerpic';

export default async function Page() {
  return (
    <main className="flex gap-2">
      <div className="flex flex-wrap items-start justify-center gap-10 mt-2">
        <Sellerpic />
        <div className="flex flex-col gap-9">
          <CardWrapper />
        </div>
      </div>
    </main>
  );
}


