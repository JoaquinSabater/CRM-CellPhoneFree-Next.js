"use client";

import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function CustomerTypeFilter() {
  const router = useRouter();
  const [selectedType, setSelectedType] = useState('');

  const handleFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const type = e.target.value;
    setSelectedType(type);
    router.push(`/dashboard/invoices?query=${type}`);
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