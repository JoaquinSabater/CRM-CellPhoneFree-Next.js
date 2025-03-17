"use client";

import { useRouter, useSearchParams } from 'next/navigation';
import { useState, useEffect } from 'react';

export default function CustomerLimitFilter() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [selectedLimit, setSelectedLimit] = useState('');

  useEffect(() => {
    const limit = searchParams.get('limit') || '';
    setSelectedLimit(limit);
  }, [searchParams]);

  const handleFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const limit = e.target.value;
    setSelectedLimit(limit);
    const query = searchParams.get('query') || '';
    const type = searchParams.get('type') || '';
    router.push(`/dashboard/invoices?query=${query}&type=${type}&limit=${limit}`);
  };

  return (
    <select
      value={selectedLimit}
      onChange={handleFilterChange}
      className="rounded-md border border-gray-300 text-xs hover:bg-grey-400 focus:outline-none focus:ring-2 focus:ring-grey-400"
      >
      <option value="">Customer Limit</option>
      <option value="3000">3000</option>
      <option value="5000">5000</option>
      <option value="10000">10000</option>
    </select>
  );
}