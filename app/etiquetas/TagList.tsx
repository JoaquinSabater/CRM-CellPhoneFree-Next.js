// ✅ Ruta: app/dashboard/etiquetas/TagList.tsx
import { getEtiquetasGlobales } from '@/app/lib/etiquetas';

export default async function TagList() {
  const etiquetas = await getEtiquetasGlobales();

  if (!etiquetas.length) {
    return <p className="text-sm text-gray-500">No hay etiquetas registradas.</p>;
  }

  return (
    <div className="mt-4">
      <h2 className="text-lg font-semibold mb-2">Etiquetas existentes</h2>
      <ul className="flex flex-wrap gap-2">
        {etiquetas.map((etiqueta) => (
          <li
            key={etiqueta.id}
            className="bg-orange-100 text-orange-800 px-3 py-1 rounded-full text-sm"
          >
            {etiqueta.nombre}
          </li>
        ))}
      </ul>
    </div>
  );
}
