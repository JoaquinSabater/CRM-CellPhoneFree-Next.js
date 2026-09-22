export function formatRelativeTime(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const diffMin = Math.round(diffMs / 60_000);

  if (diffMin < 1) return 'ahora';
  if (diffMin < 60) return `hace ${diffMin} min`;

  const diffHoras = Math.round(diffMin / 60);
  if (diffHoras < 24) return `hace ${diffHoras} h`;

  const diffDias = Math.round(diffHoras / 24);
  if (diffDias < 7) return `hace ${diffDias} d`;

  return new Date(iso).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit' });
}
