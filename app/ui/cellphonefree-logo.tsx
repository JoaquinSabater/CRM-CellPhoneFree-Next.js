import Image from 'next/image';
import { lusitana } from '@/app/ui/fonts';

export default function CellPhoneFreeLogo() {
  return (
    <div
      className={`${lusitana.className} flex flex-row items-center leading-none text-white`}
    >
      <Image src="/CellPhoneFreeLogos/cellphonesinfondo.png" alt="Company Logo" width={130} height={130} />
    </div>
  );
}