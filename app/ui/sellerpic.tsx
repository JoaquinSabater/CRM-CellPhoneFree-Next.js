import Image from 'next/image';
import { lusitana } from '@/app/ui/fonts';

export default function SellerPic() {
  return (
    <div className={`${lusitana.className} flex flex-col items-center p-4 bg-gray-100 rounded-lg`}>
      <Image
        src="/sellers/joel.png"
        alt="Company Logo"
        width={220}
        height={220}
        className="rounded-full"
      />
      <div className="mt-4 text-center">
        <h2 className="text-lg font-semibold text-gray-800">Joel Smith</h2>
        <p className="text-sm text-gray-600">CEO & Founder</p>
        <p className="text-sm text-gray-600">joel@example.com</p>
      </div>
    </div>
  );
}