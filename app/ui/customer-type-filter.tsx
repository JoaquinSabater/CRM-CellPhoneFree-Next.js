"use client";

import { useRouter, useSearchParams } from 'next/navigation';
import { useState, useEffect } from 'react';

export default function CustomerTypeFilter() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [selectedType, setSelectedType] = useState('');

  useEffect(() => {
    const type = searchParams.get('type') || '';
    setSelectedType(type);
  }, [searchParams]);

  const handleFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const type = e.target.value;
    setSelectedType(type);
    const query = searchParams.get('query') || '';
    const limit = searchParams.get('limit') || '';
    router.push(`/dashboard/invoices?query=${query}&type=${type}&limit=${limit}`);
  };

  return (
    <select
      value={selectedType}
      onChange={handleFilterChange}
      className="rounded-md border border-gray-300 text-xs hover:bg-grey-400 focus:outline-none focus:ring-2 focus:ring-grey-400"
      >
      <option value="">Customer Type</option>
      <option value="Chico">Chico</option>
      <option value="Mediano">Mediano</option>
      <option value="Grande">Grande</option>
    </select>
  );
}