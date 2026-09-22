import { Badge, type BadgeTone } from '@/app/ui/components/Badge';

const ESTADOS_CHAT: Record<string, { label: string; tone: BadgeTone }> = {
  nuevo: { label: 'Nuevo', tone: 'info' },
  esperando_info: { label: 'Esperando info', tone: 'warning' },
  apto: { label: 'Apto', tone: 'success' },
  no_apto: { label: 'No apto', tone: 'danger' },
  derivado: { label: 'Derivado', tone: 'brand' },
};

export function EstadoChatBadge({ estado }: { estado: string }) {
  const { label, tone } = ESTADOS_CHAT[estado] ?? { label: estado.replace(/_/g, ' '), tone: 'neutral' as const };
  return <Badge tone={tone}>{label}</Badge>;
}
