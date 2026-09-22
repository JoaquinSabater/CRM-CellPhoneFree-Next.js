import { Badge, type BadgeTone } from '@/app/ui/components/Badge';
import { ESTADOS_PROSPECTO } from '@/app/lib/prospect-options';

const TONE_BY_ESTADO: Record<string, BadgeTone> = {
  nuevo: 'info',
  seguimiento: 'warning',
  estancado: 'brand',
  inactivo: 'neutral',
  ganado: 'success',
  perdido: 'danger',
};

export function EstadoProspectoBadge({ estado }: { estado: string }) {
  const label = ESTADOS_PROSPECTO.find(({ value }) => value === estado)?.label ?? estado;
  const tone = TONE_BY_ESTADO[estado] ?? 'neutral';
  return <Badge tone={tone}>{label}</Badge>;
}
