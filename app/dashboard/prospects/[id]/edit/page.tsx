import EditProspectoForm from '@/app/ui/invoices/editProspecto';
import { getProspectoById } from '@/app/lib/data';

export default async function Page(props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params;
  const [prospecto] = await Promise.all([getProspectoById(Number(id))]);
  console.log('ID recibido prospecto:', id);

  if (!prospecto) {
    return <div className="p-4 text-red-600">Prospecto no encontrado.</div>;
  }

  return <EditProspectoForm prospecto={prospecto} />;
}
