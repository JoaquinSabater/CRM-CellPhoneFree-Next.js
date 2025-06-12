'use client';

import { useEffect, useState } from 'react';
import GraficoItemPorSemanaChart from '@/app/ui/dashboard/GraficoItemPorSemanaChart';

type Item = { id: number; nombre: string };

export default function GraficoPorItemListBox({ vendedorId }: { vendedorId: number }) {
  const [items, setItems] = useState<Item[]>([]);
  const [selected, setSelected] = useState<Item | null>(null);
  const [labels, setLabels] = useState<string[]>([]);
  const [data, setData] = useState<number[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch('/api/items')
      .then(res => res.json())
      .then(setItems);
  }, []);

  useEffect(() => {
    if (!selected) return;
    setLoading(true);
    fetch(`/api/grafico-item-semana?item=${encodeURIComponent(selected.nombre)}&vendedorId=${vendedorId}`)
      .then(res => res.json())
      .then(res => {
        setLabels(res.labels || []);
        setData(res.data || []);
        setLoading(false);
      });
  }, [selected, vendedorId]);

  return (
    <div className="bg-white rounded-lg p-4 border shadow-sm mt-6 w-full text-gray-500">
      <div className="mb-2 font-semibold">Ver evolución semanal de un ítem:</div>
      <select
        className="border rounded px-2 py-1 mb-4 w-full" // <-- agrega w-full aquí
        value={selected?.id || ''}
        onChange={e => {
          const item = items.find(i => i.id === Number(e.target.value));
          setSelected(item || null);
        }}
      >
        <option value="">Seleccionar ítem...</option>
        {items.map(item => (
          <option key={item.id} value={item.id}>{item.nombre}</option>
        ))}
      </select>
      {loading && <div className="text-gray-500">Cargando gráfico...</div>}
      {!loading && selected && labels.length > 0 && (
        <GraficoItemPorSemanaChart
          labels={labels}
          data={data}
          title={`Unidades vendidas de "${selected.nombre}"`}
        />
      )}
      {!loading && selected && labels.length === 0 && (
        <div className="text-gray-500">No hay ventas para este ítem en las últimas semanas.</div>
      )}
    </div>
  );
}