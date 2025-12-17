// app/dashboard/prospects/[id]/edit/page.tsx
import EditProspectoForm from '@/app/ui/invoices/prospects/editProspecto';
import { 
  getProspectoById,
  getAllProvincias,
  getAllLocalidades,
  getVendedores,
  getCondicionesIva,
  getCondicionesIibb
} from '@/app/lib/data';

// 🆕 AGREGAR ESTAS LÍNEAS PARA FORZAR RECARGA
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function Page(props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params;
  
  console.log('🔍 [DEBUG] Cargando página de edición para prospecto:', id);
  
  const [prospecto, provincias, localidades, vendedores, condicionesIva, condicionesIibb] = await Promise.all([
    getProspectoById(Number(id)),
    getAllProvincias(),
    getAllLocalidades(),
    getVendedores(),
    getCondicionesIva(),
    getCondicionesIibb(),
  ]);
  
  console.log('📊 [DEBUG] Prospecto obtenido:', {
    id: prospecto?.id,
    nombre: prospecto?.nombre,
    timestamp: new Date().toISOString()
  });

  if (!prospecto) {
    return <div className="p-4 text-red-600">Prospecto no encontrado.</div>;
  }

  return (
    <EditProspectoForm 
      prospecto={prospecto} 
      provincias={provincias} 
      localidades={localidades} 
      vendedores={vendedores}
      condicionesIva={condicionesIva}
      condicionesIibb={condicionesIibb}
    />
  );
}