import { getSolicitudesCuentaCorrientePendientes } from '@/app/lib/cuenta-corriente';
import SolicitudesCuentaCorrienteList from './SolicitudesCuentaCorrienteList';

export default async function SolicitudesCuentaCorriente() {
  const solicitudes = await getSolicitudesCuentaCorrientePendientes();

  return <SolicitudesCuentaCorrienteList solicitudes={solicitudes} />;
}
