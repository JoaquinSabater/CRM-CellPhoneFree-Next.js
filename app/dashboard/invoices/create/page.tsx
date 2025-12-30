import CreateClienteForm from '@/app/ui/invoices/customers/create-form';
import { getAllProvincias, getAllLocalidades, getCondicionesIVA, getCondicionesIIBB, getVendedores } from '@/app/lib/data';

export default async function Page() {
  const [provincias, localidades, condicionesIVA, condicionesIIBB, vendedoresData] = await Promise.all([
    getAllProvincias(),
    getAllLocalidades(),
    getCondicionesIVA(),
    getCondicionesIIBB(),
    getVendedores(),
  ]);

  const vendedores = vendedoresData as { id: number; nombre: string; }[];

  return (
    <div className="max-w-6xl mx-auto">
      <h1 className="text-2xl font-semibold mb-6">✨ Crear Nuevo Cliente</h1>
      <CreateClienteForm 
        provincias={provincias} 
        localidades={localidades}
        condicionesIVA={condicionesIVA}
        condicionesIIBB={condicionesIIBB}
        vendedores={vendedores}
      />
    </div>
  );
}
