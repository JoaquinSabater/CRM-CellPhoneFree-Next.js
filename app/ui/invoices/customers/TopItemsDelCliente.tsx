'use client';

type TopItem = {
  item_nombre: string;
  total_comprado: number;
};

type Props = {
  items: TopItem[];
};

export default function TopItemsDelCliente({ items }: Props) {
  return (
    <div className="space-y-4 bg-gray-50 rounded-lg p-4 border">
      <label className="text-lg font-semibold">Top artículos comprados</label>

      <div className="max-h-96 overflow-y-auto space-y-3">
        {items.length === 0 ? (
          <p className="text-gray-500 text-sm">Este cliente no tiene artículos comprados.</p>
        ) : (
          items.map((item, index) => (
            <div
              key={index}
              className="text-sm text-gray-800 border-b last:border-none pb-2 flex justify-between"
            >
              <span>{item.item_nombre}</span>
              <span className="font-medium">{item.total_comprado} unidades</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
