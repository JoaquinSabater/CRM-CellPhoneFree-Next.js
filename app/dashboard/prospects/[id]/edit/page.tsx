import EditProspectoForm from '@/app/ui/invoices/prospects/editProspecto';
import { getProspectoById,getAllProvincias,getAllLocalidades,getVendedores} from '@/app/lib/data';

export default async function Page(props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params;
  const [prospecto,provincias,localidades, vendedores] = await Promise.all([
    getProspectoById(Number(id)),
    getAllProvincias(),
    getAllLocalidades(),
    getVendedores(),
  ]);
  console.log('ID recibido prospecto:', id);

  if (!prospecto) {
    return <div className="p-4 text-red-600">Prospecto no encontrado.</div>;
  }

  return <EditProspectoForm prospecto={prospecto} provincias={provincias} localidades={localidades} vendedores={vendedores}  />;
}
